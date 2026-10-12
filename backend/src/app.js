import express from "express";
import cors from "cors";
import config from "./config.js";
import apiRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import requestLogger from "./middleware/requestLogger.js";

const app = express();

app.use(requestLogger);

app.use(cors({
    origin: config.CORS_ORIGIN
}));

app.use(express.json());

app.use("/api/v1", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorHandler);

export default app;