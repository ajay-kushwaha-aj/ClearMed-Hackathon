import { CronJob } from 'cron';
import { buildAllTrends } from '../lib/costTrends';
import { runRetentionPurge } from '../lib/dataRetention';
import { sendPendingNotifications } from '../lib/notifications';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';

// Trend rebuild: 2am daily
export const trendRebuildJob = new CronJob('0 2 * * *', async () => {
  logger.info('[Cron] Nightly trend rebuild starting...');
  try {
    const n = await buildAllTrends();
    logger.info('[Cron] Trend rebuild done', { pairs: n });
  } catch (err) { logger.error('[Cron] Trend rebuild failed', { error: err }); }
}, null, false, 'Asia/Kolkata');

// Score recalc: 3am daily
export const scoreRecalcJob = new CronJob('0 3 * * *', async () => {
  logger.info('[Cron] Score recalculation starting...');
  try {
    const { upsertClearMedScore: upsertScore } = await import('../lib/scoreEngine');
    const pairs = await prisma.hospitalTreatment.findMany({ select: { hospitalId: true, treatmentId: true } });
    for (const { hospitalId, treatmentId } of pairs) {
      await upsertScore(hospitalId, treatmentId).catch(() => {});
    }
    logger.info('[Cron] Score recalc done', { pairs: pairs.length });
  } catch (err) { logger.error('[Cron] Score recalc failed', { error: err }); }
}, null, false, 'Asia/Kolkata');

// Send notifications: every 5 minutes
export const notificationJob = new CronJob('*/5 * * * *', async () => {
  await sendPendingNotifications(20);
}, null, false, 'Asia/Kolkata');

// Data retention purge: Sunday 1am
export const retentionJob = new CronJob('0 1 * * 0', async () => {
  logger.info('[Cron] Data retention purge starting...');
  try {
    const result = await runRetentionPurge();
    logger.info('[Cron] Retention purge done', result);
  } catch (err) { logger.error('[Cron] Retention purge failed', { error: err }); }
}, null, false, 'Asia/Kolkata');

// Post-treatment nudge: 4am daily
export const nudgeJob = new CronJob('0 4 * * *', async () => {
  // Check for users to nudge for reviews
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  const bills = await prisma.bill.findMany({
    where: { status: 'BILL_VERIFIED', createdAt: { gte: thirteenDaysAgo, lte: sevenDaysAgo }, uploadedBy: { not: null } },
    include: { hospital: { select: { name: true } }, treatment: { select: { name: true } } },
    take: 50,
  });
  logger.info('[Cron] Nudge check', { candidates: bills.length });
}, null, false, 'Asia/Kolkata');

export function startAllJobs() {
  if (process.env.NODE_ENV === 'production') {
    trendRebuildJob.start();
    scoreRecalcJob.start();
    notificationJob.start();
    retentionJob.start();
    nudgeJob.start();
    logger.info('[Cron] All 5 jobs started (production)');
  } else {
    logger.info('[Cron] Cron jobs disabled in dev — run scripts manually');
  }
}
