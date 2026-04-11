import fastify from 'fastify'
import cors from '@fastify/cors'
import config, { ENV } from '@config'
import { errorHandler } from '@errorsmiddleware'
import drizzle from '@drizzle'
import jwtPlugin from '@jwt'
import { authRoutes } from '@authroutes'
import { reportRoutes } from '@reportroutes'

export async function createFastifyApp() {
    const app = fastify({ logger: config.logger, disableRequestLogging: config.NODE_ENV == ENV.dev ? true : false})

    await app.register(drizzle, { connectionString: config.DB_CONNECTION_STRING})
    await app.register(jwtPlugin)
    await app.register(cors, config.cors)
    app.setErrorHandler(errorHandler)
    await app.register(authRoutes)
	await app.register(reportRoutes)
    await app.get('/', (req, rep) => rep.status(200).send(`Running on port ${config.PORT}`) )
    
    return app
}
