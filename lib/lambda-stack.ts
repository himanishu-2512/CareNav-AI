import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  table: dynamodb.Table;
  reportsBucket: s3.Bucket;
  doctorLambda?: lambda.Function;
  qrAuthLambda?: lambda.Function;
  treatmentHandlerLambda?: lambda.Function;
  prescriptionLambda?: lambda.Function;
  lifestyleRecommenderLambda?: lambda.Function;
}

export class LambdaStack extends cdk.Stack {
  public readonly authLambda: lambda.Function;
  public readonly authorizerLambda: lambda.Function;
  public readonly patientLambda: lambda.Function;
  public readonly symptomLambda: lambda.Function;
  public readonly careNavigationLambda: lambda.Function;
  public readonly reportProcessorLambda: lambda.Function;
  public readonly reminderProcessorLambda: lambda.Function;
  public readonly treatmentPlannerLambda: lambda.Function;
  public readonly doctorLambda: lambda.Function;
  public readonly qrAuthLambda: lambda.Function;
  public readonly treatmentHandlerLambda: lambda.Function;
  public readonly prescriptionLambda: lambda.Function;
  public readonly lifestyleRecommenderLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create Secrets Manager secret
    const appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: 'carenav-app-secrets',
      description: 'CareNav AI application secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0'
        }),
        generateStringKey: 'JWT_SECRET',
        excludePunctuation: true,
        passwordLength: 32
      }
    });

    // Common Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    props.table.grantReadWriteData(lambdaRole);
    props.reportsBucket.grantReadWrite(lambdaRole);

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [`arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-*`]
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['textract:DetectDocumentText', 'textract:AnalyzeDocument'],
      resources: ['*']
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['transcribe:StartTranscriptionJob', 'transcribe:GetTranscriptionJob'],
      resources: ['*']
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['events:PutRule', 'events:PutTargets', 'events:DisableRule', 'events:DeleteRule', 'events:RemoveTargets'],
      resources: [`arn:aws:events:${this.region}:${this.account}:rule/carenav-reminder-*`]
    }));

    appSecrets.grantRead(lambdaRole);

    const commonEnv = {
      DYNAMODB_TABLE: props.table.tableName,
      REPORTS_BUCKET: props.reportsBucket.bucketName,
      SECRETS_ARN: appSecrets.secretArn
    };

    // Create all Lambda functions
    this.authLambda = new lambda.Function(this, 'AuthFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/auth-handler'),
      role: lambdaRole,
      environment: {
        ...commonEnv,
        JWT_SECRET: appSecrets.secretValueFromJson('JWT_SECRET').unsafeUnwrap()
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.authorizerLambda = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/authorizer'),
      role: lambdaRole,
      environment: {
        ...commonEnv,
        JWT_SECRET: appSecrets.secretValueFromJson('JWT_SECRET').unsafeUnwrap()
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });

    this.patientLambda = new lambda.Function(this, 'PatientFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/patient-handler'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.symptomLambda = new lambda.Function(this, 'SymptomFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/symptom-processor'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.careNavigationLambda = new lambda.Function(this, 'CareNavigationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/care-navigation'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.reportProcessorLambda = new lambda.Function(this, 'ReportProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/report-processor'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024
    });

    this.reminderProcessorLambda = new lambda.Function(this, 'ReminderProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/reminder-processor'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.treatmentPlannerLambda = new lambda.Function(this, 'TreatmentPlannerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/treatment-planner'),
      role: lambdaRole,
      environment: {
        ...commonEnv,
        REMINDER_LAMBDA_NAME: this.reminderProcessorLambda.functionName
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // Grant Lambda invoke permission using wildcard to avoid circular dependency
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [`arn:aws:lambda:${this.region}:${this.account}:function:*`]
    }));

    // Grant EventBridge permission to invoke the reminder Lambda
    // Note: Using wildcard source ARN to avoid circular dependency
    this.reminderProcessorLambda.addPermission('EventBridgeInvoke', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction'
    });

    // Doctor Dashboard Lambda Functions
    this.doctorLambda = new lambda.Function(this, 'DoctorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/doctor-handler'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.qrAuthLambda = new lambda.Function(this, 'QRAuthFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/qr-auth'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });

    this.treatmentHandlerLambda = new lambda.Function(this, 'TreatmentHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/treatment-handler'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.prescriptionLambda = new lambda.Function(this, 'PrescriptionFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/prescription-handler'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    this.lifestyleRecommenderLambda = new lambda.Function(this, 'LifestyleRecommenderFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/lifestyle-recommender'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });
  }
}
