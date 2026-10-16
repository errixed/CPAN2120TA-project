export default function errorHandler(err, req, res, next) {

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_JSON",
                message: "The request contains invalid JSON."
            }
        });
    }

    const mongooseValidationError = err.name === "ValidationError" ||
        err.name === "CastError";
    const status = mongooseValidationError
        ? 400
        : Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode <= 599
        ? err.statusCode
        : 500;
    
    if (status >= 500) {
        console.error("Unexpected server error:", err);
    }

    return res.status(status).json({
        success: false,
        error: {
            code: status === 500
                ? "INTERNAL_ERROR"
                : err.code ?? (mongooseValidationError ? "INVALID_REQUEST" : "REQUEST_ERROR"),
            message: status === 500
                ? "Internal server error."
                : mongooseValidationError
                    ? "Invalid request data. Check required fields and field values."
                    : err.message
        }
    });
}