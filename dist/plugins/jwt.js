import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import config from "../config/index.js";
async function jwtPlugin(fastify) {
    const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = config;
    if (!JWT_ACCESS_SECRET.length || !JWT_REFRESH_SECRET.length) {
        throw new Error("[jwt-plugin] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables.");
    }
    // Register @fastify/jwt for access tokens
    await fastify.register(jwt, {
        secret: JWT_ACCESS_SECRET,
        sign: { expiresIn: "15m" },
    });
    // Decorator used as preHandler on protected routes
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch {
            reply.status(401).send({ error: "Unauthorized" });
        }
    });
}
export default fp(jwtPlugin, { name: "jwt-plugin" });
import { SignJWT, jwtVerify } from "jose";
const encoder = new TextEncoder();
export function getRefreshSecret() {
    return encoder.encode(config.JWT_REFRESH_SECRET);
}
/** Sign a short-lived access token (15 min) via @fastify/jwt */
export function signAccessToken(fastify, userId) {
    return fastify.jwt.sign({ sub: userId });
}
/** Sign a long-lived refresh token (30 days) with the refresh secret */
export async function signRefreshToken(userId) {
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("90d")
        .setIssuedAt()
        .sign(getRefreshSecret());
}
/** Verify a refresh token — returns the payload or throws */
export async function verifyRefreshToken(token) {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    return payload;
}
//# sourceMappingURL=jwt.js.map