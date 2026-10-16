import { Router } from "express";
import * as automationController from "./automationController.js";

const router = Router();

router.get("/summary", automationController.getAnalyticsSummary);

export default router;