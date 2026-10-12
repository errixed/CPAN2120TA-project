import app from "./app.js";
import config from "./config.js";

if (!Number.isInteger(config.PORT) ||
    config.PORT < 1 ||
    config.PORT > 65535) {
    throw new Error("Invalid server port.");
}

app.listen(config.PORT, () => {
    console.log(
        `FinMarket-Enterprise backend running on port ${config.PORT}`
    );
});
