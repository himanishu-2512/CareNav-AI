import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
  reportsBucket: s3.Bucket;
  authLambda: lambda.Function;
  authorizerLambda: lambda.Function;
  patientLambda: lambda.Function;
  symptomLambda: lambda.Function;
  careNavigationLambda: lambda.Function;
  reportProcessorLambda: lambda.Function;
  reminderProcessorLambda: lambda.Function;
  treatmentPlannerLambda: lambda.Function;
  doctorLambda: lambda.Function;
  qrAuthLambda: lambda.Function;
  treatmentHandlerLambda: lambda.Function;
  prescriptionLambda: lambda.Function;
  lifestyleRecommenderLambda: lambda.Function;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create API Gateway REST API with CORS support
    this.api = new apigateway.RestApi(this, 'CareNavApi', {
      restApiName: 'CareNav AI API',
      description: 'API for CareNav AI healthcare workflow system',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
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

    // Symptom endpoints
    const symptomsResource = apiResource.addResource('symptoms');
    const symptomInputResource = symptomsResource.addResource('input');
    const symptomHistoryResource = symptomsResource.addResource('history');
    const symptomHistoryPatientResource = symptomHistoryResource.addResource('{patientId}', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
      }
    });
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
    
    // Treatment plan endpoints (new workflow)
    const planResource = treatmentResource.addResource('plan');
    const planCreateResource = planResource.addResource('create');
    const planIdResource = planResource.addResource('{planId}');
    const planMedicineResource = planIdResource.addResource('medicine');
    const planMedicineIdResource = planMedicineResource.addResource('{medicineId}');
    const plansResource = treatmentResource.addResource('plans');
    const plansPatientResource = plansResource.addResource('{patientId}');

    // Adherence endpoints
    const adherenceResource = apiResource.addResource('adherence');
    const adherencePatientResource = adherenceResource.addResource('{patientId}');

    // Doctor endpoints
    const doctorResource = apiResource.addResource('doctor');
    const doctorPatientsResource = doctorResource.addResource('patients');
    const doctorSearchResource = doctorPatientsResource.addResource('search');
    const doctorAddResource = doctorPatientsResource.addResource('add');

    // QR endpoints
    const qrResource = apiResource.addResource('qr');
    const qrGenerateResource = qrResource.addResource('generate', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
      }
    });
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
      handler: props.authorizerLambda,
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'JwtAuthorizer',
      resultsCacheTtl: cdk.Duration.minutes(5)
    });

    // Lambda integrations
    const authIntegration = new apigateway.LambdaIntegration(props.authLambda);
    const patientIntegration = new apigateway.LambdaIntegration(props.patientLambda);
    const symptomIntegration = new apigateway.LambdaIntegration(props.symptomLambda);
    const careNavigationIntegration = new apigateway.LambdaIntegration(props.careNavigationLambda);
    const reportProcessorIntegration = new apigateway.LambdaIntegration(props.reportProcessorLambda);
    const treatmentPlannerIntegration = new apigateway.LambdaIntegration(props.treatmentPlannerLambda);
    const doctorIntegration = new apigateway.LambdaIntegration(props.doctorLambda);
    const qrAuthIntegration = new apigateway.LambdaIntegration(props.qrAuthLambda);
    const treatmentHandlerIntegration = new apigateway.LambdaIntegration(props.treatmentHandlerLambda);
    const prescriptionIntegration = new apigateway.LambdaIntegration(props.prescriptionLambda);
    const lifestyleRecommenderIntegration = new apigateway.LambdaIntegration(props.lifestyleRecommenderLambda);

    // Add methods to auth resources (no authorizer needed for login/logout/register)
    loginResource.addMethod('POST', authIntegration);
    loginResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
          'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true
        }
      }]
    });
    
    registerAuthResource.addMethod('POST', authIntegration);
    registerAuthResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
          'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true
        }
      }]
    });
    
    logoutResource.addMethod('POST', authIntegration);
    logoutResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
          'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true
        }
      }]
    });
    
    // Protected endpoints (require authorization)
    registerResource.addMethod('POST', patientIntegration, { authorizer });
    summaryPatientResource.addMethod('GET', patientIntegration, { authorizer });
    symptomInputResource.addMethod('POST', symptomIntegration, { authorizer });
    symptomHistoryPatientResource.addMethod('GET', symptomIntegration, { authorizer });
    followupAnswerResource.addMethod('POST', symptomIntegration, { authorizer });
    followupResource.addMethod('POST', symptomIntegration, { authorizer });
    recommendResource.addMethod('POST', careNavigationIntegration, { authorizer });
    uploadResource.addMethod('POST', reportProcessorIntegration, { authorizer });
    timelinePatientResource.addMethod('GET', reportProcessorIntegration, { authorizer });
    createTreatmentResource.addMethod('POST', treatmentPlannerIntegration, { authorizer });
    schedulePatientResource.addMethod('GET', treatmentPlannerIntegration, { authorizer });
    markTakenResource.addMethod('POST', treatmentPlannerIntegration, { authorizer });
    adherencePatientResource.addMethod('GET', treatmentPlannerIntegration, { authorizer });
    
    // Treatment plan endpoints (new workflow)
    planCreateResource.addMethod('POST', treatmentPlannerIntegration, { authorizer });
    planIdResource.addMethod('PUT', treatmentPlannerIntegration, { authorizer });
    planMedicineResource.addMethod('POST', treatmentPlannerIntegration, { authorizer });
    planMedicineIdResource.addMethod('DELETE', treatmentPlannerIntegration, { authorizer });
    planMedicineIdResource.addMethod('PUT', treatmentPlannerIntegration, { authorizer });
    plansPatientResource.addMethod('GET', treatmentPlannerIntegration, { authorizer });

    // Doctor endpoints
    doctorPatientsResource.addMethod('GET', doctorIntegration, { authorizer });
    doctorSearchResource.addMethod('GET', doctorIntegration, { authorizer });
    doctorAddResource.addMethod('POST', doctorIntegration, { authorizer });

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
