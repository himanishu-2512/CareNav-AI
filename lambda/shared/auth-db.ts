// Authentication-related DynamoDB operations
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { User, Session, DynamoDBKeys } from './types';

/**
 * Create a new user in DynamoDB
 */
export async function createUser(user: User): Promise<void> {
  const keys = DynamoDBKeys.user(user.userId);
  
  await dynamoDbClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...keys,
      ...user
    }
  }));
}

/**
 * Get user by userId
 */
export async function getUserById(userId: string): Promise<User | null> {
  const keys = DynamoDBKeys.user(userId);
  
  const result = await dynamoDbClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: keys
  }));
  
  return result.Item as User | null;
}

/**
 * Get user by email using EmailIndex GSI
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await dynamoDbClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  }));
  
  if (!result.Items || result.Items.length === 0) {
    return null;
  }
  
  return result.Items[0] as User;
}

/**
 * Create a new session in DynamoDB
 */
export async function createSession(session: Session): Promise<void> {
  const keys = DynamoDBKeys.session(session.token);
  
  await dynamoDbClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...keys,
      ...session
    }
  }));
}

/**
 * Get session by token
 */
export async function getSession(token: string): Promise<Session | null> {
  const keys = DynamoDBKeys.session(token);
  
  const result = await dynamoDbClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: keys
  }));
  
  return result.Item as Session | null;
}

/**
 * Delete session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  const keys = DynamoDBKeys.session(token);
  
  await dynamoDbClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: keys
  }));
}

/**
 * Check if session is valid (exists and not expired)
 */
export async function isSessionValid(token: string): Promise<boolean> {
  const session = await getSession(token);
  
  if (!session) {
    return false;
  }
  
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  
  return now < expiresAt;
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'userId' | 'passwordHash' | 'createdAt'>>
): Promise<User> {
  const keys = DynamoDBKeys.user(userId);

  // Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Add fields to update
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'userId' && key !== 'passwordHash' && key !== 'createdAt') {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  if (updateExpressions.length === 0) {
    throw new Error('No fields to update');
  }

  const result = await dynamoDbClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: keys,
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }));

  if (!result.Attributes) {
    throw new Error('Failed to update user');
  }

  const { PK, SK, ...user } = result.Attributes;
  return user as User;
}
