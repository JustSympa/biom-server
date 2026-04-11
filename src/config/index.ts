import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { FastifyCorsOptions } from "@fastify/cors"
import { FastifyLoggerOptions, RawServerDefault } from 'fastify'
import { PinoLoggerOptions } from 'fastify/types/logger.js'
import { fileURLToPath } from 'url'

dotenv.config()

export enum ENV {
    dev = 'development', test = 'testing', stage = 'staging', prod = 'production'
}
const isProd = process.env.NODE_ENV === ENV.stage || process.env.NODE_ENV === ENV.prod

const logFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../logs/app.log')

if(isProd && !fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true })
}

const logger : FastifyLoggerOptions<RawServerDefault> & PinoLoggerOptions = {
    level: isProd ? 'info' : 'debug',
    transport: isProd? undefined : {
        target: 'pino-pretty',
        options: {
            colorize: true,
            singleLine: true,
            messageFormat: true,
            translateTime: 'mm-dd HH:MM:ss',
            ignore: 'pid,hostname,name'
        }
    },
    file: isProd ? logFilePath : undefined,
}

const cors_config: FastifyCorsOptions = {
    origin: (origin, cb) => {
            cb(null, true)
            return
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}

export default {
    NODE_ENV: process.env.NODE_ENV + '',
    DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING + '',

	OPENAI_API_KEY: process.env.OPENAI_API_KEY + '',

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET + '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET + '',

    HOST: process.env.HOST + '',
    PORT : parseInt(process.env.PORT || '3500'),
    cors : cors_config,
    logger
}