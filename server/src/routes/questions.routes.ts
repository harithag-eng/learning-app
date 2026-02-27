import { Router } from "express";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitPracticeAnswer,
  getPracticeHistory,
} from "../controllers/questions.controller";
import { authMiddleware } from "../middleware/auth";
const router = Router();

router.get("/", getQuestions);
router.post("/", createQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);
router.post("/:id/submit", authMiddleware, submitPracticeAnswer);
router.get("/:id/history", authMiddleware, getPracticeHistory);
export default router;
