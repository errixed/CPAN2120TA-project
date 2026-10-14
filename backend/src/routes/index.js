import { Router } from "express";
import deliveryRoutes from "../modules/delivery/routes/deliveryRoutes.js";

const router = Router();

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

// Wire up the delivery module routes
router.use("/deliveries", deliveryRoutes);

export default router;