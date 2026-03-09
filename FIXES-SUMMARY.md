# AI Question Generation Fixes - March 9, 2026

## Issues Fixed

### 1. Frontend Not Sending Question Text
**Problem**: Frontend was only sending `questionId` and `answer`, not the `questionText`. This caused problems with summary generation because the backend couldn't see what questions were asked.

**Fix**: Modified `frontend/src/components/FollowUpQuestions.tsx` line 113:
```typescript
// BEFORE:
const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
  questionId,
  answer,
}));

// AFTER:
const answerArray = Object.entries(answers).map(([questionId, answer]) => {
  const question = questions.find(q => q.questionId === questionId);
  return {
    questionId,
    questionText: question?.questionText || '',
    answer,
  };
});
```

### 2. Backend Silently Catching AI Errors
**Problem**: When AI question generation failed for Rounds 2-4, the backend was catching the error and returning "Analysis complete" without logging details. This made debugging impossible.

**Fix**: Modified `lambda/symptom-processor/index.ts` lines 145-165:
```typescript
// BEFORE:
catch (analysisError: any) {
  console.error('Error generating additional questions:', analysisError);
  // Return success but without additional questions
  return successResponse({
    symptomId: updatedSymptom.symptomId,
    updatedSymptoms: updatedSymptom.structuredSymptoms,
    followUpAnswers: updatedSymptom.followUpAnswers,
    round: 'complete',
    message: 'Analysis complete. You can now proceed to care navigation.'
  });
}

// AFTER:
catch (analysisError: any) {
  console.error('CRITICAL ERROR generating additional questions:', analysisError);
  console.error('Error stack:', analysisError.stack);
  console.error('Error details:', JSON.stringify(analysisError, null, 2));
  
  // Return error response instead of silently failing
  return errorResponse(
    `Failed to generate additional questions: ${analysisError.message}. Please try again or contact support.`,
    500
  );
}
```

### 3. Lambda Not Rebuilding
**Problem**: Lambda code wasn't being updated even after changing BUILD_VERSION.

**Fix**:
- Deleted `lambda/node_modules` to force clean rebuild
- Deleted `cdk.out` directory
- Updated BUILD_VERSION to `2026-03-09-07-00`
- Ran `npm install` in lambda directory
- Deployed with `cdk deploy --all --require-approval never`

## Test Results

✅ **Backend Test Successful**:
- Round 1: 5 AI-generated questions
- Round 2: 5 AI-generated questions (different from Round 1)
- Round 3: 5 AI-generated questions (different from Rounds 1 & 2)
- Question text is now stored in database with answers
- Total answers stored: 10 (after 2 rounds)

## AI Summary Behavior (By Design)

The AI summary is only generated AFTER all 20 questions are answered. This is correct behavior because:
1. You need full context to generate a proper clinical summary
2. Partial summaries would be incomplete and potentially misleading
3. The summary generation happens in `symptom-processor/index.ts` lines 186-211

**When summaries are generated**:
- `aiSummary`: Comprehensive clinical summary with sections (Chief Complaint, Key Symptoms, Medical History, Clinical Impression, Important Findings)
- `briefSummary`: One-line summary for list views

**Where summaries are displayed**:
- Doctor Dashboard: Shows `aiSummary` if it exists (line 461-473 in `DoctorDashboard.tsx`)
- Patient view: Shows raw symptom text until all questions answered

## Next Steps

To see the AI summary in the doctor's view:
1. Complete all 20 questions (4 rounds × 5 questions)
2. The summary will be automatically generated and stored
3. Doctor dashboard will display the comprehensive summary

## Files Modified

1. `frontend/src/components/FollowUpQuestions.tsx` - Added questionText to answer submission
2. `lambda/symptom-processor/index.ts` - Improved error logging
3. `lib/backend-stack.ts` - Updated BUILD_VERSION to force rebuild

## Deployment

- Deployed: March 9, 2026 at 5:09 AM
- API URL: https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod/
- Lambda Function: SymptomFunction updated successfully
- Build Version: 2026-03-09-07-00
