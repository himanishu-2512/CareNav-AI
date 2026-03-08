# Fix: "--app is required" CDK Error

## The Problem
You're getting this error because CDK dependencies aren't installed yet.

## Quick Fix (2 minutes)

### Step 1: Install Root Dependencies
```bash
npm install
```

This installs AWS CDK and TypeScript dependencies.

### Step 2: Verify Installation
```bash
npx cdk --version
```

You should see something like: `2.x.x (build xxxxx)`

### Step 3: Now Deploy
```bash
npx cdk deploy --all --require-approval never
```

---

## If That Doesn't Work

### Option A: Install CDK Globally
```bash
npm install -g aws-cdk
cdk --version
cdk deploy --all
```

### Option B: Check Node Version
```bash
node --version
```

You need Node.js 18 or higher. If lower:
- Download from: https://nodejs.org/
- Install latest LTS version
- Restart terminal
- Try again

### Option C: Clean Install
```bash
# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try again
npx cdk deploy --all
```

---

## Complete Setup Commands (Copy & Paste)

Run these in order:

```bash
# 1. Install root dependencies
npm install

# 2. Install Lambda dependencies
cd lambda
npm install
cd ..

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Verify CDK works
npx cdk list

# 5. Deploy
npx cdk deploy --all --require-approval never
```

---

## What Each Command Does

### `npm install` (root)
Installs:
- aws-cdk-lib
- TypeScript
- ts-node
- Other CDK dependencies

### `cd lambda && npm install`
Installs:
- AWS SDK v3
- bcrypt
- jsonwebtoken
- uuid
- Lambda dependencies

### `cd frontend && npm install`
Installs:
- React
- Vite
- Tailwind CSS
- Axios
- React Router

---

## Verify Everything is Installed

```bash
# Check CDK
npx cdk --version

# Check TypeScript
npx tsc --version

# Check Node
node --version

# List CDK stacks
npx cdk list
```

You should see:
```
CareNavDataStack
CareNavStorageStack
CareNavApiStack
```

---

## Still Having Issues?

### Check package.json exists
```bash
ls -la package.json
```

### Check cdk.json exists
```bash
ls -la cdk.json
```

### Check bin/carenav-stack.ts exists
```bash
ls -la bin/carenav-stack.ts
```

All three should exist!

---

## After Installation Works

Continue with deployment:

```bash
# 1. Deploy backend
npx cdk deploy --all --require-approval never

# 2. Note the API URL from output

# 3. Update frontend/.env with API URL

# 4. Create test users
cd lambda
npx ts-node scripts/create-test-user.ts
cd ..

# 5. Run frontend
cd frontend
npm run dev
```

---

## Pro Tip

If you're on Windows and having issues, try:

```bash
# Use PowerShell (not CMD)
# Or use Git Bash
# Or use WSL (Windows Subsystem for Linux)
```

---

**After running `npm install`, the CDK error should be fixed!** ✅
