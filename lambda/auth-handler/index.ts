// Authentication Lambda Handler
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';
import { getUserByEmail, createSession, deleteSession, createUser } from '../shared/auth-db';
import { Session, User } from '../shared/types';

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

/**
 * Main handler for authentication endpoints
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path;
  const method = event.httpMethod;

  console.log(`Auth handler - ${method} ${path}`);

  // Handle OPTIONS requests for CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
      },
      body: ''
    };
  }

  try {
    // Route to appropriate handler based on path
    if (path === '/api/auth/login' && method === 'POST') {
      return await handleLogin(event);
    } else if (path === '/api/auth/register' && method === 'POST') {
      return await handleRegister(event);
    } else if (path === '/api/auth/logout' && method === 'POST') {
      return await handleLogout(event);
    } else if (path.match(/\/api\/auth\/user\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateUser(event);
    } else if (path.match(/\/api\/auth\/user\/[^/]+$/) && method === 'GET') {
      return await handleGetUser(event);
    } else {
      return errorResponse('Not found', 404);
    }
  } catch (error: any) {
    console.error('Auth handler error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * Handle user registration
 */
async function handleRegister(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const body = JSON.parse(event.body);

  // Validate required fields based on role
  const requiredFields = ['name', 'email', 'password', 'role'];
  const validation = validateRequiredFields(body, requiredFields);
  if (!validation.valid) {
    return errorResponse(
      `Missing required fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  const { name, email, password, role, phone, specialization, licenseNumber, age, gender, contact, dateOfBirth, bloodGroup, parentName } = body;

  // Validate role
  if (role !== 'patient' && role !== 'doctor') {
    return errorResponse('Role must be either "patient" or "doctor"', 400);
  }

  // Validate password length
  if (password.length < 8) {
    return errorResponse('Password must be at least 8 characters', 400);
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return errorResponse('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const userId = uuidv4();
  const user: User = {
    userId,
    email,
    passwordHash,
    role,
    name,
    createdAt: new Date().toISOString()
  };

  // Add role-specific fields
  if (role === 'doctor') {
    user.phone = phone;
    user.specialization = specialization;
    user.licenseNumber = licenseNumber;
  } else if (role === 'patient') {
    user.age = age;
    user.gender = gender;
    user.contact = contact || phone;
    user.dateOfBirth = dateOfBirth;
    user.bloodGroup = bloodGroup;
    user.parentName = parentName;
  }

  await createUser(user);

  console.log(`User registered successfully: ${userId} (${role})`);

  return successResponse({
    userId,
    email,
    role,
    name,
    message: 'Registration successful'
  }, 201);
}

/**
 * Handle user login
 */
async function handleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Parse request body
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const body = JSON.parse(event.body);

  // Validate required fields
  const validation = validateRequiredFields(body, ['email', 'password']);
  if (!validation.valid) {
    return errorResponse(
      `Missing required fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  const { email, password } = body;

  // Retrieve user from DynamoDB by email
  const user = await getUserByEmail(email);

  if (!user) {
    console.log(`Login failed: User not found for email ${email}`);
    return errorResponse('Invalid credentials', 401);
  }

  // Verify password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    console.log(`Login failed: Invalid password for email ${email}`);
    return errorResponse('Invalid credentials', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  // Calculate expiration timestamp (24 hours from now)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Create session in DynamoDB
  const session: Session = {
    token,
    userId: user.userId,
    role: user.role,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  await createSession(session);

  console.log(`Login successful for user ${user.userId} (${user.role})`);

  // Prepare user data to return (exclude passwordHash)
  const userData: any = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    name: user.name
  };

  // Add role-specific fields
  if (user.role === 'patient') {
    userData.age = user.age;
    userData.dateOfBirth = user.dateOfBirth;
    userData.gender = user.gender;
    userData.contact = user.contact;
    userData.bloodGroup = user.bloodGroup;
    userData.parentName = user.parentName;
  } else if (user.role === 'doctor') {
    userData.phone = user.phone;
    userData.specialization = user.specialization;
    userData.licenseNumber = user.licenseNumber;
  }

  // Return token and user info
  return successResponse({
    token,
    ...userData,
    expiresAt
  });
}

/**
 * Handle user logout
 */
async function handleLogout(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extract token from Authorization header
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    return errorResponse('Authorization header is required', 401);
  }

  // Remove 'Bearer ' prefix if present
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return errorResponse('Token is required', 401);
  }

  try {
    // Delete session from DynamoDB
    await deleteSession(token);

    console.log('Logout successful');

    return successResponse({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    // Even if deletion fails, return success (idempotent operation)
    return successResponse({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

/**
 * Handle user profile update
 */
async function handleUpdateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extract userId from path
  const pathParts = event.path.split('/');
  const userId = pathParts[pathParts.length - 1];

  if (!userId) {
    return errorResponse('User ID is required', 400);
  }

  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const updates = JSON.parse(event.body);

  // Import updateUser function
  const { updateUser, getUserById } = await import('../shared/auth-db');
  const { updatePatient } = await import('../shared/patient-db');

  try {
    // Update user in auth table
    const updatedUser = await updateUser(userId, updates);

    // If user is a patient, also update patient table
    if (updatedUser.role === 'patient') {
      try {
        // Map user fields to patient fields
        const patientUpdates: any = {};
        if (updates.name !== undefined) patientUpdates.name = updates.name;
        if (updates.age !== undefined) patientUpdates.age = updates.age;
        if (updates.gender !== undefined) patientUpdates.gender = updates.gender;
        if (updates.contact !== undefined) patientUpdates.contact = updates.contact;
        if (updates.dateOfBirth !== undefined) patientUpdates.dateOfBirth = updates.dateOfBirth;
        if (updates.bloodGroup !== undefined) patientUpdates.bloodGroup = updates.bloodGroup;
        if (updates.parentName !== undefined) patientUpdates.parentName = updates.parentName;

        // Update patient record if there are patient-specific fields
        if (Object.keys(patientUpdates).length > 0) {
          await updatePatient(userId, patientUpdates);
          console.log(`Patient record ${userId} updated successfully`);
        }
      } catch (patientError: any) {
        console.error('Error updating patient record:', patientError);
        // Don't fail the whole request if patient update fails
        // The user table is already updated
      }
    }

    // Remove passwordHash from response
    const { passwordHash, ...userResponse } = updatedUser;

    console.log(`User ${userId} updated successfully`);

    return successResponse({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return errorResponse(error.message || 'Failed to update user', 500);
  }
}

/**
 * Handle get user profile
 */
async function handleGetUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extract userId from path
  const pathParts = event.path.split('/');
  const userId = pathParts[pathParts.length - 1];

  if (!userId) {
    return errorResponse('User ID is required', 400);
  }

  // Import getUserById function
  const { getUserById } = await import('../shared/auth-db');

  try {
    // Get user from auth table
    const user = await getUserById(userId);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Remove passwordHash from response
    const { passwordHash, ...userResponse } = user;

    console.log(`User ${userId} fetched successfully`);

    return successResponse({
      user: userResponse
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return errorResponse(error.message || 'Failed to fetch user', 500);
  }
}
