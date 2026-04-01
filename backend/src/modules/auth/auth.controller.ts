import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { authService } from './auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './auth.types';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email or phone already exists
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const input: RegisterInput = req.body;
  const ipAddress = req.ip;

  const result = await authService.register(input, ipAddress);

  return ApiResponse.created(res, result, 'Registration successful');
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const input: LoginInput = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.login(input, ipAddress, userAgent);

  return ApiResponse.success(res, result, 'Login successful');
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const input: RefreshTokenInput = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.refreshToken(input, ipAddress, userAgent);

  return ApiResponse.success(res, result, 'Token refreshed successfully');
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken } = req.body;
  const userId = req.user!.userId;

  await authService.logout(refreshToken, userId);

  return ApiResponse.success(res, null, 'Logout successful');
});

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user!.userId;

  await authService.logoutAll(userId);

  return ApiResponse.success(res, null, 'Logged out from all devices');
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const input: ChangePasswordInput = req.body;
    const userId = req.user!.userId;

    await authService.changePassword(userId, input);

    return ApiResponse.success(res, null, 'Password changed successfully');
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user!.userId;

  const user = await authService.getProfile(userId);

  return ApiResponse.success(res, user, 'Profile retrieved successfully');
});