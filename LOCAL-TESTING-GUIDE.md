# Local Testing Guide - CareNav AI

## Option 1: Frontend Only (UI Testing) ⚡ Fastest

Test the UI without deploying to AWS. Perfect for:
- UI/UX testing
- Component testing
- Layout verification
- Navigation testing

### Steps:

1. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

2. **Create Mock API (Optional)**
Create `frontend/src/lib/mock-api.ts`:
```typescript
// Mock API responses for local testing
export const mockLogin = async (email: string, password: string) => {
  return {
    token: 'mock-jwt-token',
    user: {
      userId: 'mock-user-123',
      email: email,
      role: email.includes('doctor') ? 'doctor' : 'patient'
    }
  };
};

export const mockSymptomSubmit = async (symptoms: string) => {
  return {
    symptomId: 'mock-symptom-123',
    structured: {
      bodyPart: 'head',
      duration: '2 days',
      severity: 'moderate',
      associatedFactors: ['headache', 'fever']
    }
  };
};
```

3. **Update Axios to Use Mock (Optional)**
In `frontend/src/lib/axios.ts`, add mock mode:
```typescript
const USE_MOCK = true; // Set to false for real API

if (USE_MOCK) {
  // Return mock data instead of API calls
}
```

4. **Start Frontend**
```bash
npm run dev
```

5. **Open Browser**
```
http://localhost:3000
```

### What You Can Test:
- ✅ Login page UI
- ✅ Dashboard layout
- ✅ All component rendering
- ✅ Navigation between pages
- ✅ Form validation
- ✅ Loading states
- ✅ Error messages
- ✅ Responsive design

### What Won't Work:
- ❌ Real authentication
- ❌ Data persistence
- ❌ AI responses
- ❌ File uploads
- ❌ Backend integration

---

## Option 2: Full Local Stack (Frontend + Backend) 🔧 Complete

Run everything locally including backend services.

### Prerequisites:
- Docker Desktop installed
- AWS CLI configured
- LocalStack (for AWS services locally)

### Steps:

#### 1. Install LocalStack
```bash
pip install localstack
```

#### 2. Start LocalStack
```bash
localstack start
```

This provides local versions of:
- DynamoDB
- S3
- Lambda
- API Gateway

#### 3. Configure Local AWS Endpoint
Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:4566
AWS_ENDPOINT=http://localhost:4566
```

#### 4. Deploy to LocalStack
```bash
# Set LocalStack endpoint
export AWS_ENDPOINT_URL=http://localhost:4566

# Deploy CDK to LocalStack
cdklocal bootstrap
cdklocal deploy --all
```

#### 5. Create Local Test Users
```bash
cd lambda
AWS_ENDPOINT_URL=http://localhost:4566 npx ts-node scripts/create-test-user.ts
```

#### 6. Start Frontend
```bash
cd frontend
npm run dev
```

### What You Can Test:
- ✅ Everything from Option 1
- ✅ Real authentication flow
- ✅ Data persistence
- ✅ Database operations
- ✅ File uploads to local S3
- ⚠️ AI responses (requires Bedrock - won't work locally)

### Limitations:
- ❌ Amazon Bedrock (AI) - requires real AWS
- ❌ Amazon Textract (OCR) - requires real AWS
- ❌ Amazon Transcribe - requires real AWS

---

## Option 3: Hybrid (Frontend Local + AWS Backend) 🎯 Recommended

Best of both worlds - test UI locally with real AWS backend.

### Steps:

#### 1. Deploy Backend to AWS (One Time)
```bash
# Install dependencies
npm install
cd lambda && npm install && cd ..

# Deploy to AWS
npx cdk deploy --all
```

#### 2. Get API URL
After deployment:
```
ApiStack.ApiEndpoint = https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

#### 3. Configure Frontend
Edit `frontend/.env`:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

#### 4. Create Test Users (One Time)
```bash
cd lambda
npx ts-node scripts/create-test-user.ts
```

#### 5. Start Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

#### 6. Test Everything
Open `http://localhost:3000`

Login with:
- Patient: `patient@demo.com` / `demo123`
- Doctor: `doctor@demo.com` / `demo123`

### What You Can Test:
- ✅ Everything works!
- ✅ Real AI responses
- ✅ Real file uploads
- ✅ Real database
- ✅ Fast frontend development
- ✅ Hot reload for UI changes

### Benefits:
- 🚀 Fast UI iteration
- 💰 Only pay for backend usage
- 🔄 Real AWS services
- 🎨 Easy styling changes

---

## Quick Test Scenarios

### Scenario 1: Test UI Only (5 minutes)
```bash
cd frontend
npm install
npm run dev
```
Navigate through pages, test forms, check layouts.

### Scenario 2: Test with Mock Data (10 minutes)
1. Create mock API responses
2. Update axios to use mocks
3. Test complete user flows

### Scenario 3: Test with Real Backend (20 minutes)
1. Deploy to AWS once
2. Run frontend locally
3. Test everything end-to-end

---

## Recommended Approach

**For UI Development:**
→ Use Option 1 (Frontend Only)

**For Feature Testing:**
→ Use Option 3 (Hybrid)

**For Full Integration:**
→ Deploy everything to AWS

---

## Testing Checklist

### Frontend Only Testing
- [ ] Install frontend dependencies
- [ ] Start dev server
- [ ] Test login page
- [ ] Test navigation
- [ ] Test form validation
- [ ] Test responsive design

### Full Stack Testing
- [ ] Deploy backend to AWS
- [ ] Configure frontend .env
- [ ] Create test users
- [ ] Start frontend locally
- [ ] Test patient flow
- [ ] Test doctor flow
- [ ] Test AI features
- [ ] Test file uploads

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- --port 3001
```

### Module Not Found
```bash
cd frontend
rm -rf node_modules
npm install
```

### API Connection Failed
1. Check .env file has correct API URL
2. Verify backend is deployed
3. Check CORS settings
4. Test API with curl:
```bash
curl https://your-api-url.amazonaws.com/prod/health
```

### Hot Reload Not Working
```bash
# Restart dev server
npm run dev
```

---

## Development Workflow

### Daily Development:
1. Start frontend: `cd frontend && npm run dev`
2. Make UI changes
3. See changes instantly (hot reload)
4. Test with real backend

### When Backend Changes:
1. Update Lambda code
2. Deploy: `npx cdk deploy --all`
3. Frontend automatically uses new backend

### Before Committing:
1. Test all user flows
2. Check console for errors
3. Verify responsive design
4. Test on different browsers

---

## Performance Tips

### Faster Frontend Startup:
- Use `npm run dev` (Vite is fast!)
- Keep node_modules updated
- Clear browser cache

### Faster Backend Testing:
- Deploy once, test many times
- Use CloudWatch Logs for debugging
- Test API endpoints with Postman

### Faster Iteration:
- Frontend changes = instant (hot reload)
- Backend changes = redeploy (5 min)
- Database changes = update CDK + redeploy

---

## Cost Considerations

### Option 1 (Frontend Only):
- **Cost**: $0 (completely free)
- **Time**: 5 minutes setup

### Option 2 (Full Local):
- **Cost**: $0 (local only)
- **Time**: 30 minutes setup
- **Limitations**: No AI features

### Option 3 (Hybrid):
- **Cost**: ~$1-5/day (AWS backend)
- **Time**: 20 minutes setup
- **Benefits**: Everything works

---

## Next Steps

1. Choose your testing approach
2. Follow the steps above
3. Start testing!
4. Report any issues

**Recommended**: Start with Option 3 (Hybrid) for best experience.
