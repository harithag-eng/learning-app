/**
 * SMTP Connection Test Script
 * Run this to test your email configuration: npx ts-node test-smtp.ts
 */

import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("\n🔍 Testing SMTP Configuration...\n");

// Check if credentials are set
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ SMTP credentials not found in .env file!");
  console.error("\nPlease add to your .env file:");
  console.error("SMTP_HOST=smtp.gmail.com");
  console.error("SMTP_PORT=587");
  console.error("SMTP_USER=your-email@gmail.com");
  console.error("SMTP_PASS=your-app-password\n");
  process.exit(1);
}

console.log("📧 SMTP Configuration:");
console.log(`   Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}`);
console.log(`   Port: ${process.env.SMTP_PORT || 587}`);
console.log(`   User: ${process.env.SMTP_USER}`);
console.log(`   Pass: ${process.env.SMTP_PASS ? "***" + process.env.SMTP_PASS.slice(-4) : "NOT SET"}`);
console.log("");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test connection
console.log("🔄 Verifying SMTP connection...\n");

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verification Failed!\n");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    
    if (error.code === "EAUTH") {
      console.error("\n" + "=".repeat(60));
      console.error("🔐 AUTHENTICATION ERROR - Gmail App Password Required");
      console.error("=".repeat(60));
      console.error("\nYou are using your regular Gmail password.");
      console.error("Gmail requires an App Password for SMTP access.\n");
      console.error("📋 Steps to fix:");
      console.error("1. Enable 2-Step Verification:");
      console.error("   https://myaccount.google.com/security\n");
      console.error("2. Generate App Password:");
      console.error("   https://myaccount.google.com/apppasswords\n");
      console.error("3. Select 'Mail' and your device");
      console.error("4. Copy the 16-character password (e.g., 'abcd efgh ijkl mnop')");
      console.error("5. Update .env file: SMTP_PASS=abcdefghijklmnop (no spaces)");
      console.error("6. Restart server\n");
      console.error("💡 Common mistakes:");
      console.error("   - Using regular password instead of App Password");
      console.error("   - Including spaces in the App Password");
      console.error("   - Not having 2-Step Verification enabled");
      console.error("   - Using wrong email address in SMTP_USER\n");
    } else {
      console.error("\nOther possible issues:");
      console.error("- Check your internet connection");
      console.error("- Verify SMTP_HOST is correct");
      console.error("- Check if your firewall is blocking port 587");
    }
    process.exit(1);
  } else {
    console.log("✅ SMTP Connection Successful!\n");
    console.log("Your email configuration is working correctly.");
    console.log("You can now send emails from your application.\n");
    
    // Optionally send a test email
    const testEmail = process.env.SMTP_USER;
    console.log(`📨 Sending test email to ${testEmail}...`);
    
    transporter.sendMail({
      from: `"Test" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: "SMTP Test - Configuration Working!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ SMTP Configuration Test</h2>
          <p>If you received this email, your SMTP configuration is working correctly!</p>
          <p><strong>Server:</strong> ${process.env.SMTP_HOST || "smtp.gmail.com"}</p>
          <p><strong>Port:</strong> ${process.env.SMTP_PORT || 587}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    })
      .then(() => {
        console.log("✅ Test email sent successfully!");
        console.log(`Check your inbox at ${testEmail}\n`);
        process.exit(0);
      })
      .catch((err) => {
        console.error("⚠️  Connection verified but failed to send test email:");
        console.error(err.message);
        console.log("\nThis might be a temporary issue. Your SMTP config is correct.\n");
        process.exit(0);
      });
  }
});

