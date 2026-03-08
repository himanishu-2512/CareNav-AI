# Authentication Handler

This Lambda function handles user authentication for the CareNav AI system.

## Endpoints

### POST /api/auth/login

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "uuid-here",
  "role": "patient",
  "expiresAt": "2024-01-02T12:00:00.000Z"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### POST /api/auth/logout

Invalidates the current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Implementation Details

### Password Security
- Passwords are hashed using bcryptjs with salt rounds of 10
- Password hashes are stored in DynamoDB
- Plain text passwords are never stored

### JWT Tokens
- Tokens are signed using HS256 algorithm
- Token expiration: 24 hours
- Token payload includes: userId, role, email
- JWT secret is stored in AWS Secrets Manager

### Session Management
- Sessions are stored in DynamoDB with the token as the key
- Sessions include: token, userId, role, expiresAt, createdAt
- Sessions are validated on each request by the Lambda authorizer
- Logout deletes the session from DynamoDB

### DynamoDB Schema

**User Record:**
```
PK: USER#{userId}
SK: PROFILE
userId: string
email: string (indexed via EmailIndex GSI)
passwordHash: string
role: "patient" | "doctor"
createdAt: ISO timestamp
```

**Session Record:**
```
PK: SESSION#{token}
SK: METADATA
token: string
userId: string
role: "patient" | "doctor"
expiresAt: ISO timestamp
createdAt: ISO timestamp
```

## Testing

### Create Test Users

Run the test user creation script after deploying infrastructure:

```bash
cd lambda
npm run create-test-users
```

This creates:
- Patient: `patient@demo.com` / `patient123`
- Doctor: `doctor@demo.com` / `doctor123`

### Test Login

```bash
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@demo.com",
    "password": "patient123"
  }'
```

### Test Logout

```bash
curl -X POST https://your-api-url/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Security Considerations

1. **JWT Secret**: Must be stored securely in AWS Secrets Manager
2. **HTTPS Only**: All authentication endpoints must use HTTPS
3. **Token Expiration**: Tokens expire after 24 hours
4. **Session Validation**: Every protected endpoint validates the session
5. **Password Hashing**: Uses bcrypt with appropriate salt rounds
6. **Rate Limiting**: API Gateway should implement rate limiting

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name (default: carenav-patients)
- `JWT_SECRET`: Secret key for JWT signing (from Secrets Manager)
- `AWS_REGION`: AWS region (default: ap-south-1)

## Error Handling

The handler includes comprehensive error handling:
- Missing request body → 400 Bad Request
- Missing required fields → 400 Bad Request
- Invalid credentials → 401 Unauthorized
- Server errors → 500 Internal Server Error

All errors are logged to CloudWatch for debugging.

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **10.1**: User authentication required for protected features
- **10.2**: Session creation with expiration time
- **10.3**: Session allows access to user-specific data
- **10.5**: Session invalidation on logout
- **12.2**: Encryption at rest using AWS KMS (DynamoDB)
