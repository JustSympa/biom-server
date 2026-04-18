export function errorHandler(error, req, res) {
    this.log.error(error);
    res.status(500).send({ statusCode: 500, message: "Internal Server Error : " + error });
}
//# sourceMappingURL=error.js.map