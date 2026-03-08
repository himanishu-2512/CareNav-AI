// Reminder Processor Lambda Handler
// Processes scheduled medication reminders triggered by EventBridge

import { EventBridgeEvent } from 'aws-lambda';
import { EventBridgeClient, DisableRuleCommand } from '@aws-sdk/client-eventbridge';
import { createDose } from '../shared/treatment-db';

// Initialize EventBridge client
const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

interface ReminderEventDetail {
  patientId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  time: string;
  stopDate: string;
  ruleName: string;
}

export async function handler(event: EventBridgeEvent<string, ReminderEventDetail>): Promise<any> {
  try {
    console.log('Reminder event received:', JSON.stringify(event, null, 2));

    const detail = event.detail;
    const { patientId, medicineId, medicineName, dosage, time, stopDate, ruleName } = detail;

    // Check if we've passed stop date
    const now = new Date();
    const stopDateTime = new Date(stopDate);

    if (now > stopDateTime) {
      console.log(`Treatment completed for ${medicineName}. Disabling rule: ${ruleName}`);
      
      // Disable the EventBridge rule
      try {
        await eventBridgeClient.send(
          new DisableRuleCommand({
            Name: ruleName
          })
        );
        console.log(`Successfully disabled rule: ${ruleName}`);
      } catch (error) {
        console.error(`Failed to disable rule ${ruleName}:`, error);
      }

      return {
        statusCode: 200,
        message: 'Treatment completed, rule disabled'
      };
    }

    // Get today's date in YYYY-MM-DD format
    const scheduledDate = now.toISOString().split('T')[0];

    // Create dose record in DynamoDB
    try {
      await createDose({
        patientId,
        medicineId,
        medicineName,
        dosage,
        scheduledTime: time,
        scheduledDate,
        status: 'due',
        takenAt: undefined
      });

      console.log(`Dose marked as due: ${medicineName} ${dosage} at ${time} for patient ${patientId}`);
    } catch (error: any) {
      // If dose already exists, that's okay - just log it
      if (error.name === 'ConditionalCheckFailedException') {
        console.log(`Dose already exists for ${medicineName} at ${time} on ${scheduledDate}`);
      } else {
        throw error;
      }
    }

    // TODO: Send push notification or SMS (future enhancement)
    // await sendNotification(patientId, `Time to take ${medicineName} ${dosage}`);

    return {
      statusCode: 200,
      message: 'Reminder processed successfully',
      dose: {
        medicineName,
        dosage,
        time,
        date: scheduledDate
      }
    };
  } catch (error: any) {
    console.error('Error processing reminder:', error);
    throw error;
  }
}
