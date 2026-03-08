// Script to check recent Lambda logs
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const client = new CloudWatchLogsClient({ region: 'ap-south-1' });

async function checkLogs() {
  const logGroupName = '/aws/lambda/CareNavBackendStack-AuthFunction';
  
  try {
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime: Date.now() - 5 * 60 * 1000, // Last 5 minutes
      limit: 50
    });
    
    const response = await client.send(command);
    
    console.log('Recent Lambda logs:');
    console.log('==================');
    
    if (response.events && response.events.length > 0) {
      response.events.forEach(event => {
        console.log(event.message);
      });
    } else {
      console.log('No recent logs found');
    }
  } catch (error: any) {
    console.error('Error fetching logs:', error.message);
  }
}

checkLogs();
