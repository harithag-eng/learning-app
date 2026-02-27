# Email Setup Guide

## Gmail SMTP Configuration

This application uses Gmail SMTP to send OTP emails. You **must** use a Gmail App Password (not your regular password).

### Step-by-Step Setup

#### 1. Enable 2-Step Verification
- Go to: https://myaccount.google.com/security
- Enable 2-Step Verification if not already enabled
- This is required to generate App Passwords

#### 2. Generate App Password
- Go to: https://myaccount.google.com/apppasswords
- Select "Mail" as the app
- Select your device (or "Other" and name it "StackPrep Server")
- Click "Generate"
- You'll get a 16-character password like: `abcd efgh ijkl mnop`

#### 3. Update .env File
Create or update the `.env` file in the `server` directory with:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:** 
- Use the App Password you just generated (remove spaces)
- Do NOT use your regular Gmail password
- The App Password should be 16 characters without spaces

#### 4. Restart Server
After updating the `.env` file, restart your server:
```bash
npm run dev
```

You should see: `✅ SMTP server is ready to send emails`

### Troubleshooting

**Error: "EAUTH" or "Invalid login"**
- You're using your regular password instead of an App Password
- Make sure you copied the App Password correctly (no spaces)
- Verify 2-Step Verification is enabled

**Error: "SMTP credentials not configured"**
- Check that your `.env` file exists in the `server` directory
- Verify `SMTP_USER` and `SMTP_PASS` are set
- Make sure there are no typos in the variable names

**Still having issues?**
- Double-check the App Password was generated correctly
- Try generating a new App Password
- Make sure your Gmail account has 2-Step Verification enabled
- Check that the `.env` file is in the correct location (`server/.env`)

### Alternative Email Providers

If you prefer not to use Gmail, you can use other SMTP providers:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

