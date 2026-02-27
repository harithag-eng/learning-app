import { NextFunction, raw, Request, Response } from "express";
import { ZodError } from "zod";
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err);

  //zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  //MySQL errors
  if (typeof err === "object" && err !== null && "code" in err) {
    return res.status(500).json({
      message: "Database error",
      code: (err as any).code,
    });
  }
  //Normal JS Error
  if (err instanceof Error) {
    return res.status(500).json({
      message: err.message,
    });
  }

  return res.status(500).json({ message: "Unknown server error" });
}
