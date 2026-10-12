import { Router } from "express";
import {
    authRoutes,
    advisorRoutes
} from "../modules/identity/identityRoutes.js";

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

router.use("/auth", authRoutes);
router.use("/advisors", advisorRoutes);

export default router;