import { Request, Response, NextFunction } from "express";
import { pool } from "../db";

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, slug FROM categories ORDER BY id ASC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
