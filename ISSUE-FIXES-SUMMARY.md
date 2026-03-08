# Issue Fixes Summary

## Issue 1: Care Navigation API Error - "patientId and symptomId are required" ✅ FIXED

### Problem
The `/navigation/recommend` API was returning an error because the frontend was only sending `symptomId` but the Lambda requires both `patientId` and `symptomId`.

### Root Cause
In `frontend/src/components/CareNavigation.tsx`, the API call was missing the `patientId` parameter:

```typescript
// OLD CODE (BROKEN)
const response = await axios.post('/navigation/recommend', {
  symptomId,  // Missing patientId!
});
```

### Solution Applied
1. Retrieved `patientId` from localStorage (where it's stored as `userId` in the user object)
2. Added `patientId` to the API request payload
3. Fixed TypeScript import for `AxiosError`

```typescript
// NEW CODE (FIXED)
const userStr = localStorage.getItem('carenav_user');
const user = JSON.parse(userStr);
const patientId = user.userId;

const response = await axios.post('/navigation/recommend', {
  patientId,  // Now included!
  symptomId,
});
```

### Files Modified
- `frontend/src/components/CareNavigation.tsx`

### Testing
To test this fix:
1. Build the frontend: `npm run build` (in frontend directory)
2. Navigate through the symptom flow
3. After answering follow-up questions, the care navigation should now work without the "patientId and symptomId are required" error

---

## Issue 2: Generic Follow-Up Questions Instead of AI-Powered Targeted Questions ⚠️ NEEDS DECISION

### Problem
The system is asking generic questions like:
- "Have you experienced this before?"
- "Does anything make it better or worse?"

Instead of AI-powered targeted questions based on disease analysis.

### Root Cause
The `lambda/symptom-processor/index.ts` is using the old generic follow-up question generation:
- Uses `FOLLOWUP_GENERATION_SYSTEM_PROMPT` (generic questions)
- Does NOT use disease analysis to generate targeted questions

### Available Solution
The codebase already has the AI-powered iterative diagnosis system implemented:

1. **Disease Analysis** (`DISEASE_ANALYSIS_SYSTEM_PROMPT`)
   - Analyzes symptoms to identify 5-10 disease candidates
   - Assigns probability scores to each disease
   - Identifies supporting and missing symptoms

2. **Targeted Question Generation** (`QUESTION_GENERATION_SYSTEM_PROMPT`)
   - Generates 3-5 questions that help differentiate between disease candidates
   - Questions are patient-friendly and NEVER mention disease names
   - Questions target specific symptoms that help narrow down the diagnosis

### Implementation Options

#### Option A: Use AI-Powered Iterative Diagnosis (Recommended)
**Pros:**
- More intelligent, targeted questions
- Better disease differentiation
- Aligns with the ai-iterative-diagnosis-qr spec
- Disease analysis stored for doctor review (via QR code)

**Cons:**
- Requires more Bedrock API calls (2 calls instead of 1)
- Slightly more complex implementation

**Changes Required:**
1. Update `lambda/symptom-processor/index.ts`:
   - Call disease analysis first
   - Generate targeted questions based on disease candidates
   - Store disease analysis in DynamoDB
2. Update `lambda/shared/symptom-db.ts`:
   - Add fields to store disease analysis
3. Update frontend to handle new question types (yes_no, multiple_choice, scale)

#### Option B: Keep Generic Questions
**Pros:**
- Simpler, already working
- Fewer API calls

**Cons:**
- Less intelligent questions
- Doesn't leverage the iterative diagnosis system
- Misses opportunity for better disease differentiation

### Recommendation
**Use Option A** - The AI-powered iterative diagnosis provides significantly better questions and aligns with the system's design goals.

### Next Steps
**Please confirm which option you prefer:**
1. **Option A**: Implement AI-powered targeted questions (recommended)
2. **Option B**: Keep generic questions as-is

Once you confirm, I'll implement the chosen solution.

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Care Navigation API Error | ✅ Fixed | Build and deploy frontend |
| Generic Follow-Up Questions | ⚠️ Pending | User decision needed |

