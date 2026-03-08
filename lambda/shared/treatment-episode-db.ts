// Treatment Episode DynamoDB operations
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { TreatmentEpisode, DynamoDBKeys } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new treatment episode
 * @param patientId - Patient's ID
 * @param doctorId - Doctor's user ID
 * @param initialSymptoms - Optional initial symptoms description
 * @returns Created treatment episode
 */
export async function createEpisode(
  patientId: string,
  doctorId: string,
  initialSymptoms?: string
): Promise<TreatmentEpisode> {
  const episodeId = uuidv4();
  const now = new Date().toISOString();

  const episode: TreatmentEpisode = {
    episodeId,
    patientId,
    doctorId,
    startDate: now,
    status: 'ongoing',
    createdAt: now,
    updatedAt: now
  };

  const keys = DynamoDBKeys.treatmentEpisode(patientId, episodeId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...episode,
        // GSI1 for patient-episode queries sorted by date
        GSI1PK: `PATIENT#${patientId}`,
        GSI1SK: `EPISODE#${now}`
      }
    })
  );

  return episode;
}

/**
 * Get a treatment episode by ID
 * @param patientId - Patient's ID
 * @param episodeId - Episode ID
 * @returns Treatment episode or null if not found
 */
export async function getEpisode(
  patientId: string,
  episodeId: string
): Promise<TreatmentEpisode | null> {
  const keys = DynamoDBKeys.treatmentEpisode(patientId, episodeId);

  const result = await dynamoDbClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: keys
    })
  );

  if (!result.Item) {
    return null;
  }

  // Remove DynamoDB keys from response
  const { PK, SK, GSI1PK, GSI1SK, ...episode } = result.Item;
  return episode as TreatmentEpisode;
}

/**
 * Get all treatment episodes for a patient with optional status filtering
 * @param patientId - Patient's ID
 * @param statusFilter - Optional status filter ('ongoing' | 'completed')
 * @returns Array of treatment episodes sorted by start date (most recent first)
 */
export async function getPatientEpisodes(
  patientId: string,
  statusFilter?: 'ongoing' | 'completed'
): Promise<TreatmentEpisode[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'EPISODE#'
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Convert to TreatmentEpisode objects
  let episodes = result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, ...episode } = item;
    return episode as TreatmentEpisode;
  });

  // Apply status filter if provided
  if (statusFilter) {
    episodes = episodes.filter(episode => episode.status === statusFilter);
  }

  // Sort by start date (most recent first)
  episodes.sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return episodes;
}

/**
 * Complete a treatment episode
 * Updates status to 'completed', sets end date, and records diagnosis and outcome
 * @param patientId - Patient's ID
 * @param episodeId - Episode ID
 * @param diagnosis - Final diagnosis
 * @param outcome - Treatment outcome description
 * @returns Updated treatment episode
 */
export async function completeEpisode(
  patientId: string,
  episodeId: string,
  diagnosis: string,
  outcome: string
): Promise<TreatmentEpisode> {
  const now = new Date().toISOString();
  const keys = DynamoDBKeys.treatmentEpisode(patientId, episodeId);

  await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET #status = :status, endDate = :endDate, diagnosis = :diagnosis, outcome = :outcome, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':endDate': now,
        ':diagnosis': diagnosis,
        ':outcome': outcome,
        ':updatedAt': now
      }
    })
  );

  // Fetch and return the updated episode
  const updatedEpisode = await getEpisode(patientId, episodeId);
  
  if (!updatedEpisode) {
    throw new Error(`Episode ${episodeId} not found after update`);
  }

  return updatedEpisode;
}
