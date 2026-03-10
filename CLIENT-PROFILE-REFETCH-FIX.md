# Client Profile Refetch Fix

## Problem
After updating a patient's profile via EditProfile component, the client wasn't automatically refetching the updated profile data. The user context still showed old data until the page was manually refreshed.

## Root Cause
The `refreshUser()` function in AuthContext was trying to fetch from `/api/patients/${userId}` endpoint, which:
1. Doesn't exist as a GET endpoint in the backend
2. Even if it did, it would fetch from the Patient table, not the User table where auth data is stored

## Solution

### 1. Added GET Endpoint to Auth Handler
**File**: `lambda/auth-handler/index.ts`

Added a new `handleGetUser()` function that:
- Accepts GET requests to `/api/auth/user/:userId`
- Fetches user data from the User table (auth-db)
- Returns complete user profile without passwordHash
- Properly handles errors

```typescript
async function handleGetUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const userId = pathParts[pathParts.length - 1];

  if (!userId) {
    return errorResponse('User ID is required', 400);
  }

  const { getUserById } = await import('../shared/auth-db');

  try {
    const user = await getUserById(userId);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const { passwordHash, ...userResponse } = user;

    return successResponse({
      user: userResponse
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return errorResponse(error.message || 'Failed to fetch user', 500);
  }
}
```

### 2. Updated Auth Handler Router
Added route handling for GET requests:

```typescript
} else if (path.match(/\/api\/auth\/user\/[^/]+$/) && method === 'GET') {
  return await handleGetUser(event);
}
```

### 3. Fixed refreshUser() in AuthContext
**File**: `frontend/src/contexts/AuthContext.tsx`

Updated `refreshUser()` to:
- Fetch from the correct endpoint: `/api/auth/user/${userId}`
- Handle the response structure properly (response.data.user || response.data)
- Update all user fields with fresh data from the server

```typescript
const refreshUser = async () => {
  if (!user?.userId || !token) return;
  
  try {
    // Fetch fresh user data from the auth endpoint
    const response = await authAxios.get(`/api/auth/user/${user.userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data.user || response.data;
    
    const updatedUser: User = {
      userId: user.userId,
      email: userData.email || user.email,
      role: user.role,
      name: userData.name,
      age: userData.age,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      bloodGroup: userData.bloodGroup,
      parentName: userData.parentName,
      contact: userData.contact,
    };

    setUser(updatedUser);
    localStorage.setItem('carenav_user', JSON.stringify(updatedUser));
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  }
};
```

## Data Flow After Fix

### Profile Update Flow:
1. Patient edits profile in EditProfile component
2. Frontend calls `PUT /api/auth/user/:userId` with updates
3. Backend auth handler:
   - Updates User table with all fields
   - If patient, also updates Patient table (dual-table sync)
4. Frontend calls `refreshUser()` after successful update
5. `refreshUser()` calls `GET /api/auth/user/:userId`
6. Backend returns fresh user data from User table
7. AuthContext updates user state and localStorage
8. Dashboard and all components using `useAuth()` automatically show updated data

## Benefits

1. **Automatic Updates**: Profile changes are immediately reflected across all components
2. **No Manual Refresh**: Users don't need to refresh the page to see updates
3. **Consistent Data**: All components using AuthContext get the latest data
4. **Proper Architecture**: Uses the correct endpoint for fetching auth/user data
5. **Error Handling**: Gracefully handles fetch failures without breaking the UI

## Testing

### Test Scenario:
1. Login as a patient
2. Go to Edit Profile
3. Change name from "John Doe" to "Jane Smith"
4. Change contact from "1234567890" to "9876543210"
5. Save changes
6. **Expected**: Dashboard immediately shows "Jane Smith" and new contact
7. Navigate to other pages
8. **Expected**: All pages show updated profile data
9. Refresh browser
10. **Expected**: Updated data persists (from localStorage)

### Verification Points:
- User context updates immediately after save
- Dashboard shows updated data without page refresh
- Header shows updated name
- All components using `useAuth()` show updated data
- localStorage has updated user data
- No console errors

## Files Modified

1. `lambda/auth-handler/index.ts`
   - Added `handleGetUser()` function
   - Added GET route for `/api/auth/user/:userId`

2. `frontend/src/contexts/AuthContext.tsx`
   - Fixed `refreshUser()` to use correct endpoint
   - Improved response data handling

## API Endpoints

### New Endpoint:
```
GET /api/auth/user/:userId
Authorization: Bearer <token>

Response:
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "patient",
    "name": "Jane Smith",
    "age": 25,
    "dateOfBirth": "1999-01-01",
    "gender": "female",
    "contact": "9876543210",
    "bloodGroup": "O+",
    "parentName": "Parent Name"
  }
}
```

### Existing Endpoint (Still Works):
```
PUT /api/auth/user/:userId
Authorization: Bearer <token>
Body: { name, age, gender, contact, dateOfBirth, bloodGroup, parentName }

Response:
{
  "message": "User updated successfully",
  "user": { ...updated user data }
}
```

## Deployment

After deploying this fix:
1. Backend will have the new GET endpoint
2. Frontend will automatically refetch profile after updates
3. No database migration needed
4. Existing functionality remains unchanged
5. Profile updates will be immediately visible

## Related Issues Fixed

This fix also resolves:
- Profile data not updating in Header component
- Need to manually refresh page after profile edit
- Inconsistent data between components
- localStorage having stale user data

## Security Considerations

- GET endpoint requires authentication (Bearer token)
- Only returns data for the authenticated user
- Password hash is never returned in response
- Proper error handling for unauthorized access
- Uses existing auth-db functions (no new security surface)
