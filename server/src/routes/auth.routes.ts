import { Router } from "express";
import { requestOtp, verifyOtp, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { deleteAccount } from "../controllers/auth.controller";
const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", authMiddleware, me);
router.delete("/delete-account", authMiddleware, deleteAccount);

export default router;
