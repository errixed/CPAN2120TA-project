import { Router } from "express";
import {
    authRoutes,
    advisorRoutes
} from "../modules/identity/identityRoutes.js";
import deliveryRoutes from "../modules/delivery/routes/deliveryRoutes.js"
import campaignRoutes from "../modules/campaigns/campaignRoutes.js";
import leadRoutes from "../modules/leads/leadRoutes.js";

const router = Router();
router.use("/leads", leadRoutes);

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

router.use("/auth", authRoutes);
router.use("/advisors", advisorRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/campaigns", campaignRoutes);

export default router;