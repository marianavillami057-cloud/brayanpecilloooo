import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import mediaRouter from "./media";
import settingsRouter from "./settings";
import testimonialsRouter from "./testimonials";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/media", mediaRouter);
router.use("/settings", settingsRouter);
router.use("/testimonials", testimonialsRouter);

export default router;
