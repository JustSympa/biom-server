import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import multipart from "@fastify/multipart"
import { reports } from "@models"
import { generatePlantReport } from "@reportservice"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function reportRoutes(fastify: FastifyInstance) {
	// Register multipart support scoped to this plugin
	await fastify.register(multipart, {
		limits: {
			fileSize: MAX_FILE_SIZE,
			files: 4,
		},
	});

	/**
	 * POST /report
	 *
	 * Protected — requires a valid access token.
	 *
	 * Multipart fields:
	 *   - image        (file, required)  — the plant photo
	 *   - latitude     (field, optional) — GPS latitude  e.g. "4.0511"
	 *   - longitude    (field, optional) — GPS longitude e.g. "9.7679"
	 *   - language     (field, optional) — "en" | "fr", defaults to "en"
	 *
	 * Returns: the full PlantReport JSON persisted and forwarded to the client.
	 */
	fastify.post(
		"/report",
		{ preHandler: fastify.authenticate },
		async (request, reply) => {
			const userId = request.user.sub;
			const parts = request.parts();

			const imagesBase64: { img: string, mimeType: string } [] = [];
			// let mimeType: string = "image/jpeg";
			let latitude: number | undefined;
			let longitude: number | undefined;
			let description: string = '';
			let language: "en" | "fr" = "en";

			for await (const part of parts) {
				if (part.type === "file" && part.fieldname === "image") {
					if (ALLOWED_MIME_TYPES.includes(part.mimetype)) {
						const mimeType = part.mimetype;
						const chunks: Buffer[] = [];
						for await (const chunk of part.file) {
							chunks.push(chunk);
						}
						imagesBase64.push({ img: Buffer.concat(chunks).toString("base64"), mimeType});
					}
				} else if (part.type === "field") {
					if (part.fieldname === "latitude" && part.value) {
						const parsed = parseFloat(part.value as string);
						if (!isNaN(parsed)) latitude = parsed;
					}
					if (part.fieldname === "longitude" && part.value) {
						const parsed = parseFloat(part.value as string);
						if (!isNaN(parsed)) longitude = parsed;
					}
					if (part.fieldname === "description") {
						description = part.value as string
					}
					if (part.fieldname === "language") {
						const val = (part.value as string).toLowerCase();
						if (val === "fr") language = "fr";
					}
				}
			}

			if (!imagesBase64.length) {
				return reply.status(400).send({ error: "No image file provided." });
			}
			let plantReport;
			try {
				plantReport = await generatePlantReport({
					imagesBase64,
					latitude,
					longitude,
					description: description,
					language,
				});
			} catch (err: any) {
				fastify.log.error("[report] OpenAI error: %s", err?.message);
				return reply.status(502).send({
					error: "Failed to generate report. Please try again.",
				});
			}

			const [saved] = await fastify.db
				.insert(reports)
				.values({
					responseId: plantReport.metadata.responseId,
					userId,
					report: plantReport,
				})
				.returning();

			return reply.status(201).send({
				...plantReport.metadata,
				id: plantReport.metadata.responseId,
				createdAt: saved.createdAt,
				report: plantReport.report,
			});
		}
	);

	/**
	 * GET /report/history
	 *
	 * Returns the authenticated user's past reports (metadata only, no re-fetching image).
	 */
	fastify.get(
		"/report/history",
		{ preHandler: fastify.authenticate },
		async (request, reply) => {
			const userId = request.user.sub;

			const history = await fastify.db
				.select({
					id: reports.id,
					report: reports.report,
					createdAt: reports.createdAt,
				})
				.from(reports)
				.where(eq(reports.userId, userId))
				.orderBy(reports.createdAt);

			return reply.send(history);
		}
	);
}