import { Router } from "express";
import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import campaignService from "./campaignService.js";
import { createCampaignController } from "./campaignController.js";

export function createCampaignRouter(service = campaignService) {
    const router = Router();
    const controller = createCampaignController(service);

    if (service === campaignService) {
        router.use((req, res, next) => {
            if (mongoose.connection.readyState !== 1) {
                return next(new AppError(
                    "Campaign storage is unavailable; configure MONGO_URI and connect to MongoDB.",
                    503,
                    "DATABASE_UNAVAILABLE"
                ));
            }

            return next();
        });
    }

    router.get("/templates", controller.listTemplates);
    router.get("/templates/:templateId", controller.getTemplate);
    router.post("/", controller.createCampaign);
    router.get("/", controller.listCampaigns);
    router.get("/:campaignId/audience", controller.getAudience);
    router.get("/:campaignId", controller.getCampaign);
    router.patch("/:campaignId", controller.updateCampaign);

    return router;
}

export default createCampaignRouter();