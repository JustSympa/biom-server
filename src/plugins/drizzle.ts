import fp from "fastify-plugin"
import { FastifyInstance, FastifyPluginOptions } from "fastify"
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@models"

export type DrizzleDB = PostgresJsDatabase<typeof schema>;


export interface DrizzlePluginOptions extends FastifyPluginOptions {
	connectionString?: string;
	pool?: postgres.Options<any>;
}

declare module "fastify" {
	interface FastifyInstance {
		db: DrizzleDB;
		queryClient: postgres.Sql<{}>
	}
}
async function drizzlePlugin( fastify: FastifyInstance, options: DrizzlePluginOptions ) {
  	const queryClient = postgres(options.connectionString || '');

	const db = drizzle({ client: queryClient, schema, logger: fastify.log.level === "debug" });

	fastify.decorate("db", db);
	fastify.decorate("queryClient", queryClient);

	// Gracefully close the pool when Fastify shuts down
	fastify.addHook("onClose", async (instance) => {
		fastify.log.info("[drizzle-plugin] Closing PostgreSQL pool...");
		await instance.queryClient.end();
	});
}

export default fp(drizzlePlugin, { fastify: ">=4.0.0", name: "fastify-drizzle" });