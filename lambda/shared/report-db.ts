// Report database operations
import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { Report, ReportSummary, DynamoDBKeys } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Store a report in DynamoDB
 */
export async function createReport(
  patientId: string,
  s3Key: string,
  extractedText: string,
  summary: ReportSummary
): Promise<Report> {
  const reportId = uuidv4();
  const report: Report = {
    reportId,
    patientId,
    s3Key,
    extractedText,
    summary,
    uploadedAt: new Date().toISOString()
  };

  const keys = DynamoDBKeys.report(patientId, reportId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...report
      }
    })
  );

  return report;
}

/**
 * Get a specific report by ID
 */
export async function getReport(patientId: string, reportId: string): Promise<Report | null> {
  const keys = DynamoDBKeys.report(patientId, reportId);

  const result = await dynamoDbClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: keys
    })
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as Report;
}

/**
 * Get all reports for a patient
 */
export async function getPatientReports(patientId: string): Promise<Report[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'REPORT#'
      }
    })
  );

  return (result.Items || []) as Report[];
}

/**
 * Generate medical timeline from patient reports
 * Sorts reports chronologically and creates a structured summary
 */
export async function generateMedicalTimeline(patientId: string): Promise<{
  timeline: Array<{
    date: string;
    reportType: string;
    keyFindings: string[];
    diagnoses: string[];
    medications: string[];
  }>;
  allRedFlags: string[];
}> {
  const reports = await getPatientReports(patientId);

  // Sort reports by date (most recent first)
  const sortedReports = reports.sort((a, b) => {
    const dateA = a.summary.reportDate || a.uploadedAt;
    const dateB = b.summary.reportDate || b.uploadedAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Build timeline
  const timeline = sortedReports.map(report => ({
    date: report.summary.reportDate || report.uploadedAt.split('T')[0],
    reportType: report.summary.reportType || 'Medical Report',
    keyFindings: report.summary.keyFindings,
    diagnoses: report.summary.diagnoses,
    medications: report.summary.medications
  }));

  // Collect all unique red flags
  const allRedFlagsSet = new Set<string>();
  sortedReports.forEach(report => {
    report.summary.redFlags.forEach(flag => allRedFlagsSet.add(flag));
  });

  return {
    timeline,
    allRedFlags: Array.from(allRedFlagsSet)
  };
}
