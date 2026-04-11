import { FastifyCorsOptions } from "@fastify/cors";
import { FastifyLoggerOptions, RawServerDefault } from 'fastify';
import { PinoLoggerOptions } from 'fastify/types/logger.js';
export declare enum ENV {
    dev = "development",
    test = "testing",
    stage = "staging",
    prod = "production"
}
declare const _default: {
    NODE_ENV: string;
    DB_CONNECTION_STRING: string;
    OPENAI_API_KEY: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    HOST: string;
    PORT: number;
    cors: FastifyCorsOptions;
    logger: FastifyLoggerOptions<RawServerDefault, import("fastify").FastifyRequest<import("fastify").RouteGenericInterface, RawServerDefault, import("http").IncomingMessage, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown, import("fastify").FastifyBaseLogger, import("fastify/types/type-provider.js").ResolveFastifyRequestType<import("fastify").FastifyTypeProviderDefault, import("fastify").FastifySchema, import("fastify").RouteGenericInterface>>, import("fastify").FastifyReply<import("fastify").RouteGenericInterface, RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>> & PinoLoggerOptions<never, boolean>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map