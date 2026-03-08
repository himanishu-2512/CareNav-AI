# AWS Amplify Deployment Guide

This guide will help you deploy the CareNav AI frontend to AWS Amplify.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository (or other Git provider) with your code
- Backend API already deployed (API Gateway URL)

## Step 1: Prepare Your Repository

The following files have been created for Amplify deployment:

1. **amplify.yml** - Build configuration for Amplify
2. **frontend/.env.production** - Production environment variables
3. **frontend/public/_redirects** - SPA routing configuration

Make sure to commit and push these files to your repository:

```bash
git add amplify.yml frontend/.env.production frontend/public/_redirects
git commit -m "Add AWS Amplify deployment configuration"
git push origin main
```

## Step 2: Create Amplify App

### Option A: Using AWS Console (Recommended for first-time setup)

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Select your region: `ap-south-1` (Mumbai)

2. **Create New App**
   - Click "New app" → "Host web app"
   - Choose your Git provider (GitHub, GitLab, Bitbucket, or AWS CodeCommit)

3. **Connect Repository**
   - Authorize AWS Amplify to access your repository
   - Select your repository and branch (usually `main` or `master`)
   - Click "Next"

4. **Configure Build Settings**
   - App name: `carenav-ai` (or your preferred name)
   - Environment: `production`
   - The build settings should auto-detect from `amplify.yml`
   - Click "Next"

5. **Review and Deploy**
   - Review all settings
   - Click "Save and deploy"

### Option B: Using AWS CLI

```bash
# Install AWS Amplify CLI if not already installed
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

## Step 3: Configure Environment Variables

After creating the app, you need to set environment variables:

1. Go to your Amplify app in the AWS Console
2. Click on "Environment variables" in the left sidebar
3. Add the following variable:
   - Key: `VITE_API_URL`
   - Value: `https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod`
4. Click "Save"

## Step 4: Configure Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain name
4. Follow the instructions to configure DNS settings

## Step 5: Enable CORS on API Gateway

Make sure your API Gateway has CORS enabled for the Amplify domain:

1. Go to API Gateway Console
2. Select your API
3. For each resource, enable CORS:
   - Actions → Enable CORS
   - Add your Amplify domain to allowed origins
   - Click "Enable CORS and replace existing CORS headers"

## Step 6: Test Your Deployment

Once deployment is complete:

1. Amplify will provide a URL like: `https://main.xxxxxx.amplifyapp.com`
2. Open the URL in your browser
3. Test the following:
   - Login functionality
   - Patient registration
   - Symptom input
   - Doctor dashboard
   - All API calls work correctly

## Automatic Deployments

Amplify automatically deploys when you push to your connected branch:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# Amplify will automatically detect the push and deploy
```

## Monitoring and Logs

1. **Build Logs**: View in Amplify Console under "Build history"
2. **Access Logs**: Available in CloudWatch Logs
3. **Performance**: Monitor in Amplify Console under "Monitoring"

## Troubleshooting

### Build Fails

1. Check build logs in Amplify Console
2. Verify `amplify.yml` configuration
3. Ensure all dependencies are in `package.json`
4. Check Node.js version compatibility

### API Calls Fail

1. Verify `VITE_API_URL` environment variable
2. Check CORS configuration on API Gateway
3. Verify API Gateway is accessible
4. Check browser console for errors

### Routing Issues (404 on refresh)

1. Verify `_redirects` file exists in `frontend/public/`
2. Content should be: `/*    /index.html   200`
3. Redeploy if needed

## Cost Optimization

- **Free Tier**: 1000 build minutes/month, 15 GB served/month
- **Pricing**: After free tier, ~$0.01 per build minute, ~$0.15 per GB served
- **Tip**: Use branch-based deployments to save costs

## Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **HTTPS**: Amplify provides SSL certificates automatically
3. **Authentication**: Ensure JWT tokens are properly validated
4. **API Security**: Use API Gateway authorizers

## Useful Commands

```bash
# View app status
aws amplify list-apps --region ap-south-1

# Trigger manual deployment
aws amplify start-job --app-id <app-id> --branch-name main --job-type RELEASE --region ap-south-1

# View build logs
aws amplify list-jobs --app-id <app-id> --branch-name main --region ap-south-1
```

## Next Steps

1. Set up custom domain
2. Configure monitoring and alerts
3. Set up staging environment
4. Enable branch previews for pull requests
5. Configure build notifications (email/Slack)

## Support

- AWS Amplify Documentation: https://docs.aws.amazon.com/amplify/
- AWS Support: https://console.aws.amazon.com/support/

---

**Current Configuration:**
- API URL: `https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod`
- Region: `ap-south-1` (Mumbai)
- Build Command: `npm run build`
- Output Directory: `frontend/dist`
