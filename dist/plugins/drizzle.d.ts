import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models/index.js";
export type DrizzleDB = PostgresJsDatabase<typeof schema>;
export interface DrizzlePluginOptions extends FastifyPluginOptions {
    connectionString?: string;
    pool?: postgres.Options<any>;
}
declare module "fastify" {
    interface FastifyInstance {
        db: DrizzleDB;
        queryClient: postgres.Sql<{}>;
    }
}
declare function drizzlePlugin(fastify: FastifyInstance, options: DrizzlePluginOptions): Promise<void>;
declare const _default: typeof drizzlePlugin;
export default _default;
//# sourceMappingURL=drizzle.d.ts.map