import { Router } from "express";
import automationRoutes from "../modules/automation/automationRoutes.js";

const router = Router();

router.use(automationRoutes);

router.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            status: "OK",
            application: "FinMarket-Enterprise",
            timestamp: new Date().toISOString()
        }
    });
});

export default router;