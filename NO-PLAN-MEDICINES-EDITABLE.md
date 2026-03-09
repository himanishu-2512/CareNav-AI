# No Plan Medicines - Editable by Doctor

## Change Summary

Updated the "No Plan" section to allow doctors to edit and delete medicines they created, even though these medicines don't belong to a formal treatment plan.

## Problem

Previously, all medicines in the "No Plan" section were marked as "View Only" and couldn't be edited or deleted, even if the current doctor created them.

## Solution

### 1. Track Medicine Ownership

Added `treatmentPlanId` and `doctorId` fields to the Medicine/Prescription interface to track which doctor created each medicine:

```typescript
interface Medicine {
  medicineId: string;
  medicineName: string;
  // ... other fields
  treatmentPlanId?: string;  // NEW: Track which plan this came from
  doctorId?: string;         // NEW: Track which doctor created it
}
```

### 2. Preserve Metadata When Combining

When combining "No Plan" medicines from multiple legacy treatment plans, preserve the original plan ID and doctor ID:

```typescript
const combinedNoPlanMedicines: Medicine[] = [];
noPlanCandidates.forEach((plan: TreatmentPlan) => {
  // Add treatmentPlanId and doctorId to each medicine for tracking
  const medicinesWithMetadata = plan.prescriptions.map(med => ({
    ...med,
    treatmentPlanId: plan.treatmentPlanId,
    doctorId: plan.doctorId
  }));
  combinedNoPlanMedicines.push(...medicinesWithMetadata);
});
```

### 3. Per-Medicine Edit Permission

Check edit permission for each individual medicine based on who created it:

```typescript
const renderMedicineCard = (medicine: Medicine, planId: string, editable: boolean) => {
  // For "No Plan" medicines, check if this specific medicine was created by current doctor
  const canEditThisMedicine = planId === 'no-plan' 
    ? medicine.doctorId === user?.userId 
    : editable;
  
  // Show edit/delete buttons only if canEditThisMedicine is true
  {canEditThisMedicine && (
    <div className="flex gap-2 ml-4">
      <button onClick={() => handleEditMedicine(...)}>Edit</button>
      <button onClick={() => handleDeleteMedicine(...)}>Delete</button>
    </div>
  )}
}
```

### 4. Use Original Plan ID for API Calls

When editing or deleting a "No Plan" medicine, use the original treatment plan ID (not 'no-plan'):

```typescript
// Use the actual treatmentPlanId from the medicine metadata
onClick={() => handleEditMedicine(medicine.treatmentPlanId || planId, medicine)}
onClick={() => handleDeleteMedicine(medicine.treatmentPlanId || planId, medicine.medicineId)}
```

### 5. Remove "View Only" Badge

Removed the "View Only" badge from the "No Plan" section header since some medicines may now be editable.

## Behavior

### Before
- All "No Plan" medicines showed "View Only" badge
- No edit or delete buttons visible
- Doctors couldn't modify medicines they created

### After
- "No Plan" section shows no badge (some medicines may be editable)
- Edit and delete buttons appear only for medicines created by current doctor
- Each medicine is independently editable based on ownership
- Medicines created by other doctors remain view-only

## Example Scenarios

### Scenario 1: Doctor's Own Medicines
- Dr. Smith logs in
- Views patient's treatment plans
- "No Plan" section shows 3 medicines:
  - Medicine A (created by Dr. Smith) → Edit/Delete buttons visible ✅
  - Medicine B (created by Dr. Jones) → No buttons, view-only ❌
  - Medicine C (created by Dr. Smith) → Edit/Delete buttons visible ✅

### Scenario 2: All Medicines from Other Doctors
- Dr. Smith logs in
- Views patient's treatment plans
- "No Plan" section shows 2 medicines:
  - Medicine A (created by Dr. Jones) → No buttons, view-only ❌
  - Medicine B (created by Dr. Brown) → No buttons, view-only ❌
- Section behaves like "View Only" but without the badge

### Scenario 3: Mixed Treatment Plans
- Patient has:
  - Treatment Plan "Diabetes Care" (created by Dr. Smith) → Fully editable
  - Treatment Plan "Hypertension" (created by Dr. Jones) → View-only
  - No Plan medicines (2 by Dr. Smith, 1 by Dr. Jones) → 2 editable, 1 view-only

## Files Modified

1. `frontend/src/components/PatientTreatmentPlans.tsx`
   - Added `treatmentPlanId` and `doctorId` to Medicine interface
   - Updated medicine combining logic to preserve metadata
   - Added per-medicine edit permission check
   - Updated edit/delete handlers to use original plan ID
   - Removed "View Only" badge

2. `frontend/src/components/TreatmentPlanner.tsx`
   - Added `treatmentPlanId` and `doctorId` to Prescription interface
   - Updated medicine combining logic to preserve metadata
   - Added per-medicine edit permission check
   - Updated edit/delete handlers to use original plan ID
   - Removed "View Only" badge

## Backend Compatibility

No backend changes required. The backend already:
- Stores `doctorId` in each treatment plan
- Validates doctor ownership when editing/deleting medicines
- Returns 403 error if doctor tries to edit another doctor's plan

The frontend now correctly uses the original `treatmentPlanId` (not 'no-plan') when making API calls, so backend validation works correctly.

## Testing

To verify the changes work:

1. Create medicines as Doctor A without a treatment plan
2. Create medicines as Doctor B without a treatment plan
3. Log in as Doctor A
4. View patient's treatment plans
5. Expand "No Plan" section
6. Verify:
   - Doctor A's medicines show edit/delete buttons
   - Doctor B's medicines show no buttons
   - Clicking edit/delete on Doctor A's medicines works
   - Backend returns 403 if trying to edit Doctor B's medicines

## Security

- Frontend checks are for UX only (hiding buttons)
- Backend enforces actual access control
- Even if frontend is bypassed, backend validates doctor ownership
- 403 error returned if doctor tries to edit another doctor's medicine
