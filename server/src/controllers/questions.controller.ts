import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { pool } from "../db";
import { z } from "zod";
import { error } from "console";

const createQuestionsSchema = z.object({
  categorySlug: z.string(),
  question: z.string().min(3),
  answer: z.string().min(3),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).default("basic"),
});

const submitPracticeSchema = z.object({
  submitted_answer: z.string().min(1),
});
// const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categorySlug = String(req.query.categorySlug || "React");
    const search = String(req.query.search || "");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    console.log(limit);
    const offset = (page - 1) * limit;
    const difficulty = String(req.query.difficulty || "");
    const difficultysql = difficulty ? "AND difficulty = ?" : "";
    const difficultyParams = difficulty ? [difficulty] : [];
    console.log("difficulty=", req.query.difficulty);
    //get category
    const [catRows] = await pool.query<any[]>(
      "SELECT id, name, slug FROM categories WHERE slug = ? LIMIT 1",
      [categorySlug],
    );

    if (catRows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    const category = catRows[0];

    const [countRows] = await pool.query<any[]>(
      `
            SELECT COUNT(*) AS total
            FROM questions
            WHERE category_id = ?
            ${difficultysql}
            AND (question LIKE ? OR answer LIKE ?)
            `,
      [category.id, ...difficultyParams, `%${search}%`, `%${search}%`],
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.ceil(total / limit);

    //Fetch paginated
    const [items] = await pool.query<any[]>(
      `
            SELECT id, question, answer, difficulty, created_at, updated_at FROM questions
            WHERE category_id = ?
            ${difficultysql}
            AND (question LIKE ? OR answer LIKE ?)
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            `,
      [
        category.id,
        ...difficultyParams,
        `%${search}%`,
        `%${search}%`,
        limit,
        offset,
      ],
    );
    res.json({
      category,
      items,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    next(err);
  }
};

export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createQuestionsSchema.parse(req.body);

    const [catRows] = await pool.query<any[]>(
      "SELECT id FROM categories WHERE slug = ? LIMIT 1",
      [parsed.categorySlug],
    );
    if (catRows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const categoryId = catRows[0].id;

    //insert question
    const [result] = await pool.query<any>(
      "INSERT INTO questions (category_id, question, answer, difficulty) VALUES (?, ?, ?, ?)",
      [categoryId, parsed.question, parsed.answer, parsed.difficulty],
    );
    res.status(201).json({
      message: "Question created successfully",
      id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

const updateSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
});

export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id" });

    const body = updateSchema.parse(req.body);

    const [result] = await pool.query<any>(
      "UPDATE questions SET question = ?, answer = ?, difficulty = COALESCE(?, difficulty) WHERE id = ?",
      [body.question, body.answer, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Updated" });
  } catch (err) {
    next(err);
  }
};
export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id" });

    const [result] = await pool.query<any>(
      "DELETE FROM questions WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
export const submitPracticeAnswer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const questionId = Number(req.params.id);
    if (!Number.isFinite(questionId)) {
      return res.status(400).json({ message: "Invalid questioni id" });
    }
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const body = submitPracticeSchema.parse(req.body);
    // get official answer
    const [qRows] = await pool.query<any[]>(
      "SELECT answer FROM questions WHERE id = ? LIMIT 1",
      [questionId],
    );
    if (qRows.length === 0) {
      return res.status(404).json({ message: "Question not found" });
    }
    const official = qRows[0].answer ?? "";

    // 2) insert submission
    const [result] = await pool.query<any>(
      `INSERT INTO practice_submissions(question_id, user_id, submitted_answer) VALUES (?, ?,?)`,
      [questionId, userId, body.submitted_answer],
    );
    return res.json({
      message: "Submitted",
      submission_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};
export const getPracticeHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const questionId = Number(req.params.id);
    if (!Number.isFinite(questionId)) {
      return res.status(400).json({ message: "Invalid question id" });
    }
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const limit = Number(req.query.limit || 10);
    const [rows] = await pool.query<any[]>(
      `SELECT
        ps.id,
        ps.submitted_answer,
        
        ps.created_at,
        u.name
      FROM practice_submissions ps
      JOIN users u ON u.id = ps.user_id

      WHERE ps.question_id = ? AND ps.user_id = ?
      ORDER BY ps.created_at DESC
      LIMIT ?
      `,
      [questionId, userId, limit],
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
};
