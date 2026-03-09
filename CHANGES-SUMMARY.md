# Changes Summary: 10 Questions + Department Predictor

## Changes Made

### 1. Reduced Questions from 20 to 10 (2 rounds instead of 4)

**Files Modified:**
- `lambda/symptom-processor/index.ts`
  - Changed condition from `totalAnswers < 20` to `totalAnswers < 10`
  - Changed message from "Round X of 4" to "Round X of 2"
  - Changed completion check from `>= 20` to `>= 10`

- `lambda/shared/symptom-question-generator.ts`
  - Added check to only generate Round 2 (max 2 rounds)
  - Removed Round 3 and Round 4 fallback logic
  - Simplified fallback to only use Round 2 questions

### 2. Added Department Predictor Feature

**New File Created:**
- `lambda/shared/department-predictor.ts`
  - AI-powered department prediction using Bedrock
  - Emergency detection based on keywords
  - Rule-based fallback for reliability
  - Supports 16 Indian hospital departments:
    - Emergency Medicine
    - General Medicine
    - Cardiology
    - Neurology
    - Orthopedics
    - Gastroenterology
    - Pulmonology
    - ENT (Ear, Nose, Throat)
    - Ophthalmology
    - Dermatology
    - Urology
    - Nephrology
    - Endocrinology
    - Psychiatry
    - Pediatrics
    - Obstetrics & Gynecology

**Integration in symptom-processor:**
- After 10 questions are answered, system now:
  1. Predicts appropriate department
  2. Detects if it's an emergency
  3. Returns department recommendation with message
  4. Shows emergency warning if needed

**API Response Format (after 10 questions):**
```json
{
  "symptomId": "...",
  "round": "complete",
  "departmentRecommendation": "Cardiology",
  "isEmergency": false,
  "message": "Analysis complete. Recommended department: Cardiology",
  "finalDiseases": [...],
  "confidenceScore": 0.95
}
```

**Emergency Response Example:**
```json
{
  "departmentRecommendation": "Emergency Medicine",
  "isEmergency": true,
  "message": "⚠️ EMERGENCY: Please visit Emergency Medicine immediately!"
}
```

### 3. Updated Build Version
- `lib/backend-stack.ts`: BUILD_VERSION updated to '2026-03-09-10-00' (v34)

## How It Works

### Question Flow (10 Questions Total)
1. **Round 1**: Patient submits symptoms → Gets 5 AI-generated questions
2. **Round 2**: Patient answers Round 1 → Gets 5 more AI-generated questions
3. **Complete**: Patient answers Round 2 → Gets department recommendation + emergency status

### Department Prediction Logic
1. **Emergency Check**: Scans for emergency keywords (chest pain, stroke, seizure, etc.)
   - If found → Immediately recommends "Emergency Medicine"
2. **AI Prediction**: Uses Bedrock AI to analyze:
   - Symptom text
   - Body part affected
   - Severity level
   - Patient answers
   - Possible diseases
3. **Rule-Based Fallback**: If AI fails, uses body part and disease mapping

### Emergency Keywords Detected
- chest pain, heart attack, stroke, seizure, unconscious
- severe bleeding, difficulty breathing, choking, severe burn
- head injury, severe trauma, poisoning, overdose
- severe abdominal pain, severe allergic reaction, anaphylaxis
- suicidal, severe mental crisis, broken bone, fracture

## Testing

To test after deployment:
```bash
node test-10-questions.js
```

This will:
1. Submit initial symptom
2. Answer Round 1 (5 questions)
3. Answer Round 2 (5 questions)
4. Receive department recommendation

## Benefits

1. **Faster Patient Experience**: 10 questions instead of 20 (50% reduction)
2. **Clear Next Steps**: Patients know which department to visit
3. **Emergency Detection**: Critical cases are flagged immediately
4. **Doctor Efficiency**: Patients arrive at the correct department
5. **Better Triage**: AI-powered department routing reduces wait times

## Deployment

Run:
```bash
cdk deploy --all --require-approval never
```

Build version v34 includes all changes.
