/**
 * Notification Service — Phase 4
 * Email (Nodemailer/SMTP) + SMS (Twilio/MSG91) + Push placeholder
 * Queues all notifications in DB; background worker processes them
 */

import nodemailer from 'nodemailer';
import prisma from './prisma';
import { logger } from './logger';

// ── Email transport ───────────────────────────────────────────────────────

function getMailTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Email templates ───────────────────────────────────────────────────────

const TEMPLATES = {
  BILL_VERIFIED: (data: { hospitalName: string; treatmentName: string; points: number }) => ({
    subject: `✅ Your bill for ${data.treatmentName} has been verified!`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#0e87ef;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h2 style="color:white;margin:0;font-size:22px">Bill Verified ✅</h2>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
          <p style="color:#374151">Your bill for <strong>${data.treatmentName}</strong> at <strong>${data.hospitalName}</strong> has been verified by our team.</p>
          <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
            <p style="color:#0e87ef;font-size:24px;font-weight:900;margin:0">+${data.points} pts</p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0">ClearMed Points earned</p>
          </div>
          <p style="color:#6b7280;font-size:13px">Thank you for contributing to healthcare transparency in India. Your data helps thousands of patients make informed decisions.</p>
          <a href="${process.env.FRONTEND_URL}/contribute" style="display:inline-block;background:#0e87ef;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View My Profile</a>
        </div>
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px">ClearMed · Transparent Healthcare for Every Indian<br>To unsubscribe, <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color:#9ca3af">click here</a></p>
      </div>`,
  }),

  BILL_REJECTED: (data: { treatmentName: string; reason?: string }) => ({
    subject: `Bill upload could not be verified`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#374151">Bill Verification Update</h2>
        <p>Unfortunately, your bill for <strong>${data.treatmentName}</strong> could not be verified at this time.</p>
        ${data.reason ? `<p style="background:#fef3c7;padding:12px;border-radius:8px;color:#92400e">Reason: ${data.reason}</p>` : ''}
        <p>You can re-upload with a clearer image or contact our support team for help.</p>
        <a href="${process.env.FRONTEND_URL}/upload" style="display:inline-block;background:#0e87ef;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Re-upload Bill</a>
      </div>`,
  }),

  REVIEW_POSTED: (data: { hospitalName: string; reviewText?: string }) => ({
    subject: 'Your review has been posted on ClearMed',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#374151">Review Posted 💬</h2>
        <p>Your review for <strong>${data.hospitalName}</strong> is now live on ClearMed.</p>
        ${data.reviewText ? `<blockquote style="border-left:3px solid #0e87ef;padding-left:12px;color:#6b7280;font-style:italic">${data.reviewText.slice(0, 200)}${data.reviewText.length > 200 ? '...' : ''}</blockquote>` : ''}
        <p>Your review has earned you <strong>30 ClearMed Points</strong>. Keep contributing!</p>
      </div>`,
  }),

  POINTS_EARNED: (data: { points: number; reason: string; total: number }) => ({
    subject: `You earned ${data.points} ClearMed Points!`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#374151">Points Earned 🎉</h2>
        <p>${data.reason}</p>
        <div style="background:#f0f9ff;border-radius:8px;padding:16px;text-align:center">
          <p style="color:#0e87ef;font-size:28px;font-weight:900;margin:0">+${data.points}</p>
          <p style="color:#6b7280;font-size:13px">Total: ${data.total} pts</p>
        </div>
      </div>`,
  }),
};

// ── Queue notification ────────────────────────────────────────────────────

type NotifType = 'BILL_VERIFIED' | 'BILL_REJECTED' | 'REVIEW_POSTED' | 'POINTS_EARNED' | 'REFERRAL_JOINED' | 'WEEKLY_DIGEST';

export async function queueNotification(
  userId: string,
  type: NotifType,
  data: Record<string, unknown>,
  channels: ('EMAIL' | 'SMS')[] = ['EMAIL']
): Promise<void> {
  const template = (TEMPLATES as Record<string, Function>)[type]?.(data);
  if (!template) return;

  await prisma.notification.createMany({
    data: channels.map(channel => ({
      userId,
      type: type as any,
      channel: channel as any,
      subject: template.subject,
      body: template.html,
      refId: data.refId as string | undefined,
    })),
  }).catch(() => { });
}

// ── Send pending notifications (called by cron/worker) ────────────────────
// FIX: was 'NOTIF_PENDING', correct enum value is 'PENDING'
export async function sendPendingNotifications(limit = 50): Promise<void> {
  const pending = await prisma.notification.findMany({
    where: { status: 'PENDING', channel: 'EMAIL' },
    include: { user: { select: { email: true, name: true } } } as any,
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  const transport = getMailTransport();
  if (!transport) {
    logger.warn('[Notifications] SMTP not configured — skipping email send');
    return;
  }

  const FROM = `"ClearMed" <${process.env.SMTP_FROM || 'noreply@clearmed.in'}>`;

  for (const notif of pending) {
    const userAny = (notif as any).user;
    if (!userAny?.email) {
      await prisma.notification.update({ where: { id: notif.id }, data: { status: 'SKIPPED' } });
      continue;
    }

    try {
      await transport.sendMail({
        from: FROM,
        to: userAny.email,
        subject: notif.subject || 'ClearMed Notification',
        html: notif.body,
      });

      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed';
      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: 'FAILED', error: msg },
      });
      logger.error('[Notifications] Send failed', { notifId: notif.id, error: msg });
    }
  }
}

// ── SMS via MSG91 ─────────────────────────────────────────────────────────

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'CLRMED';

  if (!apiKey) {
    logger.warn('[SMS] MSG91 not configured');
    return false;
  }

  try {
    const res = await fetch(`https://api.msg91.com/api/v2/sendsms`, {
      method: 'POST',
      headers: { authkey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: senderId,
        route: '4',
        country: '91',
        sms: [{ message, to: [phone.replace('+91', '')] }],
      }),
    });
    const data = await res.json() as { type?: string };
    return data.type === 'success';
  } catch (err) {
    logger.error('[SMS] Send failed', { phone, error: err });
    return false;
  }
}