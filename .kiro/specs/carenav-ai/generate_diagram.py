"""
Generate CareNav AI AWS Architecture Diagram
This script creates a visual diagram using the diagrams library
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.network import APIGateway
from diagrams.aws.database import Dynamodb
from diagrams.aws.storage import S3
from diagrams.aws.integration import Eventbridge
from diagrams.aws.ml import Bedrock, Transcribe, Textract
from diagrams.aws.security import IAM, SecretsManager
from diagrams.aws.management import Cloudwatch
from diagrams.aws.mobile import Amplify
from diagrams.onprem.client import User

# Create diagram
with Diagram("CareNav AI - AWS Architecture", 
             filename="carenav-architecture",
             show=False,
             direction="TB",
             outformat="png"):
    
    # Users
    users = User("Patients & Doctors")
    
    # Frontend Layer
    with Cluster("Frontend Layer"):
        frontend = Amplify("React Web App\nAWS Amplify")
    
    # API Layer
    with Cluster("API Gateway"):
        api = APIGateway("REST API\nAuth & Rate Limiting")
    
    # Compute Layer
    with Cluster("Serverless Compute (AWS Lambda)"):
        symptom = Lambda("Symptom\nProcessor")
        navigation = Lambda("Care\nNavigation")
        treatment = Lambda("Treatment\nPlanner")
        report = Lambda("Report\nProcessor")
        auth = Lambda("Auth\nHandler")
        reminder = Lambda("Reminder\nProcessor")
    
    # AI/ML Services
    with Cluster("AI/ML Services"):
        bedrock = Bedrock("Bedrock\nClaude 3")
        transcribe = Transcribe("Transcribe\nVoice-to-Text")
        textract = Textract("Textract\nOCR")
    
    # Data Layer
    with Cluster("Data & Storage"):
        db = Dynamodb("DynamoDB\nPatients, Symptoms\nTreatments")
        storage = S3("S3 Bucket\nMedical Reports")
        events = Eventbridge("EventBridge\nReminders")
    
    # Security Layer
    with Cluster("Security & Monitoring"):
        iam = IAM("IAM\nRoles")
        secrets = SecretsManager("Secrets\nManager")
        logs = Cloudwatch("CloudWatch\nLogs")
    
    # User flows
    users >> frontend >> api
    
    # API to Lambda
    api >> symptom
    api >> navigation
    api >> treatment
    api >> report
    api >> auth
    
    # Lambda to AI Services
    symptom >> bedrock
    symptom >> transcribe
    navigation >> bedrock
    treatment >> bedrock
    report >> textract
    report >> bedrock
    
    # Lambda to Data
    symptom >> db
    navigation >> db
    treatment >> db
    treatment >> events
    report >> storage
    report >> db
    auth >> db
    
    # EventBridge to Reminder
    events >> reminder >> db
    
    # Security (dashed lines)
    iam >> Edge(style="dashed") >> symptom
    iam >> Edge(style="dashed") >> navigation
    iam >> Edge(style="dashed") >> treatment
    secrets >> Edge(style="dashed") >> auth
    logs >> Edge(style="dashed") >> api

print("Diagram generated successfully: carenav-architecture.png")
