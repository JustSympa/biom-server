import OpenAI from "openai";
import config from "../config/index.js";
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
const ReportSchema = z.object({
    metadata: z.object({
        responseId: z.string(),
        plantName: z.string().nullable(),
        healthStatus: z.enum(["healthy", "diseased", "stressed", "unknown"]),
        severity: z.enum(["low", "medium", "high"]).nullable(),
        disease: z.string().nullable(),
        diseaseDescription: z.string().nullable(),
        confidence: z.number(),
        causes: z.array(z.string()),
        symptoms: z.array(z.string()),
        immediateSolutions: z.array(z.string()),
        longTermSolutions: z.array(z.string()),
        preventionTips: z.array(z.string()),
        disclaimer: z.string(),
    }),
    report: z.string()
});
const INSTRUCTIONS = `
You are an expert plant pathologist and agronomist.
Your job is to analyze plant images and produce a detailed health diagnosis report.
The user will give photos, GPS coordinates of a plant and brief description of what's going wrong.

Using these coordinates, consider:
- The local climate zone (tropical, arid, temperate, etc.)
- Native plants typical to this region
- Diseases and pests common to this geographic area
- Seasonal conditions that may affect plant health

Analyze the plant in the images, taking into consideration GPS info and problem description, and provide a structured diagnosis in which we have:

1. PLANT SPECIES: Identify the plant species or family
2. GEOGRAPHIC CONTEXT: Brief note on the climate/region based on GPS and how it affects this plant
3. DETECTED ISSUES: List any visible diseases, pests, or nutrient deficiencies
4. SEVERITY: Rate as Healthy / Mild / Moderate / Severe
5. PROBABLE CAUSE: Explain what likely caused the issue given the regional conditions
6. TREATMENT: Step-by-step recommended treatment in simple language
7. PREVENTION: Tips to prevent recurrence in this specific climate

If the image does not contain a plant, ajust the response fields.
Keep the language simple enough for a non-expert farmer to understand.
The report and metadata will be in the language specified by the user or in english if no language is specified.

The output will be in JSON in the following format:
{
	metadata: {
		plantName: name of the plant and null if no plant was found in on the images,
		healthStatus: "healthy" | "diseased" | "stressed" | "unknown",
		severity: "low" | "medium" | "high" or null if healthy,
		disease: name of the disease if the plant is sick otherwise null,
		diseaseDescription: as the name suggests and null if healthy,
		confidence: confidence of the diagnosis as a percentage number,
		causes: string[] list the potential cause,
		symptoms: string[] list of observable symptoms,
		immediateSolutions: string[] list of immediate solutions,
		longTermSolutions: string[] list of long term solutions,
		preventionTips: string[] list of prevention tips,
		disclaimer: a short reminder that this is an AI diagnosis and a specialist should be consulted for critical decisions,
	},
	report: The actual full report to be displayed, the text content must be in Markdown Format. Since the user are farmers and plant enthusiasts, the report should not follow a formal tone.
}
`;
function buildUserPrompt(input) {
    const { latitude, longitude, description, language } = input;
    const geoBlock = latitude !== undefined && longitude !== undefined ?
        `Geographic context: latitude ${latitude}, longitude ${longitude}. Use these coordinates to enrich the diagnosis with regional information (climate, local pests, endemic diseases, etc.).`
        : `No GPS data provided.`;
    const langBlock = `The report and Metadata will be in ${language == 'fr' ? 'french' : 'english'}`;
    const contextBlock = `Context(in ${language == 'fr' ? 'french' : 'english'}): ${description}`;
    return `Analyze the attached plant images and generate a complete diagnosis report.
${geoBlock}
${langBlock}
${contextBlock}`;
}
const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});
export async function generatePlantReport(input) {
    const { imagesBase64 } = input;
    const messageContent = imagesBase64.map(img => ({ detail: 'auto', type: 'input_image', image_url: `data:${img.mimeType};base64,${img.img}` }));
    messageContent.push({ type: 'input_text', text: buildUserPrompt(input) });
    const response = await client.responses.parse({
        model: "gpt-5-nano",
        instructions: INSTRUCTIONS,
        input: [{
                role: 'user',
                type: 'message',
                content: messageContent
            }],
        text: {
            format: zodTextFormat(ReportSchema, 'report_schema')
        },
    }, { timeout: 180000 });
    const result = response.output_parsed;
    if (!result)
        throw Error('Report does not follow the specified schema');
    result.metadata.responseId = response.id;
    return result;
}
//# sourceMappingURL=report.service.js.map