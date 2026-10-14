import { Router } from "express";
import { identityController } from "./identityController.js";

export const authRoutes = Router();
export const advisorRoutes = Router();

authRoutes.post(
    "/register",
    identityController.register
);

authRoutes.post(
    "/login",
    identityController.login
);

advisorRoutes.get(
    "/",
    identityController.listAdvisors
);

advisorRoutes.get(
    "/:id",
    identityController.getAdvisor
);

advisorRoutes.patch(
    "/:id",
    identityController.updateAdvisorProfile
);