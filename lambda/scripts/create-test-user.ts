/**
 * Script to create a test user in DynamoDB
 * Run this after deploying the infrastructure to create demo users
 * 
 * Usage: AWS_REGION=ap-south-1 ts-node lambda/scripts/create-test-user.ts
 */

import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '../shared/auth-db';
import { User } from '../shared/types';

// Set AWS region from environment or default
process.env.AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

async function createTestUsers() {
  console.log('Creating test users...');

  // Create a test patient
  const patientId = uuidv4();
  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  
  const testPatient: User = {
    userId: patientId,
    email: 'patient@demo.com',
    passwordHash: patientPasswordHash,
    role: 'patient',
    createdAt: new Date().toISOString()
  };

  await createUser(testPatient);
  console.log('✓ Created test patient:', testPatient.email);

  // Create a test doctor
  const doctorId = uuidv4();
  const doctorPasswordHash = await bcrypt.hash('doctor123', 10);
  
  const testDoctor: User = {
    userId: doctorId,
    email: 'doctor@demo.com',
    passwordHash: doctorPasswordHash,
    role: 'doctor',
    createdAt: new Date().toISOString()
  };

  await createUser(testDoctor);
  console.log('✓ Created test doctor:', testDoctor.email);

  console.log('\nTest users created successfully!');
  console.log('\nLogin credentials:');
  console.log('Patient: patient@demo.com / patient123');
  console.log('Doctor: doctor@demo.com / doctor123');
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating test users:', error);
    process.exit(1);
  });
