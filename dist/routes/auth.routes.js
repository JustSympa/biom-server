import { eq } from "drizzle-orm";
import { users } from "../models/index.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../plugins/jwt.js";
export async function authRoutes(fastify) {
    /**
     * POST /auth/init
     *
     * Called once when the app is opened for the first time.
     * Creates an anonymous user and returns a token pair.
     */
    fastify.post("/auth/init", async (request, reply) => {
        // Create the anonymous user — random name, no email
        const [user] = await fastify.db.insert(users).values({ name: `user${Date.now() - 1767225600000}` }).returning();
        const accessToken = signAccessToken(fastify, user.id);
        const refreshToken = await signRefreshToken(user.id);
        // Persist the refresh token so we can validate it later
        await fastify.db
            .update(users)
            .set({ refreshToken })
            .where(eq(users.id, user.id));
        return reply.status(201).send({ accessToken, refreshToken });
    });
    /**
     * POST /auth/refresh
     * Body: { refreshToken: string }
     *
     * Validates the refresh token, rotates both tokens, and returns a new pair.
     */
    fastify.post("/auth/refresh", {
        schema: {
            body: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: { type: "string" },
                },
            },
        },
    }, async (request, reply) => {
        const { refreshToken } = request.body;
        // 1. Verify the token signature and expiry
        let payload;
        try {
            payload = await verifyRefreshToken(refreshToken);
        }
        catch {
            return reply.status(401).send({ error: "Invalid or expired refresh token" });
        }
        // 2. Look up user and check the token matches what we stored (rotation guard)
        const [user] = await fastify.db
            .select()
            .from(users)
            .where(eq(users.id, payload.sub))
            .limit(1);
        if (!user || user.refreshToken !== refreshToken) {
            // Token reuse detected — a stolen old token was replayed
            // Optionally: nuke the stored refresh token here to force re-init
            return reply.status(401).send({ error: "Refresh token reuse detected" });
        }
        // 3. Issue a new pair (rotation)
        const newAccessToken = signAccessToken(fastify, user.id);
        //   const newRefreshToken = await signRefreshToken(user.id);
        //   await fastify.db
        //     .update(users)
        //     .set({ refreshToken: newRefreshToken })
        //     .where(eq(users.id, user.id));
        return reply.send({
            accessToken: newAccessToken,
            // refreshToken: newRefreshToken,
        });
    });
    /**
     * Example protected route — shows how to guard any route with the access token.
     * DELETE when you add your real routes.
     */
    fastify.get("/auth/me", { preHandler: fastify.authenticate }, async (request, reply) => {
        const { sub: userId } = request.user;
        const [user] = await fastify.db
            .select({ id: users.id, createdAt: users.createdAt })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        if (!user)
            return reply.status(404).send({ error: "User not found" });
        return user;
    });
}
//# sourceMappingURL=auth.routes.js.map