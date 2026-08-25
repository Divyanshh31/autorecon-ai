# 🚀 Free Cloud Deployment Guide for AutoRecon AI

This guide shows you how to deploy **AutoRecon AI** to a free cloud hosting provider so that **anyone (hackathon judges, mentors, users) can access your live link and use the AI Chatbot without entering any API key**.

---

## 🌟 Option 1: Deploy on Render.com (100% Free & Recommended)

Render provides free hosting for web services with automatic HTTPS and Docker support.

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) named `autorecon-ai`.
2. In your local project directory (`C:\Users\divya\.gemini\antigravity\scratch\autorecon-ai`), initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "AutoRecon AI for Razorpay Buildathon"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/autorecon-ai.git
   git push -u origin main
   ```

### Step 2: Create a Web Service on Render
1. Go to **[Render.com](https://render.com/)** and sign up / log in with GitHub.
2. Click **"New +" ➔ "Web Service"**.
3. Connect your `autorecon-ai` GitHub repository.
4. Configure the service:
   - **Name:** `autorecon-ai`
   - **Language / Runtime:** `Docker` (Render will automatically detect the included `Dockerfile`!)
   - **Instance Type:** `Free`
5. Under **Environment Variables**, click **Add Environment Variable**:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Paste your Gemini API Key (`AIzaSy...`)
6. Click **"Create Web Service"**.

Render will automatically build and deploy your app. In 2–3 minutes, you'll get a public URL like:
👉 **`https://autorecon-ai.onrender.com`**

---

## 🌟 Option 2: Deploy on Railway.app

1. Sign in to **[Railway.app](https://railway.app/)** with GitHub.
2. Click **"New Project" ➔ "Deploy from GitHub repo"**.
3. Select `autorecon-ai`.
4. Go to **Variables** tab and add:
   - `GEMINI_API_KEY`: `AIzaSy...`
   - `PORT`: `8080`
5. Railway will deploy your app and generate a public domain (e.g. `https://autorecon-ai-production.up.railway.app`).

---

## 🔒 Why This Setup is Secure & Seamless:
- **Zero Configuration for Visitors**: Anyone visiting your public URL can chat with the AI and test 3-way reconciliation immediately.
- **Key Safety**: Your `GEMINI_API_KEY` is stored strictly inside the backend cloud environment. It is **never exposed or visible to frontend users/inspect element**.
