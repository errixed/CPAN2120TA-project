import { Router } from "express";
import campaignService from "./campaignService.js";
import { createCampaignController } from "./campaignController.js";

export function createCampaignRouter(service = campaignService) {
    const router = Router();
    const controller = createCampaignController(service);

    router.post("/templates", controller.createTemplate);
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