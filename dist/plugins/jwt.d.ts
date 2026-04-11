import { FastifyInstance } from "fastify";
export interface JwtPayload {
    sub: string;
}
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
    interface FastifyRequest {
        user: JwtPayload;
    }
}
declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: JwtPayload;
        user: JwtPayload;
    }
}
declare function jwtPlugin(fastify: FastifyInstance): Promise<void>;
declare const _default: typeof jwtPlugin;
export default _default;
export declare function getRefreshSecret(): NodeJS.NonSharedUint8Array;
/** Sign a short-lived access token (15 min) via @fastify/jwt */
export declare function signAccessToken(fastify: FastifyInstance, userId: string): string;
/** Sign a long-lived refresh token (30 days) with the refresh secret */
export declare function signRefreshToken(userId: string): Promise<string>;
/** Verify a refresh token — returns the payload or throws */
export declare function verifyRefreshToken(token: string): Promise<JwtPayload>;
//# sourceMappingURL=jwt.d.ts.map