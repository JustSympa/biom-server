import fastify from 'fastify';
import cors from '@fastify/cors';
import config, { ENV } from './config/index.js';
import { errorHandler } from './middlewares/error.js';
import drizzle from './plugins/drizzle.js';
import jwtPlugin from './plugins/jwt.js';
import { authRoutes } from './routes/auth.routes.js';
import { reportRoutes } from './routes/report.routes.js';
export async function createFastifyApp() {
    const app = fastify({ logger: config.logger, disableRequestLogging: config.NODE_ENV == ENV.dev ? true : false });
    await app.register(drizzle, { connectionString: config.DB_CONNECTION_STRING });
    await app.register(jwtPlugin);
    await app.register(cors, config.cors);
    app.setErrorHandler(errorHandler);
    await app.register(authRoutes);
    await app.register(reportRoutes);
    await app.get('/', (req, rep) => rep.status(200).send(`Running on port ${config.PORT}`));
    return app;
}
//# sourceMappingURL=app.js.map