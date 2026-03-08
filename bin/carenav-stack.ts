#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';
import { StorageStack } from '../lib/storage-stack';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// Environment configuration for Mumbai region
const env = {
  account: '730335490819',
  region: 'ap-south-1'
};

// Data layer - DynamoDB tables
const dataStack = new DataStack(app, 'CareNavDataStack', {
  env,
  description: 'CareNav AI - Data layer with DynamoDB tables'
});

// Storage layer - S3 buckets
const storageStack = new StorageStack(app, 'CareNavStorageStack', {
  env,
  description: 'CareNav AI - Storage layer with S3 buckets'
});

// Backend layer - Lambda functions and API Gateway (combined to avoid circular dependencies)
const backendStack = new BackendStack(app, 'CareNavBackendStack', {
  env,
  description: 'CareNav AI - Backend with Lambda functions and API Gateway',
  table: dataStack.table,
  reportsBucket: storageStack.reportsBucket
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'CareNav-AI');
cdk.Tags.of(app).add('Environment', 'Demo');
cdk.Tags.of(app).add('ManagedBy', 'CDK');

