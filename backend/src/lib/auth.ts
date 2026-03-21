/**
 * Auth Service — Phase 4
 * JWT authentication + TOTP-based 2FA for admin accounts
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import prisma from './prisma';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'clearmed_dev_secret_change_in_prod';
const JWT_EXPIRES = '8h';

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ── Password ──────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT ───────────────────────────────────────────────────────────────────

export function signToken(payload: Omit<AdminTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

// ── TOTP 2FA ──────────────────────────────────────────────────────────────

export function generateTotpSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, 'ClearMed Admin', secret);
  return { secret, otpauthUrl };
}

export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotp(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// ── Login flow ────────────────────────────────────────────────────────────

export async function adminLogin(
  email: string,
  password: string,
  totpToken?: string
): Promise<{ success: boolean; token?: string; requireTotp?: boolean; error?: string }> {
  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });

  if (!admin || !admin.isActive) {
    logger.warn('[Auth] Login failed — unknown email', { email });
    return { success: false, error: 'Invalid credentials' };
  }

  const passwordOk = await verifyPassword(password, admin.passwordHash);
  if (!passwordOk) {
    logger.warn('[Auth] Login failed — wrong password', { email });
    return { success: false, error: 'Invalid credentials' };
  }

  // If TOTP is enabled, require token
  if (admin.totpEnabled) {
    if (!totpToken) {
      return { success: false, requireTotp: true };
    }
    const totpOk = verifyTotp(totpToken, admin.totpSecret!);
    if (!totpOk) {
      logger.warn('[Auth] TOTP failed', { email });
      return { success: false, error: 'Invalid 2FA code' };
    }
  }

  // Update last login
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLogin: new Date() } });

  // Write audit log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: 'LOGIN',
      entity: 'admin_user',
      entityId: admin.id,
      description: `Admin login: ${email}`,
    },
  }).catch(() => {});

  const token = signToken({ adminId: admin.id, email: admin.email, role: admin.role });
  logger.info('[Auth] Admin logged in', { email, role: admin.role });

  return { success: true, token };
}

// ── TOTP setup ────────────────────────────────────────────────────────────

export async function setupTotp(adminId: string): Promise<{ qrCode: string; secret: string }> {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error('Admin not found');

  const { secret, otpauthUrl } = generateTotpSecret(admin.email);
  const qrCode = await generateQrCode(otpauthUrl);

  // Store secret (not yet enabled until confirmed)
  await prisma.adminUser.update({ where: { id: adminId }, data: { totpSecret: secret } });

  return { qrCode, secret };
}

export async function confirmTotp(adminId: string, token: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin?.totpSecret) return false;

  const valid = verifyTotp(token, admin.totpSecret);
  if (valid) {
    await prisma.adminUser.update({ where: { id: adminId }, data: { totpEnabled: true } });
  }
  return valid;
}
