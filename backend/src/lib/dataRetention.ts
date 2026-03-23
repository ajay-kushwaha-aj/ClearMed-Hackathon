/**
 * Data Retention & Erasure — Phase 4
 * DPDP Act 2023 compliance
 */

import prisma from './prisma';
import { logger } from './logger';
import { writeAuditLog } from './auditLog';
import * as fs from 'fs';
import * as path from 'path';

const RETENTION = {
  bills: 5 * 365 * 24 * 60 * 60 * 1000,
  reviews: 3 * 365 * 24 * 60 * 60 * 1000,
  symptomQueries: 365 * 24 * 60 * 60 * 1000,
  notifications: 90 * 24 * 60 * 60 * 1000,
  auditLogs: 7 * 365 * 24 * 60 * 60 * 1000,
};

export async function runRetentionPurge(): Promise<Record<string, number>> {
  const now = Date.now();
  const results: Record<string, number> = {};

  const sqResult = await prisma.symptomQuery.deleteMany({
    where: { createdAt: { lt: new Date(now - RETENTION.symptomQueries) } },
  });
  results.symptomQueries = sqResult.count;

  const nResult = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: new Date(now - RETENTION.notifications) },
      status: { in: ['SENT', 'FAILED', 'SKIPPED'] },
    },
  });
  results.notifications = nResult.count;

  const billResult = await prisma.bill.deleteMany({
    where: {
      status: 'BILL_REJECTED',
      createdAt: { lt: new Date(now - 90 * 24 * 60 * 60 * 1000) },
    },
  });
  results.rejectedBills = billResult.count;

  logger.info('[Retention] Purge complete', results);
  return results;
}

export async function processErasureRequest(
  userId: string,
  adminId: string
): Promise<{ success: boolean; itemsDeleted: Record<string, number> }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, itemsDeleted: {} };

  const deleted: Record<string, number> = {};

  try {
    const [pts, reviews, notifications, queries, bills] = await Promise.all([
      prisma.pointsTransaction.deleteMany({ where: { userId } }),
      prisma.patientFeedback.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.symptomQuery.deleteMany({ where: { userId } }),
      prisma.bill.updateMany({
        where: { uploadedBy: userId },
        data: { uploadedBy: null, notes: '[USER ERASED]' },
      }),
    ]);

    deleted.pointsTransactions = pts.count;
    deleted.reviews = reviews.count;
    deleted.notifications = notifications.count;
    deleted.symptomQueries = queries.count;
    deleted.billsAnonymized = bills.count;

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `erased_${userId}@clearmed.deleted`,
        phone: null,
        name: '[ERASED]',
        bio: null,
        city: null,
      },
    });

    // FIX: was 'BILL_PENDING', ErasureRequest.status is a plain String, default is 'PENDING'
    await prisma.erasureRequest.updateMany({
      where: { userId, status: 'PENDING' },
      data: { status: 'COMPLETED', processedAt: new Date(), processedBy: adminId },
    });

    await writeAuditLog({
      adminId,
      action: 'DATA_ERASURE',
      entity: 'user',
      entityId: userId,
      description: `Data erasure completed for user ${userId}`,
      meta: deleted,
    });

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const userDir = path.join(uploadsDir, userId);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
      deleted.filesDeleted = 1;
    }

    logger.info('[Erasure] User data erased', { userId, deleted });
    return { success: true, itemsDeleted: deleted };
  } catch (err) {
    logger.error('[Erasure] Failed', { userId, error: err });
    return { success: false, itemsDeleted: deleted };
  }
}

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [user, bills, reviews, points, queries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, city: true, createdAt: true, totalPoints: true } }),
    prisma.bill.findMany({ where: { uploadedBy: userId }, select: { totalCost: true, city: true, status: true, createdAt: true, hospital: { select: { name: true } }, treatment: { select: { name: true } } } }),
    prisma.patientFeedback.findMany({ where: { userId }, select: { overallScore: true, reviewText: true, createdAt: true, hospital: { select: { name: true } }, treatment: { select: { name: true } } } }),
    prisma.pointsTransaction.findMany({ where: { userId }, select: { activity: true, points: true, description: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.symptomQuery.count({ where: { userId } }),
  ]);

  return {
    exportDate: new Date().toISOString(),
    profile: user,
    bills: bills.length,
    reviews: reviews.length,
    totalPointsEarned: user?.totalPoints || 0,
    symptomSearches: queries,
    recentPointsActivity: points,
    retentionPolicy: 'Bills: 5 years | Reviews: 3 years | Data exported per DPDP Act 2023 Section 11',
  };
}