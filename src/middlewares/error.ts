import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"

export function errorHandler(this: FastifyInstance, error: Error, req: FastifyRequest, res: FastifyReply) {
	this.log.error(error)
	res.status(500).send({ statusCode: 500, message: "Internal Server Error : " + error })
}