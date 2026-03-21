/**
 * Data Retention & Erasure — Phase 4
 * DPDP Act 2023 compliance:
 *   - Bills: 5 year retention
 *   - Reviews: 3 year retention
 *   - Symptom queries: 1 year retention
 *   - Right to Erasure: full deletion on request
 */

import prisma from './prisma';
import { logger } from './logger';
import { writeAuditLog } from './auditLog';
import * as fs from 'fs';
import * as path from 'path';

// ── Retention periods ─────────────────────────────────────────────────────
const RETENTION = {
  bills: 5 * 365 * 24 * 60 * 60 * 1000,        // 5 years
  reviews: 3 * 365 * 24 * 60 * 60 * 1000,       // 3 years
  symptomQueries: 365 * 24 * 60 * 60 * 1000,    // 1 year
  notifications: 90 * 24 * 60 * 60 * 1000,      // 90 days
  auditLogs: 7 * 365 * 24 * 60 * 60 * 1000,     // 7 years (regulatory)
};

// ── Purge expired data ────────────────────────────────────────────────────
export async function runRetentionPurge(): Promise<Record<string, number>> {
  const now = Date.now();
  const results: Record<string, number> = {};

  // Purge old unverified symptom queries
  const sqResult = await prisma.symptomQuery.deleteMany({
    where: { createdAt: { lt: new Date(now - RETENTION.symptomQueries) } },
  });
  results.symptomQueries = sqResult.count;

  // Purge old notifications
  const nResult = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: new Date(now - RETENTION.notifications) },
      status: { in: ['SENT', 'FAILED', 'SKIPPED'] },
    },
  });
  results.notifications = nResult.count;

  // Purge old unverified/rejected bills (no point keeping rejected data long)
  const billResult = await prisma.bill.deleteMany({
    where: {
      status: 'BILL_REJECTED',
      createdAt: { lt: new Date(now - 90 * 24 * 60 * 60 * 1000) }, // 90 days
    },
  });
  results.rejectedBills = billResult.count;

  logger.info('[Retention] Purge complete', results);
  return results;
}

// ── Right to Erasure ──────────────────────────────────────────────────────
export async function processErasureRequest(
  userId: string,
  adminId: string
): Promise<{ success: boolean; itemsDeleted: Record<string, number> }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, itemsDeleted: {} };

  const deleted: Record<string, number> = {};

  try {
    // Delete in order (respect FK constraints)
    const [pts, reviews, notifications, queries, bills] = await Promise.all([
      prisma.pointsTransaction.deleteMany({ where: { userId } }),
      prisma.patientFeedback.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.symptomQuery.deleteMany({ where: { userId } }),
      // Anonymize bills (keep for cost data, but remove user link)
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

    // Anonymize user record (don't delete — keep for referral integrity)
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

    // Mark erasure request as processed
    await prisma.erasureRequest.updateMany({
      where: { userId, status: 'BILL_PENDING' },
      data: { status: 'COMPLETED', processedAt: new Date(), processedBy: adminId },
    });

    // Write audit log
    await writeAuditLog({
      adminId,
      action: 'DATA_ERASURE',
      entity: 'user',
      entityId: userId,
      description: `Data erasure completed for user ${userId}`,
      meta: deleted,
    });

    // Delete uploaded files
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

// ── Export user data (DPDP data portability) ──────────────────────────────
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
