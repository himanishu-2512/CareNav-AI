// Chat Message DynamoDB operations
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { ChatMessage, DynamoDBKeys } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add a message to a chat thread
 * @param episodeId - Treatment episode ID
 * @param sender - Message sender ('doctor' | 'patient' | 'system')
 * @param senderName - Name of the sender
 * @param content - Message content
 * @param type - Message type ('text' | 'prescription' | 'document' | 'recommendation')
 * @param metadata - Optional metadata (prescription ID, document ID, etc.)
 * @returns Created chat message
 */
export async function addMessage(
  episodeId: string,
  sender: 'doctor' | 'patient' | 'system',
  senderName: string,
  content: string,
  type: 'text' | 'prescription' | 'document' | 'recommendation' = 'text',
  metadata?: Record<string, any>
): Promise<ChatMessage> {
  const messageId = uuidv4();
  const now = new Date().toISOString();

  const message: ChatMessage = {
    messageId,
    episodeId,
    sender,
    senderName,
    content,
    type,
    createdAt: now
  };

  // Add metadata if provided
  if (metadata) {
    message.metadata = metadata;
  }

  const keys = DynamoDBKeys.chatMessage(episodeId, now, messageId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...message
      }
    })
  );

  return message;
}

/**
 * Get all messages for an episode in chronological order
 * @param episodeId - Treatment episode ID
 * @returns Array of chat messages sorted chronologically (oldest first)
 */
export async function getEpisodeMessages(
  episodeId: string
): Promise<ChatMessage[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `EPISODE#${episodeId}`,
        ':sk': 'MESSAGE#'
      },
      // Messages are already sorted chronologically by SK (MESSAGE#{timestamp}#{messageId})
      ScanIndexForward: true // Ascending order (oldest first)
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Convert to ChatMessage objects
  const messages = result.Items.map(item => {
    const { PK, SK, ...message } = item;
    return message as ChatMessage;
  });

  return messages;
}

/**
 * Get messages of a specific type for an episode
 * @param episodeId - Treatment episode ID
 * @param type - Message type to filter by
 * @returns Array of chat messages of the specified type, sorted chronologically
 */
export async function getMessagesByType(
  episodeId: string,
  type: 'text' | 'prescription' | 'document' | 'recommendation'
): Promise<ChatMessage[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':pk': `EPISODE#${episodeId}`,
        ':sk': 'MESSAGE#',
        ':type': type
      },
      ScanIndexForward: true // Ascending order (oldest first)
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Convert to ChatMessage objects
  const messages = result.Items.map(item => {
    const { PK, SK, ...message } = item;
    return message as ChatMessage;
  });

  return messages;
}
