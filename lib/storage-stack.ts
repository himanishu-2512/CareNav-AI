import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly reportsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for medical reports with encryption at rest
    this.reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      bucketName: `carenav-medical-reports-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // SSE-S3 encryption
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false, // Disabled for hackathon simplicity
      lifecycleRules: [
        {
          id: 'DeleteDemoDataAfter30Days',
          enabled: true,
          expiration: cdk.Duration.days(30) // Auto-delete demo data
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // Clean up on stack deletion
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST
          ],
          allowedOrigins: ['*'], // Configure with actual frontend domain in production
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ]
    });

    // Output the bucket name
    new cdk.CfnOutput(this, 'ReportsBucketName', {
      value: this.reportsBucket.bucketName,
      description: 'S3 bucket for medical reports',
      exportName: 'CareNavReportsBucketName'
    });

    new cdk.CfnOutput(this, 'ReportsBucketArn', {
      value: this.reportsBucket.bucketArn,
      description: 'S3 bucket ARN',
      exportName: 'CareNavReportsBucketArn'
    });
  }
}
