export default function requestLogger(req, res, next) {
    const start = performance.now();

    res.on("finish", () => {
        const duration = (performance.now() - start).toFixed(2);
        const timestamp = new Date().toISOString();

        console.log(
            `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
        );
    });

    next();
}