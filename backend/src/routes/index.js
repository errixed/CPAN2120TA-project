import { Router } from "express";
import campaignRoutes from "../modules/campaigns/campaignRoutes.js";

const router = Router();

router.use("/campaigns", campaignRoutes);

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