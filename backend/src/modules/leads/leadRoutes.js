import { Router } from "express";
import * as controller from "./leadController.js";

const router = Router();
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
export default router;
