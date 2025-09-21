export const errorHandler = (err, req, res, next) => {
    const code = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(code).json({status: "error", code, message});
}