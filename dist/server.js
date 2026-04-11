import config from "./config/index.js";
import { createFastifyApp } from "./app.js";
async function start() {
    try {
        const app = await createFastifyApp();
        await app.listen({ host: config.HOST, port: config.PORT });
        process.on('SIGINT', async () => {
            app.log.info('SIGINT Received. Shutting down gracefully...');
            await app.close();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            app.log.info('SIGTERM Received. Shutting down gracefully...');
            await app.close();
            process.exit(0);
        });
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map