// Debug Round 2 AI generation locally
import { generateAIQuestions } from './lambda/shared/openai-bedrock-client';

// Set environment variables
process.env.OPENAI_API_KEY = 'bedrock-api-key-YmVkcm9jay5hbWF6b25hd3MuY29tLz9BY3Rpb249Q2FsbFdpdGhCZWFyZXJUb2tlbiZYLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFTSUEyVUMzREdNQjM3UkpNV1hRJTJGMjAyNjAzMDglMkZhcC1zb3V0aC0xJTJGYmVkcm9jayUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMzA4VDIyMjAyNFomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1JUW9KYjNKcFoybHVYMlZqRUZZYUNtRndMWE52ZFhSb0xURWlSekJGQWlCWGZRUXBPUGFxTzB4JTJGZFRmUE5BZWVRSnl2MnBIVFQ2YlhxUExjY25CR1VRSWhBSlBHc3RTUUUlMkJwc0kwc1dDS09sa1NRdjVUd09yWjc1b2cwWm1oU25NdmlKS3FVRENCOFFBQm9NTnpNd016TTFORGt3T0RFNUlnekJabWxtYzl4JTJCaDAxdnlpb3FnZ09VeHA4bGxCNnI0VG5VdWFyZTNkJTJCJTJCeXlOeHFMVzBxODlabWxHYSUyRlRLNGZGTHpaUWoxOCUyQlVOd3VBUll2dnM1UGglMkZ1ZWc1cmNDbGJsJTJGdFNMaGZXa2g4dUFSRU1lVXp0bXNLV2ExZSUyQiUyRll2bzFOZk9DQWFCR1FnRnZiOWU3TUJjeFBzd2F0dVZEbHFiUXJoUWJkNHBENGNKZWlYdkJSZ3BMYkdkZUJzRGppdUMlMkJhMzJJVWtBV3pEZFhNYTV5bk9hZ3NoQ0c2NWRud05KNEdQeDNmWUNxYm1ld0FKVTNSVWRSZnhEaDhEbDhxdjlXdnJ4QyUyQlFoU1BIUmZkNlJOU1FoNUNSdG1rM0NQM2RNd3M4N2UyV21icnVIc0ZzZ21MY1hORE8yQ3BicUFWbmhTdjNzeW1YJTJGRTNtdmVwV1VTQ2swdHZ5ZXBjZWR6QyUyRkJkbjhITG9vaFJjOXF5UUR1Y1dPVzclMkZYbFh1UXlISzFrc3h0bFRVSmVaRHhvTnpBb1dhTGRGcGpESW1tVVE1Wkw5RFROOTNmQ2tGMzZrVlNPNWI2cHRZbEw4ZWRhdVVyc3FjaUQ1eVJrNVlxZzh4aWY0NkJoa1QzWHRWSzg1Y2MlMkI1NUo5RWRTZ0w0SFJLZjlrdFR1bFZMcU1aQmlkQ3U1Vk5waiUyRjZ4NEw5QlFnZlZpckY3U2ttSE90VENBJTJGclhOQmpyZUFxb2g0ZGNwRGVmdTVNYmhrSW4xNGZEOHN6NUw0b1JYT3Q1d05MYUUyOEtlclRQSUUxN3UlMkJDcEdsNGttWGp1clJYclUlMkZra1Zkd256d3AwYkhJYmVqNG1WdHJPTFI1WXlQR0NUWDhZb0xxMXlnWkQ3TUVjR2M3enhWcGcwaXpnZ2ZNcXRDYXJZZGJ4QlAlMkZXRiUyRlB4dHg3dWVrRk1QVGpKNERYcGR1WXZEdEtOa0VpdnBRTlVkOHpJRmhvYk9zVzRGUGhkTnRiRWx6aTdQZXdxUjBTVEtybTdlZ0tzYmZmODZJTUgzSE1ycGExYlgwaTBMM3JkdDlubTZyUVM2eExrdkduZzRaWVQySXdEMGJUdTBjTkkwMWR3RkFGaCUyRjBUVWVobE1qeUk1ckhxQmNSc2hVQXhpMEk5UGVXM1A4ZEYxUWdtR21XZFQ3ZUtVQjJrbDVlJTJCRkl0QVVsTnZma0hvUVcxdHAxJTJCdTdoNFhJakZSRGtSMnVvJTJGVWx1bkh5N2gxZTF2OTZSbGxIWmIlMkZ0Tm9GaUxNT2pxVDhmcXZyQTFrWkE3aVNXOTdSU1pIOFlnRWVRclRac1FVWDE4VHlmWUt6UHc5Z0JQJTJGdnRzaGpVJTJCVVJ0MSUyRklnYyZYLUFtei1TaWduYXR1cmU9ZGNkMDlmYzhlOGEwOTViODI4NTc1NmNkNThiYTA4ZmFhNDA0MzUzZjE3NWUyNGI4YjkzOWI2NDdlN2Y4NjhhYyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmVmVyc2lvbj0x';
process.env.OPENAI_BASE_URL = 'https://bedrock-mantle.ap-south-1.api.aws/v1';

async function testRound2() {
  console.log('=== Testing Round 2 AI Generation Locally ===\n');
  
  const symptomText = 'I have severe headache and fever for 3 days';
  const bodyPart = 'head';
  const diseaseNames = ['Migraine', 'Tension Headache', 'Viral Infection'];
  
  // Simulate Round 1 answers
  const round1Answers = [
    { questionText: 'Where exactly is the pain located?', answerText: 'Front of head' },
    { questionText: 'When did the symptom start?', answerText: '3 days ago' },
    { questionText: 'How severe is the pain on a scale of 1 to 10?', answerText: '8 out of 10' },
    { questionText: 'Does the pain worsen after eating?', answerText: 'No' },
    { questionText: 'Do you have nausea or vomiting?', answerText: 'Yes, mild nausea' }
  ];
  
  console.log('Symptom:', symptomText);
  console.log('Body part:', bodyPart);
  console.log('Diseases:', diseaseNames.join(', '));
  console.log('Previous answers:', round1Answers.length);
  console.log('\nCalling generateAIQuestions for Round 2...\n');
  
  try {
    const questions = await generateAIQuestions(
      symptomText,
      round1Answers,
      diseaseNames,
      bodyPart,
      2, // Round 2
      undefined // No medical entities for Round 2
    );
    
    console.log('\n✓ SUCCESS - Generated questions:');
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q}`);
    });
    
    console.log(`\nTotal: ${questions.length} questions`);
    
  } catch (error: any) {
    console.error('\n❌ FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRound2().catch(console.error);
