# Treatment Plan Workflow Implementation

## Overview
Implemented a new treatment plan workflow where doctors create treatment plans first, then add medicines later. Doctors can only edit their own treatment plans.

## Changes Made

### Backend Changes

#### 1. Lambda Handler (`lambda/treatment-planner/index.ts`)
Added new endpoints:
- `POST /api/treatment/plan/create` - Create empty treatment plan with name, disease, duration
- `PUT /api/treatment/plan/:planId` - Update treatment plan metadata
- `POST /api/treatment/plan/:planId/medicine` - Add medicine to existing plan
- `DELETE /api/treatment/plan/:planId/medicine/:medicineId` - Remove medicine from plan
- `PUT /api/treatment/plan/:planId/medicine/:medicineId` - Update medicine in plan

All endpoints include access control to verify doctor ownership before allowing edits.

#### 2. Database Functions (`lambda/shared/treatment-db.ts`)
Added new functions:
- `updateTreatmentPlanMetadata()` - Update plan name, disease, duration
- `addMedicineToPlan()` - Add a prescription to an existing plan
- `removeMedicineFromPlan()` - Remove a prescription from a plan
- `updateMedicineInPlan()` - Update prescription details

#### 3. API Routes (`lib/api-stack.ts`)
Added new API Gateway routes:
- `/api/treatment/plan/create` (POST)
- `/api/treatment/plan/{planId}` (PUT)
- `/api/treatment/plan/{planId}/medicine` (POST)
- `/api/treatment/plan/{planId}/medicine/{medicineId}` (DELETE, PUT)
- `/api/treatment/plans/{patientId}` (GET)

All routes require JWT authorization.

### Frontend Changes

#### 1. New Component: `CreateTreatmentPlan.tsx`
- Form to create a new treatment plan
- Fields: Patient ID, Plan Name, Disease/Condition, Duration
- Redirects to treatment plan editor after creation

#### 2. Updated Component: `TreatmentPlanner.tsx`
Complete redesign:
- Shows treatment plan details (name, disease, duration)
- Lists all medicines in the plan
- "Add Medicine" button (only for plan creator)
- Modal form to add new medicines
- Delete button for each medicine (only for plan creator)
- Access control: Only the creating doctor can edit

#### 3. Updated Routes (`frontend/src/App.tsx`)
Added new routes:
- `/doctor/create-treatment-plan` - Create new treatment plan
- `/doctor/treatment-plan/:planId` - View/edit treatment plan

## Workflow

### Creating a Treatment Plan
1. Doctor navigates to "Create Treatment Plan"
2. Enters patient ID, plan name, disease, and duration
3. System creates empty treatment plan
4. Doctor is redirected to treatment plan editor

### Adding Medicines
1. Doctor opens treatment plan
2. Clicks "Add Medicine" button
3. Fills in medicine details (name, dosage, frequency, duration, instructions)
4. System generates schedule and creates EventBridge reminders
5. Medicine is added to the plan

### Editing/Deleting Medicines
1. Doctor opens treatment plan
2. Only plans created by the doctor show edit controls
3. Click delete button to remove a medicine
4. Confirmation dialog prevents accidental deletion

## Access Control
- All endpoints verify `doctorId` matches the plan's `doctorId`
- Returns 403 Forbidden if doctor doesn't own the plan
- Frontend hides edit controls for plans not owned by current doctor

## Database Schema
Treatment plans now include:
```typescript
interface TreatmentPlan {
  treatmentPlanId: string;
  patientId: string;
  doctorId: string;
  planName: string;        // NEW
  disease: string;         // NEW
  duration: string;        // NEW
  prescriptions: Prescription[];
  createdAt: string;
  updatedAt?: string;      // NEW
}
```

## Legacy Support
The old `/api/treatment/create` endpoint still works for backward compatibility:
- Creates a plan with default name "Legacy Treatment Plan"
- Sets disease to "Not specified"
- Uses first prescription's duration

## Next Steps
To complete the implementation:
1. Deploy backend changes: `npm run deploy`
2. Test the new workflow in the UI
3. Update doctor dashboard to link to "Create Treatment Plan"
4. Add treatment plan list view for patients
5. Consider adding plan templates for common conditions

## Testing
To test the new workflow:
1. Log in as a doctor
2. Navigate to `/doctor/create-treatment-plan`
3. Create a new treatment plan
4. Add medicines to the plan
5. Try to edit another doctor's plan (should be denied)
6. Delete a medicine from your own plan
