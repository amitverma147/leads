import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { Role } from '../config/constants';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

/**
 * Parse expiry string to seconds
 */
const parseExpiry = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  const tokenPayload: TokenPayload = { ...payload, type: 'access' } as TokenPayload;

  return jwt.sign(tokenPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  const tokenPayload: TokenPayload = { ...payload, type: 'refresh' } as TokenPayload;

  return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  } as SignOptions);
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: Omit<TokenPayload, 'type'>): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const accessExpirySeconds = parseExpiry(config.jwt.accessExpiry);
  const refreshExpirySeconds = parseExpiry(config.jwt.refreshExpiry);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: new Date(Date.now() + accessExpirySeconds * 1000),
    refreshTokenExpiry: new Date(Date.now() + refreshExpirySeconds * 1000),
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

/**
 * Decode token without verification
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Get expiry in seconds from config
 */
export const getAccessTokenExpirySeconds = (): number => {
  return parseExpiry(config.jwt.accessExpiry);
};

export const getRefreshTokenExpirySeconds = (): number => {
  return parseExpiry(config.jwt.refreshExpiry);
};