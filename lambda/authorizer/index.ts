// API Gateway Lambda Authorizer
import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  PolicyDocument,
  Statement
} from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { getSession, isSessionValid } from '../shared/auth-db';

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  role: 'patient' | 'doctor';
  email: string;
  iat: number;
  exp: number;
}

/**
 * Lambda authorizer for API Gateway
 * Validates JWT tokens and checks session validity
 */
export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  console.log('Authorizer invoked for:', event.methodArn);

  try {
    // Extract token from Authorization header
    const token = event.authorizationToken?.replace(/^Bearer\s+/i, '');

    if (!token) {
      console.log('Authorization failed: No token provided');
      throw new Error('Unauthorized');
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error: any) {
      console.log('Authorization failed: Invalid JWT token', error.message);
      throw new Error('Unauthorized');
    }

    // Check if session exists and is valid in DynamoDB
    const sessionValid = await isSessionValid(token);

    if (!sessionValid) {
      console.log('Authorization failed: Session expired or not found');
      throw new Error('Unauthorized');
    }

    console.log(`Authorization successful for user ${decoded.userId} (${decoded.role})`);

    // Generate IAM policy allowing access
    const policy = generatePolicy(
      decoded.userId,
      'Allow',
      event.methodArn,
      {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email
      }
    );

    return policy;
  } catch (error: any) {
    console.error('Authorizer error:', error);
    // Return explicit deny policy
    throw new Error('Unauthorized');
  }
}

/**
 * Generate IAM policy document
 */
function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: Record<string, string>
): APIGatewayAuthorizerResult {
  const statement: Statement = {
    Action: 'execute-api:Invoke',
    Effect: effect,
    Resource: resource
  };

  // Allow access to all methods in the API (wildcard)
  // This is simpler for development; in production, you might want more granular control
  const resourceParts = resource.split('/');
  const apiGatewayArn = resourceParts.slice(0, 2).join('/'); // arn:aws:execute-api:region:account:api-id
  const wildcardResource = `${apiGatewayArn}/*/*`;

  statement.Resource = wildcardResource;

  const policyDocument: PolicyDocument = {
    Version: '2012-10-17',
    Statement: [statement]
  };

  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument,
    context: context || {}
  };

  return authResponse;
}
