# Authentication Implementation - Task 17.2

## Overview

This document describes the authentication context and components implemented for CareNav AI frontend.

## Components Implemented

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

**Purpose**: Centralized authentication state management using React Context API

**Features**:
- User state management (userId, email, role)
- JWT token storage in localStorage
- Login/logout functionality
- Authentication status tracking
- Loading state management

**API**:
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Usage**:
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  // ...
}
```

### 2. Axios Configuration (`src/lib/axios.ts`)

**Purpose**: Configured axios instance with JWT interceptors

**Features**:
- Automatic JWT token injection in request headers
- Token expiration handling (401 responses)
- Automatic redirect to login on authentication failure
- Centralized API base URL configuration

**Request Interceptor**:
- Reads JWT token from localStorage
- Adds `Authorization: Bearer <token>` header to all requests

**Response Interceptor**:
- Detects 401 Unauthorized responses
- Clears authentication state
- Redirects to login page

### 3. Login Component (`src/components/Login.tsx`)

**Purpose**: User authentication interface

**Features**:
- Email/password form with validation
- Error message display
- Loading state during authentication
- Demo data warning banner
- Demo credentials display for testing

**Demo Credentials**:
- Patient: `patient@demo.com` / `demo123`
- Doctor: `doctor@demo.com` / `demo123`

### 4. Header Component (`src/components/Header.tsx`)

**Purpose**: Application header with user info and logout

**Features**:
- Displays user email and role badge
- Logout button with icon
- Demo data warning banner
- Only visible when authenticated

### 5. Protected Route Component (`src/components/ProtectedRoute.tsx`)

**Purpose**: Route protection based on authentication and role

**Features**:
- Redirects unauthenticated users to login
- Role-based access control (patient/doctor)
- Loading state during authentication check
- Access denied message for unauthorized roles

**Usage**:
```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute requiredRole="patient">
      <PatientDashboard />
    </ProtectedRoute>
  }
/>
```

### 6. Dashboard Component (`src/components/Dashboard.tsx`)

**Purpose**: Main authenticated landing page

**Features**:
- Welcome message with user role
- Role-specific feature lists
- User information display
- System disclaimers

## Application Structure

### Updated App.tsx

The main App component now includes:
- React Router for navigation
- AuthProvider wrapping all routes
- Route definitions:
  - `/login` - Login page (redirects to dashboard if authenticated)
  - `/dashboard` - Protected dashboard (requires authentication)
  - `/` - Root redirects to login or dashboard based on auth state

## Authentication Flow

### Login Flow

1. User enters email and password in Login component
2. Login component calls `login()` from AuthContext
3. AuthContext makes POST request to `/api/auth/login`
4. Backend validates credentials and returns JWT token
5. Token and user data stored in:
   - React state (AuthContext)
   - localStorage (for persistence)
6. User redirected to dashboard

### Logout Flow

1. User clicks logout button in Header
2. Header calls `logout()` from AuthContext
3. AuthContext makes POST request to `/api/auth/logout`
4. Token and user data cleared from:
   - React state
   - localStorage
5. User redirected to login page

### Protected Route Access

1. User navigates to protected route
2. ProtectedRoute checks `isAuthenticated` from AuthContext
3. If not authenticated → redirect to login
4. If authenticated but wrong role → show access denied
5. If authenticated with correct role → render component

### Token Persistence

1. On app load, AuthContext checks localStorage for token
2. If token exists, restore user session
3. Token automatically added to all API requests via axios interceptor
4. On 401 response, token cleared and user redirected to login

## JWT Token Storage

**Storage Location**: `localStorage`

**Keys**:
- `carenav_token` - JWT token string
- `carenav_user` - JSON stringified user object

**Security Considerations**:
- localStorage is vulnerable to XSS attacks
- For production, consider httpOnly cookies
- Token expiration handled by backend (24 hours)
- Token cleared on logout or 401 response

## API Integration

### Expected Backend Endpoints

**POST /api/auth/login**
```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  token: string;
  userId: string;
  role: 'patient' | 'doctor';
}
```

**POST /api/auth/logout**
```typescript
Headers: {
  Authorization: 'Bearer <token>'
}

Response: {
  success: boolean;
}
```

## Environment Configuration

**Required Environment Variable**:
```
VITE_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

**Default**: `http://localhost:3000` (for local development)

## Testing the Implementation

### Prerequisites

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and set VITE_API_URL
   ```

3. Ensure backend authentication endpoints are deployed

### Running the Application

```bash
npm run dev
```

### Test Scenarios

1. **Login with valid credentials**
   - Navigate to `/login`
   - Enter demo credentials
   - Verify redirect to dashboard
   - Check localStorage for token

2. **Login with invalid credentials**
   - Enter wrong password
   - Verify error message displayed

3. **Protected route access**
   - Try accessing `/dashboard` without login
   - Verify redirect to login

4. **Logout**
   - Login successfully
   - Click logout button
   - Verify redirect to login
   - Check localStorage cleared

5. **Token persistence**
   - Login successfully
   - Refresh page
   - Verify still authenticated

6. **Role-based access**
   - Login as patient
   - Try accessing doctor-only route
   - Verify access denied message

## Requirements Validation

This implementation satisfies the following requirements from Task 17.2:

✅ **Implement React Context for auth state management**
- AuthContext provides centralized state
- useAuth hook for easy access

✅ **Create login component with email/password form**
- Login.tsx with form validation
- Error handling and loading states

✅ **Create logout functionality**
- Logout button in Header
- Clears state and localStorage

✅ **Add JWT token storage in localStorage**
- Token stored on login
- Token loaded on app mount
- Token cleared on logout

✅ **Implement Axios interceptors for JWT headers**
- Request interceptor adds Authorization header
- Response interceptor handles 401 errors
- Automatic token injection for all API calls

## Related Requirements

- **Requirement 10.1**: User authentication required for protected features ✅
- **Requirement 10.2**: Session creation with expiration time ✅
- **Requirement 10.5**: Session invalidation on logout ✅

## Next Steps

1. Deploy backend authentication Lambda functions (Task 2.2, 2.3)
2. Test integration with deployed API Gateway
3. Implement patient-facing components (Task 18)
4. Implement doctor-facing components (Task 19)
5. Add role-based route protection for specific features

## Notes

- All components include demo data warnings as per requirements
- Authentication is minimal and functional for hackathon MVP
- Production deployment should consider:
  - httpOnly cookies instead of localStorage
  - CSRF protection
  - Rate limiting on login endpoint
  - Password strength requirements
  - Multi-factor authentication
