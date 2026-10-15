import { Router } from "express";
import * as automationController from "./automationController.js";

// Mounted in routes/index.js under /api/v1.
const router = Router();

router.post("/automations", automationController.createAutomation);
router.get("/automations", automationController.listAutomations);
router.post("/automations/simulate-event", automationController.simulateEvent);
router.get("/automations/events", automationController.listEvents);
router.get("/analytics/summary", automationController.getAnalyticsSummary);

export default router;
