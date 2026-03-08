# AWS Amplify Deployment - Quick Start

## Step-by-Step Deployment Guide

### Step 1: Push Code to GitHub

First, commit and push all files to your GitHub repository:

```bash
git add .
git commit -m "Prepare for Amplify deployment"
git push origin main
```

### Step 2: Open AWS Amplify Console

1. Go to: https://console.aws.amazon.com/amplify/
2. Make sure you're in the **ap-south-1 (Mumbai)** region
3. Click **"New app"** → **"Host web app"**

### Step 3: Connect Your Repository

1. **Choose Git provider**: Select **GitHub**
2. Click **"Continue"**
3. **Authorize AWS Amplify**: Click "Authorize AWS Amplify" to give access to your GitHub
4. **Select repository**: Choose your repository from the dropdown
5. **Select branch**: Choose **main** (or your default branch)
6. Click **"Next"**

### Step 4: Configure Build Settings

1. **App name**: Enter `carenav-ai` (or your preferred name)
2. **Environment**: Leave as `production`
3. **Build settings**: Should auto-detect from `amplify.yml` file
   - If not detected, paste this:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

4. Click **"Next"**

### Step 5: Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Wait for deployment (usually 3-5 minutes)

### Step 6: Add Environment Variable

After deployment completes:

1. In Amplify Console, click on your app
2. Go to **"Environment variables"** in the left sidebar
3. Click **"Manage variables"**
4. Add this variable:
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod`
5. Click **"Save"**
6. Go to **"Deployments"** and click **"Redeploy this version"**

### Step 7: Test Your App

1. Once redeployment completes, you'll see a URL like:
   ```
   https://main.xxxxxx.amplifyapp.com
   ```

2. Click the URL to open your app

3. Test login with demo credentials:
   - **Patient**: patient@demo.com / patient123
   - **Doctor**: doctor@demo.com / doctor123

## Troubleshooting

### Build Fails

If build fails, check the build logs:
1. Go to your app in Amplify Console
2. Click on the failed build
3. Expand the logs to see the error
4. Common fixes:
   - Ensure `amplify.yml` is in the root directory
   - Check that `frontend/package.json` has all dependencies
   - Verify Node.js version compatibility

### Login Doesn't Work

1. Check environment variable is set correctly
2. Verify API Gateway URL is accessible
3. Check browser console for errors (F12)
4. Ensure CORS is enabled on API Gateway

### 404 on Page Refresh

1. Verify `frontend/public/_redirects` file exists
2. Content should be: `/*    /index.html   200`
3. Redeploy if needed

## Enable CORS on API Gateway (If Login Fails)

1. Go to API Gateway Console: https://console.aws.amazon.com/apigateway/
2. Select your API
3. For each resource:
   - Click **Actions** → **Enable CORS**
   - Add your Amplify domain to allowed origins
   - Click **"Enable CORS and replace existing CORS headers"**

## Automatic Deployments

Every time you push to your connected branch, Amplify will automatically deploy:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Amplify automatically detects and deploys
```

## Your Deployment URLs

- **API Backend**: https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod
- **Frontend**: Will be provided after deployment (e.g., https://main.xxxxxx.amplifyapp.com)

## Next Steps

1. ✅ Deploy to Amplify
2. ✅ Test all functionality
3. 🔄 Set up custom domain (optional)
4. 🔄 Configure monitoring and alerts
5. 🔄 Set up staging environment

## Cost Information

- **Free Tier**: 1000 build minutes/month, 15 GB served/month
- **After Free Tier**: ~$0.01 per build minute, ~$0.15 per GB served
- Estimated cost for small app: $5-10/month

## Support

If you encounter issues:
1. Check build logs in Amplify Console
2. Review browser console (F12) for frontend errors
3. Check API Gateway logs in CloudWatch
4. Refer to full guide: `AMPLIFY-DEPLOYMENT-GUIDE.md`
