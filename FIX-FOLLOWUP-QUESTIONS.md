# Fix Follow-Up Questions and Care Navigation Issues

## Issues Identified

### Issue 1: Missing patientId in Care Navigation API Call
**Error**: `"patientId and symptomId are required"`

**Root Cause**: The `CareNavigation.tsx` component was only sending `symptomId` to the `/navigation/recommend` endpoint, but the Lambda requires both `patientId` and `symptomId`.

**Fix Applied**: ✅ Added code to retrieve `patientId` from localStorage and include it in the API request.

### Issue 2: Generic Follow-Up Questions Instead of AI-Powered Targeted Questions
**Problem**: The system is asking generic questions like "Have you experienced this before?" instead of AI-powered targeted questions based on disease analysis.

**Root Cause**: The symptom processor is using the old generic `FOLLOWUP_GENERATION_SYSTEM_PROMPT` instead of the new AI-powered iterative diagnosis flow that:
1. Analyzes symptoms to identify 5-10 disease candidates
2. Generates targeted questions to differentiate between diseases
3. Never mentions disease names to patients

**Solution**: We have two options:

### Option A: Use Iterative Diagnosis Flow (Recommended)
Replace the generic follow-up questions with the AI-powered iterative diagnosis flow:
- Use `DISEASE_ANALYSIS_SYSTEM_PROMPT` to analyze symptoms
- Use `QUESTION_GENERATION_SYSTEM_PROMPT` to generate targeted questions
- Store disease analysis hidden from patient
- Questions help differentiate between disease candidates

### Option B: Keep Generic Questions
Keep the current generic questions but improve the prompt to be more specific based on symptoms.

## Recommendation

**Use Option A** - The iterative diagnosis flow provides:
- More intelligent, targeted questions
- Better disease differentiation
- Hidden disease analysis for doctor review
- Aligns with the ai-iterative-diagnosis-qr spec

## Implementation Plan

1. Update `lambda/symptom-processor/index.ts` to use disease analysis
2. Generate targeted questions based on disease candidates
3. Store disease analysis in DynamoDB (hidden from patient)
4. Update frontend to handle new question format
5. Test the complete flow

## Files to Modify

- `lambda/symptom-processor/index.ts` - Use disease analysis prompts
- `lambda/shared/symptom-db.ts` - Store disease analysis
- `frontend/src/components/FollowUpQuestions.tsx` - Handle new question types (yes_no, multiple_choice, scale)
- `frontend/src/components/CareNavigation.tsx` - ✅ Already fixed (added patientId)

## Status

- [x] Fix 1: Added patientId to CareNavigation API call
- [ ] Fix 2: Implement AI-powered targeted questions (pending user confirmation)
