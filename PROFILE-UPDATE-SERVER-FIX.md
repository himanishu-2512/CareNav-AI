# Profile Update Server Fix - Old Data Returned After Update

## Problem
After successfully updating a patient's profile, the server was still returning old data when fetching patient details via `/patients/:patientId`. The update appeared successful but the changes weren't reflected.

## Root Cause
The application uses TWO separate DynamoDB tables:
1. **User Table** (auth-db) - Stores authentication and user profile data
2. **Patient Table** (patient-db) - Stores patient-specific medical data

When a patient updated their profile via EditProfile component:
- The update went to `/auth/user/:userId` endpoint
- This only updated the User table
- When doctors or the dashboard fetched patient data via `/patients/:patientId`, it read from the Patient table
- The Patient table was never updated, so it returned old data

## Solution

### Updated Auth Handler
**File**: `lambda/auth-handler/index.ts` (handleUpdateUser function)

Added logic to update BOTH tables when a patient updates their profile:

1. Update User table (existing behavior)
2. Check if user role is 'patient'
3. If patient, also update Patient table with relevant fields:
   - name
   - age
   - gender
   - contact
   - dateOfBirth
   - bloodGroup
   - parentName

### Implementation Details

```typescript
// Update user in auth table
const updatedUser = await updateUser(userId, updates);

// If user is a patient, also update patient table
if (updatedUser.role === 'patient') {
  // Map user fields to patient fields
  const patientUpdates: any = {};
  if (updates.name !== undefined) patientUpdates.name = updates.name;
  if (updates.age !== undefined) patientUpdates.age = updates.age;
  if (updates.gender !== undefined) patientUpdates.gender = updates.gender;
  if (updates.contact !== undefined) patientUpdates.contact = updates.contact;
  if (updates.dateOfBirth !== undefined) patientUpdates.dateOfBirth = updates.dateOfBirth;
  if (updates.bloodGroup !== undefined) patientUpdates.bloodGroup = updates.bloodGroup;
  if (updates.parentName !== undefined) patientUpdates.parentName = updates.parentName;

  // Update patient record
  if (Object.keys(patientUpdates).length > 0) {
    await updatePatient(userId, patientUpdates);
  }
}
```

### Error Handling
- If patient table update fails, the request still succeeds (user table is already updated)
- Error is logged but doesn't fail the entire operation
- This prevents breaking the user experience if one table update fails

## Data Flow After Fix

### Profile Update Flow:
1. Patient edits profile in EditProfile component
2. Frontend calls `PUT /auth/user/:userId` with updates
3. Backend auth handler:
   - Updates User table with all fields
   - Checks if user is a patient
   - If patient, updates Patient table with relevant fields
4. Both tables now have updated data
5. Frontend refreshes user context (reads from User table)
6. Dashboard/Doctor views fetch patient data (reads from Patient table)
7. Both sources now show updated information

## Testing

### Test Scenario:
1. Login as a patient
2. Go to Edit Profile
3. Change name from "John Doe" to "Jane Smith"
4. Change contact from "1234567890" to "9876543210"
5. Save changes
6. Navigate to Dashboard
7. **Expected**: Dashboard shows "Jane Smith" and new contact
8. Doctor views patient list
9. **Expected**: Doctor sees "Jane Smith" and new contact

### Verification Points:
- User table has updated data
- Patient table has updated data
- Dashboard shows updated data immediately
- Doctor's patient list shows updated data
- No page refresh needed

## Files Modified

- `lambda/auth-handler/index.ts`
  - Updated `handleUpdateUser()` function
  - Added patient table update logic
  - Added error handling for patient update

## Database Schema

### User Table (PK: USER#userId, SK: PROFILE)
- userId
- email
- passwordHash
- role
- name
- age (patient only)
- gender (patient only)
- contact (patient only)
- dateOfBirth (patient only)
- bloodGroup (patient only)
- parentName (patient only)
- phone (doctor only)
- specialization (doctor only)
- licenseNumber (doctor only)

### Patient Table (PK: PATIENT#patientId, SK: PROFILE)
- patientId (same as userId for patients)
- name
- age
- gender
- contact
- dateOfBirth
- bloodGroup
- parentName
- createdAt
- updatedAt

## Why Two Tables?

The dual-table design exists because:
1. User table handles authentication for both patients and doctors
2. Patient table stores medical-specific data and relationships
3. Doctors don't have patient records
4. Separation of concerns: auth vs medical data

## Future Considerations

### Option 1: Keep Dual Tables (Current Approach)
- Pros: Clear separation of concerns
- Cons: Need to keep tables in sync
- Solution: Update both tables (implemented)

### Option 2: Single Source of Truth
- Consolidate all patient data into User table
- Update all queries to read from User table
- More complex refactoring required

### Option 3: Database Triggers
- Use DynamoDB Streams to sync tables automatically
- More infrastructure complexity
- Better for larger scale

## Deployment

After deploying this fix:
1. No database migration needed
2. Existing data remains unchanged
3. Future updates will sync both tables
4. Old data in Patient table will be updated on next profile edit

## Related Issues Fixed

This fix also resolves:
- Doctor's patient list showing outdated patient names
- Patient summary showing old contact information
- Inconsistent data between dashboard and doctor views
- Need to manually refresh page to see updates
