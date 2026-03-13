# 🪡 DrapeAI — Virtual Fabric Studio

AI-powered virtual draping tool. Upload fabric, see it on models instantly using Google Gemini AI.

---

## ✨ Features
- Upload any fabric image (JPG, PNG)
- 5 garment types: Kurta, Long Kurta, Shirt, Slim Fit Shirt, Duo View
- 4 Indian & International model types
- 13 professional backgrounds (studio, heritage haveli, royal palace, etc.)
- 4 aspect ratios, 6 bottom colors, custom notes
- User login + admin approval system

---

## 🚀 Deploy FREE on Netlify — Step by Step

### Step 1 — Get your FREE Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key" → Copy it (starts with AIza...)

### Step 2 — Upload to GitHub
1. Create free account at https://github.com
2. New repository → name it "drapeai" → Public → Create
3. Drag & drop ALL files from this folder into the GitHub repo

### Step 3 — Deploy on Netlify
1. Go to https://netlify.com → Sign up free (use GitHub)
2. "Add new site" → "Import an existing project" → GitHub → select "drapeai"
3. Build settings auto-detected from netlify.toml
4. Click "Deploy site" ✅

### Step 4 — Add your API Key in Netlify
1. Netlify → Your site → Site settings → Environment variables
2. "Add variable" → Key: GEMINI_API_KEY → Value: your key from Step 1
3. Save → Deploys → "Trigger deploy"

🎉 Your app is LIVE at a free URL like: https://drapeai-xyz.netlify.app

---

## 💻 Run Locally

```
npm install
# Edit .env.local → replace YOUR_GEMINI_API_KEY_HERE with your key
npm run dev
# Open http://localhost:3000
```

---

## 🔐 Default Admin Login
- Email: admin@drape.ai
- Password: admin

New users are "Pending" until the admin approves them from the Admin Dashboard.

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| "API key not valid" | Double-check key in Netlify env vars, redeploy |
| Image not generating | Free tier has limits — wait 1 min and retry |
| Want custom domain | Netlify → Domain management → Add custom domain (free) |

