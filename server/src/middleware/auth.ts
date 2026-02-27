import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; email: string; name?: string | null };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,      // ✅ correct
      name: decoded.name ?? null // ✅ correct
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
};