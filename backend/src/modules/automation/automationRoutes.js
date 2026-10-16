import { Router } from "express";
import * as automationController from "./automationController.js";

// Mounted in routes/index.js under /api/v1.
const router = Router();

router.post("/", automationController.createAutomation);
router.get("/", automationController.listAutomations);
router.post("/simulate-event", automationController.simulateEvent);
router.get("/events", automationController.listEvents);

export default router;
