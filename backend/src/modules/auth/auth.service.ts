import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ROLES, Role } from '../../config/constants';
import { ApiError } from '../../utils/api-error';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  generateTokenPair,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
} from '../../utils/jwt';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
  AuthResponse,
  UserResponse,
} from './auth.types';

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput, ipAddress?: string): Promise<AuthResponse> {
    const { email, password, firstName, lastName, phone, organizationName } = input;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw ApiError.conflict('Email already registered');
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        throw ApiError.conflict('Phone number already registered');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const orgSlug = `org-${uuidv4().slice(0, 8)}`;
      const organization = await tx.organization.create({
        data: {
          name: organizationName || `${firstName}'s Organization`,
          slug: orgSlug,
        },
      });

      // Create user as admin of the organization
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: ROLES.ADMIN,
          organizationId: organization.id,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
        include: {
          organization: true,
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role as Role,
      organizationId: result.user.organizationId,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: result.user.id,
        expiresAt: tokens.refreshTokenExpiry,
        ipAddress,
      },
    });

    logger.info(`User registered: ${result.user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
      user: this.formatUserResponse(result.user, result.organization.name),
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.unauthorized('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      organizationId: user.organizationId,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: tokens.refreshTokenExpiry,
        ipAddress,
        userAgent,
      },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
      user: this.formatUserResponse(user, user.organization.name),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    input: RefreshTokenInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const { refreshToken } = input;

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type');
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token not found');
    }

    if (storedToken.isRevoked) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired');
    }

    if (!storedToken.user.isActive) {
      throw ApiError.unauthorized('User account is deactivated');
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const tokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as Role,
      organizationId: storedToken.user.organizationId,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: tokens.refreshTokenExpiry,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
      user: this.formatUserResponse(storedToken.user, storedToken.user.organization.name),
    };
  }

  /**
   * Logout user - revoke refresh token
   */
  async logout(refreshToken: string, userId: string): Promise<void> {
    // Revoke the specific refresh token
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: { isRevoked: true },
    });

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    logger.info(`User logged out from all devices: ${userId}`);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const { currentPassword, newPassword } = input;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and revoke all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);

    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return this.formatUserResponse(user, user.organization.name);
  }

  /**
   * Format user response
   */
  private formatUserResponse(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      avatar: string | null;
      role: string;
      isActive: boolean;
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
      organizationId: string;
      createdAt: Date;
    },
    organizationName: string
  ): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role as Role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      organizationId: user.organizationId,
      organizationName,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();