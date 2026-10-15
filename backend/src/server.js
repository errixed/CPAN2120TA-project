import app from "./app.js";
import config from "./config.js";
import connectDatabase from "./config/database.js";

if (!Number.isInteger(config.PORT) ||
    config.PORT < 1 ||
    config.PORT > 65535) {
    throw new Error("Invalid server port.");
}

if (config.MONGO_URI) {
    await connectDatabase(config.MONGO_URI);
} else {
    console.warn("MONGO_URI is not configured; database-backed endpoints will be unavailable.");
}

app.listen(config.PORT, () => {
    console.log(`FinMarket-Enterprise backend running on port ${config.PORT}`);
});
