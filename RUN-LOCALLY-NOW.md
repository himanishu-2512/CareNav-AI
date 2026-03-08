# Run Locally Right Now - 3 Simple Steps

## 🎯 Easiest Way (Recommended)

You need the backend in AWS (one-time setup), then run frontend locally.

### Step 1: Deploy Backend to AWS (One Time - 15 min)

```bash
# Install everything
npm install
cd lambda && npm install && cd ..
cd frontend && npm install && cd ..

# Deploy to AWS
npx cdk deploy --all --require-approval never
```

**Copy the API URL** from the output:
```
ApiStack.ApiEndpoint = https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

### Step 2: Configure Frontend (1 min)

Edit `frontend/.env`:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```
(Paste your API URL)

Create test users:
```bash
cd lambda
npx ts-node scripts/create-test-user.ts
cd ..
```

### Step 3: Run Frontend Locally (30 seconds)

```bash
cd frontend
npm run dev
```

Open: **http://localhost:3000**

Login:
- Patient: `patient@demo.com` / `demo123`
- Doctor: `doctor@demo.com` / `demo123`

---

## ✅ That's It!

Now you can:
- Edit frontend code
- See changes instantly (hot reload)
- Test with real AWS backend
- Test AI features
- Test everything!

---

## 🔄 Daily Workflow

Every day you work on this:

```bash
cd frontend
npm run dev
```

That's it! Backend stays in AWS, you just run frontend locally.

---

## 🛠️ If You Need to Change Backend

```bash
# Make changes to Lambda code
# Then redeploy:
npx cdk deploy --all
```

Frontend will automatically use the updated backend.

---

## 🧪 Just Want to Test UI Without AWS?

If you just want to see the UI without deploying anything:

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

**Note**: Login won't work (no backend), but you can see all the pages and UI.

---

## 📊 What Each Option Gives You

### Frontend Only (No AWS):
- ✅ See UI
- ✅ Test layouts
- ❌ Can't login
- ❌ No data

### Frontend + AWS Backend (Recommended):
- ✅ Everything works!
- ✅ Real login
- ✅ Real AI
- ✅ Real data
- ✅ Fast development

---

## 💡 Pro Tip

Keep two terminals open:

**Terminal 1** (Frontend - always running):
```bash
cd frontend
npm run dev
```

**Terminal 2** (For commands):
```bash
# Use this for git, testing, etc.
```

---

## 🚨 Common Issues

### "Port 3000 already in use"
```bash
npx kill-port 3000
npm run dev
```

### "Cannot connect to API"
Check `frontend/.env` has the correct API URL

### "Module not found"
```bash
cd frontend
npm install
```

---

## 🎯 Quick Start Commands

Copy and paste these in order:

```bash
# 1. Install
npm install && cd lambda && npm install && cd .. && cd frontend && npm install && cd ..

# 2. Deploy backend (one time)
npx cdk deploy --all --require-approval never

# 3. Create users (one time)
cd lambda && npx ts-node scripts/create-test-user.ts && cd ..

# 4. Update frontend/.env with API URL (manual step)

# 5. Run frontend
cd frontend && npm run dev
```

---

**That's all you need!** 🚀

The frontend runs on your computer, the backend runs in AWS. Best of both worlds!
