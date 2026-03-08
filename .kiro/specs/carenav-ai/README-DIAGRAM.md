# CareNav AI Architecture Diagram

This directory contains the AWS architecture diagram for CareNav AI in Graphviz DOT format.

## Files

- `architecture.dot` - Graphviz DOT source file
- `generate-diagram.bat` - Windows batch script to generate the diagram
- `architecture.png` - Generated diagram image (after running the script)

## Prerequisites

You need to install Graphviz to generate the diagram:

### Windows Installation

1. Download Graphviz from: https://graphviz.org/download/
2. Install the Windows package (e.g., `graphviz-10.0.1-win64.exe`)
3. Add Graphviz to your PATH:
   - Default location: `C:\Program Files\Graphviz\bin`
   - Or during installation, check "Add Graphviz to system PATH"

### Verify Installation

Open a new command prompt and run:
```cmd
dot -V
```

You should see output like: `dot - graphviz version X.X.X`

## Generate the Diagram

### Option 1: Using the Batch Script (Recommended)

Double-click `generate-diagram.bat` or run from command prompt:
```cmd
cd .kiro\specs\carenav-ai
generate-diagram.bat
```

This will:
- Check if Graphviz is installed
- Generate `architecture.png`
- Automatically open the image

### Option 2: Manual Command

```cmd
cd .kiro\specs\carenav-ai
dot -Tpng architecture.dot -o architecture.png
```

### Generate Other Formats

**SVG (Scalable Vector Graphics):**
```cmd
dot -Tsvg architecture.dot -o architecture.svg
```

**PDF:**
```cmd
dot -Tpdf architecture.dot -o architecture.pdf
```

**High-Resolution PNG:**
```cmd
dot -Tpng -Gdpi=300 architecture.dot -o architecture-hires.png
```

## Diagram Overview

The architecture diagram shows:

### Layers
1. **Users Layer** - Patients and Doctors accessing via web browsers
2. **Frontend Layer** - React app hosted on AWS Amplify
3. **API Gateway Layer** - REST API with authentication and rate limiting
4. **Compute Layer** - 6 AWS Lambda functions for different operations
5. **AI/ML Services** - Bedrock (Claude 3), Transcribe, Textract
6. **Data & Storage** - DynamoDB, S3, EventBridge
7. **Security & Monitoring** - IAM, Secrets Manager, CloudWatch, KMS

### Key Components

**Lambda Functions:**
- Symptom Processor - Handles symptom input and extraction
- Care Navigation - Generates department recommendations
- Treatment Planner - Creates medication schedules
- Report Processor - Processes uploaded medical documents
- Auth Handler - Manages authentication
- Reminder Processor - Handles scheduled medication reminders

**AI Services:**
- Amazon Bedrock (Claude 3) - NLP tasks
- Amazon Transcribe - Voice-to-text
- Amazon Textract - OCR for medical reports

**Data Storage:**
- DynamoDB - Patient data, symptoms, treatments, sessions
- S3 - Encrypted medical report files
- EventBridge - Scheduled medication reminders

## Customization

To modify the diagram, edit `architecture.dot` and regenerate:

### Change Colors
Find the `fillcolor` attributes and use hex colors:
```dot
node [label="My Node", fillcolor="#FF5722", fontcolor=white];
```

### Change Layout Direction
Change `rankdir` at the top:
- `TB` - Top to Bottom (current)
- `LR` - Left to Right
- `BT` - Bottom to Top
- `RL` - Right to Left

### Add New Components
```dot
new_service [label="New Service\nDescription", fillcolor="#4CAF50", fontcolor=white];
existing_service -> new_service [label="Connection"];
```

## Troubleshooting

### "dot is not recognized as an internal or external command"

Graphviz is not installed or not in PATH. Install Graphviz and add to PATH.

### Diagram looks cluttered

Try these adjustments in `architecture.dot`:
```dot
nodesep=1.2;  // Increase horizontal spacing
ranksep=1.5;  // Increase vertical spacing
```

### Text is too small

Increase font sizes:
```dot
node [fontsize=12];  // Default is 10
edge [fontsize=10];  // Default is 9
```

## Online Alternatives

If you can't install Graphviz locally, use online tools:

1. **Graphviz Online**: https://dreampuf.github.io/GraphvizOnline/
   - Copy contents of `architecture.dot`
   - Paste into the editor
   - View/download the rendered diagram

2. **Edotor**: https://edotor.net/
   - Similar online Graphviz editor

## Architecture Principles

The diagram illustrates:
- **Serverless-first architecture** - No server management
- **Event-driven design** - EventBridge for scheduled tasks
- **Security by default** - IAM, encryption, secrets management
- **AI-powered workflows** - Bedrock for all NLP operations
- **Scalable data layer** - DynamoDB and S3
- **Comprehensive monitoring** - CloudWatch integration

## Deployment Region

Primary: AWS Mumbai (ap-south-1) - Optimized for Indian healthcare context
