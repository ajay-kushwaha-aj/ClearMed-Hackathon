/**
 * Audit Log Service — Phase 4
 * Track every admin action: who did what, when, to which entity
 */

import prisma from './prisma';
import { Request } from 'express';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'DATA_ERASURE';

interface AuditParams {
  req?: Request;
  adminId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description: string;
  meta?: Record<string, unknown>;
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  const { req, adminId, action, entity, entityId, description, meta } = params;
  const resolvedAdminId = adminId || req?.admin?.adminId;

  await prisma.auditLog.create({
    data: {
      adminId: resolvedAdminId,
      action: action as any,
      entity,
      entityId,
      description,
      meta: meta as any,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')?.slice(0, 200),
    },
  }).catch(() => {});
}

export async function getAuditLogs(filters: {
  adminId?: string;
  entity?: string;
  action?: AuditAction;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 50, ...where } = filters;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(where.adminId ? { adminId: where.adminId } : {}),
        ...(where.entity ? { entity: where.entity } : {}),
        ...(where.action ? { action: where.action as any } : {}),
      },
      include: {
        admin: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({
      where: {
        ...(where.adminId ? { adminId: where.adminId } : {}),
        ...(where.entity ? { entity: where.entity } : {}),
        ...(where.action ? { action: where.action as any } : {}),
      },
    }),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}
