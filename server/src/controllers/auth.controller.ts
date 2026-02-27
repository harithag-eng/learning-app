import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { pool } from "../db";
import { AuthRequest } from "../middleware/auth";

const OTP_LEN = 6;

const genOtp = () => {
  const min = 10 ** (OTP_LEN - 1);
  const max = 10 ** OTP_LEN - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  const masked = name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***`;
  return `${masked}@${domain}`;
};

// Validate SMTP configuration
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error(
    "\n❌ SMTP credentials not configured!\n" +
      "Please add the following to your .env file in the server directory:\n\n" +
      "SMTP_HOST=smtp.gmail.com\n" +
      "SMTP_PORT=587\n" +
      "SMTP_USER=your-email@gmail.com\n" +
      "SMTP_PASS=your-app-password\n\n" +
      "📧 For Gmail setup:\n" +
      "1. Enable 2-Step Verification: https://myaccount.google.com/security\n" +
      "2. Generate App Password: https://myaccount.google.com/apppasswords\n" +
      "3. Select 'Mail' and your device, then copy the 16-character password\n" +
      "4. Use that password (without spaces) as SMTP_PASS\n\n",
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("\n❌ SMTP configuration error:", error.message);
    if (error.code === "EAUTH") {
      console.error(
        "\n🔐 Gmail Authentication Failed!\n" +
          "This usually means you're using your regular Gmail password instead of an App Password.\n\n" +
          "✅ Quick Fix:\n" +
          "1. Go to: https://myaccount.google.com/apppasswords\n" +
          "2. Generate a new App Password for 'Mail'\n" +
          "3. Copy the 16-character password (looks like: abcd efgh ijkl mnop)\n" +
          "4. Update your .env file: SMTP_PASS=abcdefghijklmnop (no spaces)\n" +
          "5. Restart the server\n\n" +
          "Note: You must have 2-Step Verification enabled first!\n",
      );
    } else {
      console.error(
        "\n⚠️  Email service not configured properly. Please check:\n" +
          "1. SMTP_USER and SMTP_PASS in your .env file\n" +
          "2. For Gmail: Use an App Password (not your regular password)\n" +
          "   - Enable 2-Step Verification\n" +
          "   - Generate App Password: https://myaccount.google.com/apppasswords\n" +
          "3. Make sure SMTP_HOST is set correctly (e.g., smtp.gmail.com)",
      );
    }
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body as { email?: string; name?: string };
    if (!email || !name)
      return res.status(400).json({ message: "Email and name are required" });

    // 1) Find or create user
    const [uRows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const users = uRows as any[];
    let user = users[0];

    if (!user) {
      const [ins] = await pool.query(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        [name, email],
      );
      const insertId = (ins as any).insertId;
      const [createdRows] = await pool.query(
        "SELECT * FROM users WHERE id = ?",
        [insertId],
      );
      user = (createdRows as any[])[0];
    }

    // 2) OTP generate + hash
    const otp = genOtp();
    const otp_hash = await bcrypt.hash(otp, 10);

    const mins = Number(process.env.OTP_EXPIRES_MIN || 5);
    const expiresAt = new Date(Date.now() + mins * 60 * 1000);

    // invalidate previous unused OTPs
    await pool.query(
      "UPDATE user_otps SET used = 1 WHERE user_id = ? AND used = 0",
      [user.id],
    );

    // store OTP
    await pool.query(
      "INSERT INTO user_otps (user_id, otp_hash, expires_at, used) VALUES (?, ?, ?, 0)",
      [user.id, otp_hash, expiresAt],
    );

    // 3) send email
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP credentials not configured");
      return res.status(500).json({
        message:
          "Email service not configured. Please set SMTP_USER and SMTP_PASS in .env file.",
        error: "SMTP_NOT_CONFIGURED",
        help: "See server/EMAIL_SETUP.md for setup instructions",
      });
    }

    try {
      await transporter.sendMail({
        from: `"${process.env.APP_NAME || "App"}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Your OTP Code`,
        html: `
          <div style="font-family:Arial,sans-serif">
            <h2>${process.env.APP_NAME || "App"} OTP</h2>
            <p>Your one-time code is:</p>
            <div style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</div>
            <p>This code expires in <b>${mins} minutes</b>.</p>
          </div>
        `,
      });
    } catch (emailError: any) {
      console.error("Email sending error:", emailError);

      // Provide more specific error messages
      if (emailError.code === "EAUTH") {
        console.error(
          "\n❌ SMTP Authentication Failed!\n" +
            "For Gmail, you need to:\n" +
            "1. Enable 2-Step Verification on your Google account\n" +
            "2. Generate an App Password: https://myaccount.google.com/apppasswords\n" +
            "3. Use the App Password (not your regular password) in SMTP_PASS\n",
        );
        return res.status(500).json({
          message:
            "Email service authentication failed. Please check SMTP credentials.",
          error: "EAUTH",
          help: "For Gmail, you must use an App Password. See server/EMAIL_SETUP.md for details.",
        });
      }

      throw emailError; // Re-throw to be caught by outer catch
    }

    return res.json({
      message: "OTP sent",
      email: maskEmail(email),
      expires_in_seconds: mins * 60,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    // user
    const [uRows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = (uRows as any[])[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    // latest unused otp
    const [oRows] = await pool.query(
      `SELECT * FROM user_otps 
       WHERE user_id = ? AND used = 0
       ORDER BY id DESC LIMIT 1`,
      [user.id],
    );
    const record = (oRows as any[])[0];
    if (!record)
      return res.status(400).json({ message: "No OTP found, request again" });

    // expiry
    const now = new Date();
    const expires = new Date(record.expires_at);
    if (now > expires) {
      await pool.query("UPDATE user_otps SET used = 1 WHERE id = ?", [
        record.id,
      ]);
      return res.status(400).json({ message: "OTP expired" });
    }

    // compare
    const ok = await bcrypt.compare(otp, record.otp_hash);
    if (!ok) return res.status(400).json({ message: "Invalid OTP" });

    // mark used
    await pool.query("UPDATE user_otps SET used = 1 WHERE id = ?", [record.id]);

    // jwt
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    return res.json({
      message: "Login success",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Optional: delete related OTPs first
    await pool.query("DELETE FROM user_otps WHERE user_id = ?", [userId]);

    // Optional: if you have questions/answers tables linked to user
    // await pool.query("DELETE FROM questions WHERE user_id = ?", [userId]);
    // await pool.query("DELETE FROM answers WHERE user_id = ?", [userId]);

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    return res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete account" });
  }
};
export const me = async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
};
