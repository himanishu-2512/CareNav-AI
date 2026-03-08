# Lambda Authorizer

This Lambda function serves as an API Gateway authorizer, validating JWT tokens and checking session validity for protected endpoints.

## Overview

The authorizer is invoked by API Gateway before allowing access to protected endpoints. It:
1. Extracts the JWT token from the Authorization header
2. Verifies the JWT signature and expiration
3. Checks if the session exists and is valid in DynamoDB
4. Returns an IAM policy allowing or denying access

## How It Works

### Request Flow

```
Client Request
    ↓
API Gateway
    ↓
Lambda Authorizer (this function)
    ↓ (validates token)
DynamoDB (check session)
    ↓
IAM Policy (Allow/Deny)
    ↓
Protected Lambda Function (if allowed)
```

### Authorization Header Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### IAM Policy Response

**Allow Policy:**
```json
{
  "principalId": "user-id-here",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Allow",
      "Resource": "arn:aws:execute-api:region:account:api-id/*/POST/*"
    }]
  },
  "context": {
    "userId": "user-id-here",
    "role": "patient",
    "email": "user@example.com"
  }
}
```

**Deny (throws "Unauthorized" error):**
- Invalid token
- Expired token
- Session not found
- Session expired

## Token Validation

The authorizer performs the following validations:

1. **Token Presence**: Checks if Authorization header exists
2. **JWT Verification**: Validates signature using JWT_SECRET
3. **Token Expiration**: Checks if token has expired
4. **Session Validity**: Queries DynamoDB to ensure session exists and hasn't expired

## Context Propagation

The authorizer adds user information to the request context, which is available to downstream Lambda functions:

```typescript
// In protected Lambda functions
const userId = event.requestContext.authorizer.userId;
const role = event.requestContext.authorizer.role;
const email = event.requestContext.authorizer.email;
```

## Caching

API Gateway caches authorizer results for 5 minutes (configurable) based on the token. This reduces:
- DynamoDB read operations
- Lambda invocations
- Response latency

**Note**: Cached results mean logout may take up to 5 minutes to take effect. For immediate logout, reduce cache TTL or implement token blacklisting.

## Protected Endpoints

The following endpoints require authorization:

- `POST /api/patients/register`
- `POST /api/symptoms/input`
- `POST /api/symptoms/followup`
- `POST /api/symptoms/followup/answer`
- `POST /api/navigation/recommend`
- `POST /api/reports/upload`
- `POST /api/treatment/create`
- `GET /api/treatment/schedule/:patientId`
- `POST /api/treatment/mark-taken`
- `GET /api/adherence/:patientId`

## Public Endpoints

These endpoints do NOT require authorization:

- `POST /api/auth/login`
- `POST /api/auth/logout`

## Error Handling

### Common Authorization Failures

1. **Missing Authorization Header**
   - Error: "Unauthorized"
   - Cause: No Authorization header in request

2. **Invalid Token Format**
   - Error: "Unauthorized"
   - Cause: Token doesn't match JWT format

3. **Invalid Signature**
   - Error: "Unauthorized"
   - Cause: Token signed with different secret

4. **Expired Token**
   - Error: "Unauthorized"
   - Cause: Token exp claim is in the past

5. **Session Not Found**
   - Error: "Unauthorized"
   - Cause: Session deleted (logout) or never created

6. **Session Expired**
   - Error: "Unauthorized"
   - Cause: Session expiresAt timestamp is in the past

## Testing

### Test with Valid Token

```bash
# First, login to get a token
TOKEN=$(curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@demo.com","password":"patient123"}' \
  | jq -r '.token')

# Then use the token to access a protected endpoint
curl -X POST https://your-api-url/api/symptoms/input \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"123","symptomText":"test"}'
```

### Test with Invalid Token

```bash
curl -X POST https://your-api-url/api/symptoms/input \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"123","symptomText":"test"}'

# Expected: 401 Unauthorized
```

### Test without Token

```bash
curl -X POST https://your-api-url/api/symptoms/input \
  -H "Content-Type: application/json" \
  -d '{"patientId":"123","symptomText":"test"}'

# Expected: 401 Unauthorized
```

## Performance Considerations

### Lambda Configuration
- **Memory**: 256 MB (sufficient for JWT validation)
- **Timeout**: 10 seconds
- **Cold Start**: ~100-200ms
- **Warm Execution**: ~10-50ms

### DynamoDB Reads
- Each authorization requires 1 DynamoDB read (GetItem)
- Cached results reduce DynamoDB load
- Consider using DynamoDB DAX for high-traffic scenarios

### Optimization Tips
1. Enable result caching (5 minutes recommended)
2. Use provisioned concurrency for critical APIs
3. Monitor CloudWatch metrics for throttling
4. Implement exponential backoff for DynamoDB errors

## Security Best Practices

1. **JWT Secret Rotation**: Rotate JWT_SECRET periodically
2. **Short Token Lifetime**: 24 hours is reasonable for demo; consider shorter for production
3. **HTTPS Only**: Never send tokens over HTTP
4. **Token Storage**: Store tokens securely on client (httpOnly cookies or secure storage)
5. **Logging**: Log authorization failures for security monitoring
6. **Rate Limiting**: Implement API Gateway rate limiting to prevent brute force

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name
- `JWT_SECRET`: Secret key for JWT verification (must match auth handler)
- `AWS_REGION`: AWS region

## CloudWatch Logs

The authorizer logs the following:
- Authorization attempts (success/failure)
- User ID and role for successful authorizations
- Error details for failed authorizations

**Log Format:**
```
Authorizer invoked for: arn:aws:execute-api:...
Authorization successful for user abc-123 (patient)
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **10.1**: Authentication required for protected features
- **10.4**: Session expiration and redirect (via 401 response)
- **10.6**: Role-based access control (role in context)

## Troubleshooting

### Issue: Always getting 401 Unauthorized

**Possible Causes:**
1. JWT_SECRET mismatch between auth handler and authorizer
2. Session not created during login
3. Token expired
4. DynamoDB table permissions missing

**Debug Steps:**
1. Check CloudWatch logs for authorizer
2. Verify JWT_SECRET in both functions
3. Test token with jwt.io
4. Check DynamoDB for session record

### Issue: Authorization works but user context is empty

**Cause:** Context not properly set in IAM policy

**Solution:** Ensure authorizer returns context object with userId, role, email

### Issue: Slow authorization response

**Possible Causes:**
1. Cold start
2. DynamoDB throttling
3. No result caching

**Solutions:**
1. Enable provisioned concurrency
2. Increase DynamoDB capacity or use on-demand
3. Enable and tune result caching
