# API Gateway GET User Endpoint Fix

## Problem
Getting **403 Forbidden** error when trying to access `GET /api/auth/user/{userId}` endpoint from the frontend.

**Error Details:**
- Request URL: `https://qbjihwzkf1.execute-api.ap-south-1.amazonaws.com/prod/api/auth/user/{userId}`
- Request Method: GET
- Status Code: 403 Forbidden
- Error: The endpoint exists in the Lambda handler but is not configured in API Gateway

## Root Cause
The API Gateway configuration in `lib/backend-stack.ts` was missing the GET method for the `/api/auth/user/{userId}` resource. Only the PUT method was configured:

```typescript
userIdResource.addMethod('PUT', authIntegration, { authorizer });
// GET method was missing!
```

## Solution

### Updated API Gateway Configuration
**File**: `lib/backend-stack.ts`

Added the GET method to the user resource:

```typescript
// Add methods to auth resources (no authorizer needed for login/logout)
loginResource.addMethod('POST', authIntegration);
registerAuthResource.addMethod('POST', authIntegration);
logoutResource.addMethod('POST', authIntegration);
userIdResource.addMethod('PUT', authIntegration, { authorizer });
userIdResource.addMethod('GET', authIntegration, { authorizer });  // ← NEW LINE
```

## What This Fixes

1. **GET Endpoint Now Available**: The `GET /api/auth/user/{userId}` endpoint is now properly configured in API Gateway
2. **Authorization Required**: The endpoint requires a valid JWT token (Bearer token in Authorization header)
3. **CORS Enabled**: The endpoint has CORS enabled through the default CORS configuration
4. **Lambda Integration**: Requests are properly routed to the auth Lambda handler

## Deployment Required

After making this change, you need to redeploy the backend stack:

```bash
cdk deploy BackendStack
```

Or deploy all stacks:

```bash
npm run deploy
```

## Testing After Deployment

### Test the GET Endpoint:

```bash
curl -X GET \
  https://your-api-url.execute-api.ap-south-1.amazonaws.com/prod/api/auth/user/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "patient",
    "name": "John Doe",
    "age": 25,
    "dateOfBirth": "1999-01-01",
    "gender": "male",
    "contact": "1234567890",
    "bloodGroup": "O+",
    "parentName": "Parent Name"
  }
}
```

## Complete Auth Endpoints After Fix

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/logout` | No | User logout |
| PUT | `/api/auth/user/{userId}` | Yes | Update user profile |
| GET | `/api/auth/user/{userId}` | Yes | Get user profile (NEW) |

## Files Modified

1. `lib/backend-stack.ts`
   - Added GET method for `/api/auth/user/{userId}` resource
   - Configured with JWT authorizer
   - Uses existing auth Lambda integration

## Related Changes

This fix completes the profile refetch feature:
1. **Backend Lambda**: `handleGetUser()` function already implemented in `lambda/auth-handler/index.ts`
2. **API Gateway**: GET method now configured (this fix)
3. **Frontend**: `refreshUser()` in AuthContext already calls the GET endpoint

## Verification Steps

After deployment:

1. Login as a patient
2. Open browser DevTools → Network tab
3. Edit profile and save changes
4. Check Network tab for `GET /api/auth/user/{userId}` request
5. **Expected**: Status 200 OK with user data
6. **Before Fix**: Status 403 Forbidden

## Security Considerations

- GET endpoint requires valid JWT token
- Only returns data for the authenticated user
- Password hash is never returned
- CORS is properly configured
- Uses the same authorizer as other protected endpoints

## Impact

This fix enables:
- Automatic profile refresh after updates
- Real-time data synchronization across components
- No need for manual page refresh
- Consistent user experience

## Deployment Command

```bash
# Deploy only the backend stack
cdk deploy BackendStack

# Or deploy all stacks
npm run deploy

# Or use the deployment script
./deploy.sh
```

## Post-Deployment Verification

1. Check API Gateway console:
   - Navigate to API Gateway → CareNav AI API
   - Go to Resources
   - Find `/api/auth/user/{userId}`
   - Verify both GET and PUT methods exist

2. Test from frontend:
   - Login as patient
   - Edit profile
   - Save changes
   - Verify profile updates immediately without page refresh

3. Check CloudWatch Logs:
   - Look for "User {userId} fetched successfully" log entries
   - Verify no 403 errors in logs

## Troubleshooting

### If still getting 403 after deployment:

1. **Clear API Gateway cache**:
   ```bash
   aws apigateway flush-stage-cache \
     --rest-api-id YOUR_API_ID \
     --stage-name prod \
     --region ap-south-1
   ```

2. **Verify deployment**:
   ```bash
   aws apigateway get-resources \
     --rest-api-id YOUR_API_ID \
     --region ap-south-1
   ```

3. **Check authorizer**:
   - Ensure JWT token is valid
   - Check token expiration
   - Verify Authorization header format: `Bearer <token>`

4. **Redeploy API**:
   ```bash
   aws apigateway create-deployment \
     --rest-api-id YOUR_API_ID \
     --stage-name prod \
     --region ap-south-1
   ```

## Summary

The 403 Forbidden error was caused by a missing API Gateway method configuration. The Lambda handler was ready, but API Gateway wasn't routing GET requests to it. Adding the GET method configuration fixes the issue and enables the profile refetch feature to work properly.
