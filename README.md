# 🏆 LeetCompete

> A serverless, multiplayer competitive programming platform to host custom LeetCode contests, build **150-problem season leagues with zero problem repetition**, and verify submissions in real-time via LeetCode's public GraphQL API.

---

## 🌟 Key Features

* **🎲 150-Problem Season Curriculum**: Import master lists like *Top Interview 150* or paste custom problem sets. Each contest automatically draws 4–6 problems from the *remaining* pool so no problem ever repeats across the season.
* **🌐 Public & 🔒 Private Contests**: Host open community matches or password-protected private contests for study groups, classrooms, and friends.
* **⚡ Live LeetCode GraphQL Verification**: Contestants solve problems on LeetCode. When they click **"Submit"**, the AWS Lambda backend queries LeetCode's GraphQL API in real-time, verifying that an Accepted (AC) verdict was submitted within the contest countdown window.
* **📊 Live Dynamic Leaderboard**: Instant rank calculations with solve times, penalties, and medal badges (🥇, 🥈, 🥉).
* **🔐 100% Free Admin Authentication**: Google OAuth (GAuth) + Admin Passcode to protect season management and contest creation without recurring subscription costs.
* **💰 100% Free Tier ($0.00 / mo)**: Powered entirely by AWS Lambda Always Free Tier (1M requests/mo), Amazon DynamoDB Always Free Tier (25GB), and GitHub Pages.

---

## 🏗️ Architecture

```
.
├── backend/            # AWS Lambda + DynamoDB serverless backend (Serverless Framework)
│   ├── index.js        # Main Lambda request router, DynamoDB ops & AC verifier
│   ├── leetcode.js     # LeetCode public GraphQL client
│   ├── problemBank.js  # 150-problem presets & non-repeating curriculum partition engine
│   ├── serverless.yml  # Serverless Framework configuration & DynamoDB table resources
│   ├── deploy.bat      # Windows one-click deployment script
│   └── deploy.sh       # Linux/macOS deployment script
└── frontend/           # React Single Page Application (GitHub Pages)
    ├── src/
    │   ├── components/ # Arena, Leaderboards, Problem Picker, Seasons, Navbar, Footer
    │   ├── services/   # REST API client connected to Lambda Function URL
    │   ├── App.jsx     # Main routing & application shell
    │   └── index.css   # Titanium & Cyber-Amethyst dark mode design system
    ├── vite.config.js  # Configured with base: './' for GitHub Pages
    └── package.json    # React + gh-pages deploy script
```

---

## 🚀 Quick Setup & Deployment Guide

### 1. Backend Deployment (AWS Lambda + DynamoDB)

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure your AWS credentials (if not already done):
   ```bash
   npx serverless config credentials --provider aws --key YOUR_AWS_KEY --secret YOUR_AWS_SECRET
   ```

3. Deploy to AWS:
   * **Windows**: Run `deploy.bat` or:
     ```bash
     npm run deploy
     ```
   * **Linux / macOS**:
     ```bash
     chmod +x deploy.sh
     ./deploy.sh
     ```

4. After deployment, copy the **Function URL** from the terminal output (e.g. `https://xyz.lambda-url.us-east-1.on.aws`).

---

### 2. Frontend Setup & GitHub Pages Deployment

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```

2. Configure your Lambda Function URL in `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-function-url.lambda-url.us-east-1.on.aws
   ```

3. (Local Development) Start local frontend server:
   ```bash
   npm run dev
   ```

4. **Deploy to GitHub Pages**:
   * Verify the `homepage` in `frontend/package.json` matches your GitHub URL:
     ```json
     "homepage": "https://fahad-israr.github.io/leetcompete"
     ```
   * Run the deployment command:
     ```bash
     npm run deploy
     ```
   * Your platform is now live on GitHub Pages! 🎉

---

## 📦 Setting Up the GitHub Repository

To push this codebase to your GitHub account (`fahad-israr`):

1. Initialize Git and commit all files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: LeetCompete platform with AWS Lambda backend and GitHub Pages frontend"
   ```

2. Create a new repository named `leetcompete` on GitHub:
   - Go to [https://github.com/new](https://github.com/new) and create a repository named `leetcompete`.

3. Link your remote and push:
   ```bash
   git branch -M main
   git remote add origin git@github.com:fahad-israr/leetcompete.git
   git push -u origin main
   ```

4. Enable GitHub Pages in your repo settings:
   - Go to **Settings** > **Pages** > Select `gh-pages` branch as source > **Save**.

---

## 🛡️ Security & Access Control

| Action | Public Users | Protected / Admin Users |
| :--- | :--- | :--- |
| **Join Public Contest** | ✅ Free to enter with any LeetCode username | ✅ |
| **Join Private Contest** | 🔑 Requires Contest Password | ✅ |
| **Submit Solution** | ⚡ Verified in real-time against LeetCode GraphQL | ⚡ |
| **Create 150-Problem Season** | 🔒 Requires Admin Passcode / GAuth | 🔓 Unlocked with Admin Passcode |
| **Delete Season / Data** | 🔒 Blocked | 🔓 Allowed |

---

## 👨‍💻 Author

Made with ❤️ by [**Fahad Israr**](http://linkedin.com/in/fahad00cms)
