# Simple Email Setup Guide - No Technical Jargon!

## What is SMTP? (Simple Explanation)

**SMTP** = **S**imple **M**ail **T**ransfer **P**rotocol

Think of it like a postal service for emails:
- Your app needs to send emails (like OTP codes)
- SMTP is the "post office" that delivers those emails
- Gmail has an SMTP server that can send emails for you
- You need permission (password) to use Gmail's SMTP server

## Why Can't I Use My Regular Gmail Password?

Gmail has security rules:
- ❌ Regular passwords are NOT allowed for apps
- ✅ You need a special "App Password" instead
- This keeps your account safe if someone gets your app password

## Step-by-Step: Getting Your Gmail App Password

### Step 1: Enable 2-Step Verification (Security Feature)

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" 
3. Click "Get Started" or "Turn On"
4. Follow the steps (usually involves your phone number)
5. Complete the setup

**Why?** Gmail requires this before you can create App Passwords.

### Step 2: Create an App Password

1. Go to: https://myaccount.google.com/apppasswords
   - If you don't see this page, go back to Step 1!
   
2. You'll see a page that says "Select app" and "Select device"
   - **Select app:** Choose "Mail"
   - **Select device:** Choose "Other (Custom name)" and type "StackPrep" or anything you want
   
3. Click "Generate"

4. You'll see a yellow box with a password like this:
   ```
   abcd efgh ijkl mnop
   ```
   **COPY THIS PASSWORD NOW!** You can't see it again.

### Step 3: Add to Your .env File

1. Open the file `server/.env` in your project
   - If it doesn't exist, create it in the `server` folder

2. Add these lines (replace with YOUR information):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   ```

3. **Important:**
   - Replace `your-email@gmail.com` with YOUR actual Gmail address
   - Replace `abcdefghijklmnop` with the App Password you copied
   - **Remove ALL spaces** from the App Password!
   - Example: If you got `abcd efgh ijkl mnop`, write it as `abcdefghijklmnop`

### Step 4: Save and Restart

1. Save the `.env` file
2. Stop your server (Ctrl+C in the terminal)
3. Start it again: `npm run dev`
4. You should see: `✅ SMTP server is ready to send emails`

## Example .env File

Here's what a complete `.env` file might look like:

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-db-password
DB_NAME=stackprep
DB_PORT=3306

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcdefghijklmnop

# App
APP_NAME=StackPrep
OTP_EXPIRES_MIN=5
```

## Common Mistakes

❌ **Mistake 1:** Using your regular Gmail password
- ✅ **Fix:** Use the App Password from Step 2

❌ **Mistake 2:** Including spaces in the App Password
- ✅ **Fix:** Remove all spaces: `abcd efgh` → `abcdefgh`

❌ **Mistake 3:** Not enabling 2-Step Verification first
- ✅ **Fix:** Go to Step 1 and enable it

❌ **Mistake 4:** Wrong email address
- ✅ **Fix:** Make sure SMTP_USER matches the Gmail account you used to create the App Password

## Testing Your Setup

After updating your `.env` file, test it:

```bash
cd server
npm run test:smtp
```

This will tell you if everything is working!

## Still Confused?

**Think of it like this:**
- Your app = A person who wants to send mail
- Gmail SMTP = The post office
- App Password = Your ID card to prove you're allowed to use the post office
- Regular password = Not accepted at the post office (too risky)

You need the special ID card (App Password) to send mail through Gmail's post office!

