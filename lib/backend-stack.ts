import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface BackendStackProps extends cdk.StackProps {
  table: dynamodb.Table;
  reportsBucket: s3.Bucket;
}

export class BackendStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // Import existing Secrets Manager secret (created by previous Lambda stack)
    const appSecrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      'AppSecrets',
      'carenav-app-secrets'
    );

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

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [`arn:aws:lambda:${this.region}:${this.account}:function:*`]
    }));

    appSecrets.grantRead(lambdaRole);

    const commonEnv = {
      DYNAMODB_TABLE: props.table.tableName,
      REPORTS_BUCKET: props.reportsBucket.bucketName,
      SECRETS_ARN: appSecrets.secretArn,
      GEMINI_API_KEY: 'AIzaSyCnWx4lW4wUsMcck5NyDHIL4gWutQ9uGJw'
    };

    // Create all Lambda functions using NodejsFunction for automatic bundling
    const authLambda = new nodejs.NodejsFunction(this, 'AuthFunction', {
      entry: 'lambda/auth-handler/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: {
        ...commonEnv,
        JWT_SECRET: appSecrets.secretValueFromJson('JWT_SECRET').unsafeUnwrap()
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const authorizerLambda = new nodejs.NodejsFunction(this, 'AuthorizerFunction', {
      entry: 'lambda/authorizer/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: {
        ...commonEnv,
        JWT_SECRET: appSecrets.secretValueFromJson('JWT_SECRET').unsafeUnwrap()
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const patientLambda = new nodejs.NodejsFunction(this, 'PatientFunction', {
      entry: 'lambda/patient-handler/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const symptomLambda = new nodejs.NodejsFunction(this, 'SymptomFunction', {
      entry: 'lambda/symptom-processor/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const careNavigationLambda = new nodejs.NodejsFunction(this, 'CareNavigationFunction', {
      entry: 'lambda/care-navigation/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const reportProcessorLambda = new nodejs.NodejsFunction(this, 'ReportProcessorFunction', {
      entry: 'lambda/report-processor/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const reminderProcessorLambda = new nodejs.NodejsFunction(this, 'ReminderProcessorFunction', {
      entry: 'lambda/reminder-processor/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const treatmentPlannerLambda = new nodejs.NodejsFunction(this, 'TreatmentPlannerFunction', {
      entry: 'lambda/treatment-planner/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: {
        ...commonEnv,
        REMINDER_LAMBDA_NAME: reminderProcessorLambda.functionName
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    // Grant EventBridge permission to invoke the reminder Lambda
    reminderProcessorLambda.addPermission('EventBridgeInvoke', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction'
    });

    // Doctor Dashboard Lambda Functions
    const doctorLambda = new nodejs.NodejsFunction(this, 'DoctorFunction', {
      entry: 'lambda/doctor-handler/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const qrAuthLambda = new nodejs.NodejsFunction(this, 'QRAuthFunction', {
      entry: 'lambda/qr-auth/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const treatmentHandlerLambda = new nodejs.NodejsFunction(this, 'TreatmentHandlerFunction', {
      entry: 'lambda/treatment-handler/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const prescriptionLambda = new nodejs.NodejsFunction(this, 'PrescriptionFunction', {
      entry: 'lambda/prescription-handler/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    const lifestyleRecommenderLambda = new nodejs.NodejsFunction(this, 'LifestyleRecommenderFunction', {
      entry: 'lambda/lifestyle-recommender/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false
      }
    });

    // Create API Gateway REST API
    this.api = new apigateway.RestApi(this, 'CareNavApi', {
      restApiName: 'CareNav AI API',
      description: 'API for CareNav AI healthcare workflow system',
      deployOptions: {
        stageName: 'prod'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ]
      }
    });

    // API Gateway resources structure
    const apiResource = this.api.root.addResource('api');
    
    // Auth endpoints
    const authResource = apiResource.addResource('auth');
    const loginResource = authResource.addResource('login');
    const registerAuthResource = authResource.addResource('register');
    const logoutResource = authResource.addResource('logout');

    // Patient endpoints
    const patientsResource = apiResource.addResource('patients');
    const registerResource = patientsResource.addResource('register');
    const summaryResource = patientsResource.addResource('summary');
    const summaryPatientResource = summaryResource.addResource('{patientId}');
    const patientIdResource = patientsResource.addResource('{patientId}');

    // Symptom endpoints
    const symptomsResource = apiResource.addResource('symptoms');
    const symptomInputResource = symptomsResource.addResource('input');
    const symptomHistoryResource = symptomsResource.addResource('history');
    const symptomHistoryPatientResource = symptomHistoryResource.addResource('{patientId}');
    const symptomIdResource = symptomsResource.addResource('{symptomId}');
    const symptomAddDetailsResource = symptomIdResource.addResource('add-details');
    const followupResource = symptomsResource.addResource('followup');
    const followupAnswerResource = followupResource.addResource('answer');

    // Navigation endpoints
    const navigationResource = apiResource.addResource('navigation');
    const recommendResource = navigationResource.addResource('recommend');

    // Report endpoints
    const reportsResource = apiResource.addResource('reports');
    const uploadResource = reportsResource.addResource('upload');
    const timelineResource = reportsResource.addResource('timeline');
    const timelinePatientResource = timelineResource.addResource('{patientId}');

    // Treatment endpoints
    const treatmentResource = apiResource.addResource('treatment');
    const createTreatmentResource = treatmentResource.addResource('create');
    const scheduleResource = treatmentResource.addResource('schedule');
    const schedulePatientResource = scheduleResource.addResource('{patientId}');
    const markTakenResource = treatmentResource.addResource('mark-taken');

    // Adherence endpoints
    const adherenceResource = apiResource.addResource('adherence');
    const adherencePatientResource = adherenceResource.addResource('{patientId}');

    // Doctor endpoints
    const doctorResource = apiResource.addResource('doctor');
    const doctorPatientsResource = doctorResource.addResource('patients');
    const doctorSearchResource = doctorPatientsResource.addResource('search');
    const doctorAddResource = doctorPatientsResource.addResource('add');
    const doctorPatientIdResource = doctorPatientsResource.addResource('{patientId}');

    // QR endpoints
    const qrResource = apiResource.addResource('qr');
    const qrGenerateResource = qrResource.addResource('generate');
    const qrValidateResource = qrResource.addResource('validate');
    const qrValidateCodeResource = qrResource.addResource('validate-code');

    // Treatment episode endpoints
    const episodeResource = treatmentResource.addResource('episode');
    const episodeCreateResource = episodeResource.addResource('create');
    const episodeIdResource = episodeResource.addResource('{episodeId}');
    const episodeMessageResource = episodeIdResource.addResource('message');
    const episodeCompleteResource = episodeIdResource.addResource('complete');
    const episodePatientResource = treatmentResource.addResource('patient');
    const episodePatientIdResource = episodePatientResource.addResource('{patientId}');
    const episodePatientEpisodesResource = episodePatientIdResource.addResource('episodes');

    // Prescription endpoints
    const prescriptionResource = apiResource.addResource('prescription');
    const prescriptionCreateResource = prescriptionResource.addResource('create');
    const prescriptionIdResource = prescriptionResource.addResource('{prescriptionId}');
    const prescriptionSyncResource = prescriptionResource.addResource('sync');

    // Lifestyle endpoints
    const lifestyleResource = apiResource.addResource('lifestyle');
    const lifestyleGenerateResource = lifestyleResource.addResource('generate');

    // Create API Gateway Lambda Authorizer
    const authorizer = new apigateway.TokenAuthorizer(this, 'JwtAuthorizer', {
      handler: authorizerLambda,
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'JwtAuthorizer',
      resultsCacheTtl: cdk.Duration.minutes(5)
    });

    // Lambda integrations
    const authIntegration = new apigateway.LambdaIntegration(authLambda);
    const patientIntegration = new apigateway.LambdaIntegration(patientLambda);
    const symptomIntegration = new apigateway.LambdaIntegration(symptomLambda);
    const careNavigationIntegration = new apigateway.LambdaIntegration(careNavigationLambda);
    const reportProcessorIntegration = new apigateway.LambdaIntegration(reportProcessorLambda);
    const treatmentPlannerIntegration = new apigateway.LambdaIntegration(treatmentPlannerLambda);
    const doctorIntegration = new apigateway.LambdaIntegration(doctorLambda);
    const qrAuthIntegration = new apigateway.LambdaIntegration(qrAuthLambda);
    const treatmentHandlerIntegration = new apigateway.LambdaIntegration(treatmentHandlerLambda);
    const prescriptionIntegration = new apigateway.LambdaIntegration(prescriptionLambda);
    const lifestyleRecommenderIntegration = new apigateway.LambdaIntegration(lifestyleRecommenderLambda);

    // Add methods to auth resources (no authorizer needed for login/logout)
    loginResource.addMethod('POST', authIntegration);
    registerAuthResource.addMethod('POST', authIntegration);
    logoutResource.addMethod('POST', authIntegration);
    
    // Protected endpoints (require authorization)
    registerResource.addMethod('POST', patientIntegration, { authorizer });
    summaryPatientResource.addMethod('GET', patientIntegration, { authorizer });
    patientIdResource.addMethod('GET', patientIntegration, { authorizer });
    patientIdResource.addMethod('PUT', patientIntegration, { authorizer });
    symptomInputResource.addMethod('POST', symptomIntegration, { authorizer });
    symptomHistoryPatientResource.addMethod('GET', symptomIntegration, { authorizer });
    symptomIdResource.addMethod('GET', symptomIntegration, { authorizer });
    symptomIdResource.addMethod('DELETE', symptomIntegration, { authorizer });
    symptomAddDetailsResource.addMethod('PUT', symptomIntegration, { authorizer });
    followupAnswerResource.addMethod('POST', symptomIntegration, { authorizer });
    followupResource.addMethod('POST', symptomIntegration, { authorizer });
    recommendResource.addMethod('POST', careNavigationIntegration, { authorizer });
    uploadResource.addMethod('POST', reportProcessorIntegration, { authorizer });
    timelinePatientResource.addMethod('GET', reportProcessorIntegration, { authorizer });
    createTreatmentResource.addMethod('POST', treatmentPlannerIntegration, { authorizer });
    schedulePatientResource.addMethod('GET', treatmentPlannerIntegration, { authorizer });
    markTakenResource.addMethod('POST', treatmentPlannerIntegration, { authorizer });
    adherencePatientResource.addMethod('GET', treatmentPlannerIntegration, { authorizer });

    // Doctor endpoints
    doctorPatientsResource.addMethod('GET', doctorIntegration, { authorizer });
    doctorSearchResource.addMethod('GET', doctorIntegration, { authorizer });
    doctorAddResource.addMethod('POST', doctorIntegration, { authorizer });
    doctorPatientIdResource.addMethod('DELETE', doctorIntegration, { authorizer });

    // QR endpoints
    qrGenerateResource.addMethod('POST', qrAuthIntegration, { authorizer });
    qrValidateResource.addMethod('POST', qrAuthIntegration, { authorizer });
    qrValidateCodeResource.addMethod('POST', qrAuthIntegration, { authorizer });

    // Treatment episode endpoints
    episodeCreateResource.addMethod('POST', treatmentHandlerIntegration, { authorizer });
    episodeIdResource.addMethod('GET', treatmentHandlerIntegration, { authorizer });
    episodeMessageResource.addMethod('POST', treatmentHandlerIntegration, { authorizer });
    episodeCompleteResource.addMethod('POST', treatmentHandlerIntegration, { authorizer });
    episodePatientEpisodesResource.addMethod('GET', treatmentHandlerIntegration, { authorizer });

    // Prescription endpoints
    prescriptionCreateResource.addMethod('POST', prescriptionIntegration, { authorizer });
    prescriptionIdResource.addMethod('GET', prescriptionIntegration, { authorizer });
    prescriptionSyncResource.addMethod('POST', prescriptionIntegration, { authorizer });

    // Lifestyle endpoints
    lifestyleGenerateResource.addMethod('POST', lifestyleRecommenderIntegration, { authorizer });

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'CareNavApiUrl'
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: 'CareNavApiId'
    });
  }
}
