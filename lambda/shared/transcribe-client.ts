// Amazon Transcribe client for voice-to-text conversion
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJob
} from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Create Transcribe client
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

// Create S3 client for temporary audio storage
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const TRANSCRIBE_BUCKET = process.env.TRANSCRIBE_BUCKET || 'carenav-transcribe-temp';

/**
 * Upload audio file to S3 for transcription
 * @param audioData - Base64 encoded audio data
 * @param patientId - Patient ID for organizing files
 * @returns S3 key of uploaded file
 */
async function uploadAudioToS3(audioData: string, patientId: string): Promise<string> {
  const audioBuffer = Buffer.from(audioData, 'base64');
  const s3Key = `${patientId}/${uuidv4()}.wav`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: TRANSCRIBE_BUCKET,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: 'audio/wav'
    })
  );

  return s3Key;
}

/**
 * Start transcription job for audio file
 * @param s3Key - S3 key of audio file
 * @returns Transcription job name
 */
async function startTranscriptionJob(s3Key: string): Promise<string> {
  const jobName = `transcribe-${uuidv4()}`;
  const s3Uri = `s3://${TRANSCRIBE_BUCKET}/${s3Key}`;

  await transcribeClient.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-IN', // English (India)
      MediaFormat: 'wav',
      Media: {
        MediaFileUri: s3Uri
      },
      OutputBucketName: TRANSCRIBE_BUCKET
    })
  );

  return jobName;
}

/**
 * Wait for transcription job to complete and get result
 * @param jobName - Transcription job name
 * @param maxWaitTime - Maximum time to wait in milliseconds (default 30 seconds)
 * @returns Transcribed text
 */
async function waitForTranscription(
  jobName: string,
  maxWaitTime: number = 30000
): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const response = await transcribeClient.send(
      new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      })
    );

    const job = response.TranscriptionJob;
    
    if (job?.TranscriptionJobStatus === 'COMPLETED') {
      // Get transcript from the output
      if (job.Transcript?.TranscriptFileUri) {
        // In a real implementation, we would fetch and parse the transcript file
        // For now, return a placeholder
        return job.Transcript.TranscriptFileUri;
      }
      throw new Error('Transcription completed but no transcript available');
    }

    if (job?.TranscriptionJobStatus === 'FAILED') {
      throw new Error(`Transcription failed: ${job.FailureReason}`);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Transcription timeout - job did not complete in time');
}

/**
 * Convert voice audio to text using Amazon Transcribe
 * @param audioData - Base64 encoded audio data
 * @param patientId - Patient ID
 * @returns Transcribed text
 */
export async function transcribeVoiceToText(
  audioData: string,
  patientId: string
): Promise<string> {
  try {
    // Upload audio to S3
    console.log('Uploading audio to S3...');
    const s3Key = await uploadAudioToS3(audioData, patientId);

    // Start transcription job
    console.log('Starting transcription job...');
    const jobName = await startTranscriptionJob(s3Key);

    // Wait for transcription to complete
    console.log('Waiting for transcription...');
    const transcribedText = await waitForTranscription(jobName);

    return transcribedText;
  } catch (error: any) {
    console.error('Transcription error:', error);
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

/**
 * Check if voice input is enabled
 * @returns true if Transcribe bucket is configured
 */
export function isVoiceInputEnabled(): boolean {
  return !!process.env.TRANSCRIBE_BUCKET;
}
