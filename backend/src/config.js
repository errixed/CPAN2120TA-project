const config = Object.freeze({
    PORT: Number(process.env.PORT ?? 3001),
    NODE_ENV: process.env.NODE_ENV ?? "development",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",

    MONGO_URI: process.env.MONGO_URI ?? null,
    JWT_SECRET: process.env.JWT_SECRET ?? null,

    GMAIL_USER: process.env.GMAIL_USER ?? null,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ?? null,

    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN ?? null,
    META_PAGE_ID: process.env.META_PAGE_ID ?? null
});

export default config;