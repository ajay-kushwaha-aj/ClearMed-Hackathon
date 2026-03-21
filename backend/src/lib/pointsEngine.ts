/**
 * ClearMed Points Engine — Phase 3
 */
import prisma from './prisma';

export const POINTS = {
  BILL_UPLOAD:       50,
  BILL_VERIFIED:     100,
  OCR_BILL:          25,   // extra for uploading with file
  REFERRAL_JOIN:     200,
  REVIEW_POSTED:     30,
  DAILY_LOGIN:       5,
  PROFILE_COMPLETE:  50,
} as const;

export const BADGES = [
  { id: 'first_bill',   label: 'First Contribution',   icon: '🏥', minPoints: 50,   trigger: 'bill_count_1'  },
  { id: 'data_hero',    label: 'Data Hero',             icon: '⭐', minPoints: 500,  trigger: 'bill_count_5'  },
  { id: 'transparency', label: 'Transparency Champion', icon: '🔍', minPoints: 1000, trigger: 'bill_count_10' },
  { id: 'community',    label: 'Community Builder',     icon: '🤝', minPoints: 2000, trigger: 'referral_3'    },
  { id: 'legend',       label: 'ClearMed Legend',       icon: '🏆', minPoints: 5000, trigger: 'bill_count_25' },
] as const;

export type PointsActivity = keyof typeof POINTS;

export async function awardPoints(
  userId: string,
  activity: PointsActivity,
  refId?: string,
  description?: string
): Promise<{ newTotal: number; pointsEarned: number }> {
  const pts = POINTS[activity];

  const [, updatedUser] = await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: {
        userId, activity, points: pts,
        description: description || activityLabel(activity),
        refId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pts } },
      select: { points: true },
    }),
  ]);

  return { newTotal: updatedUser.points, pointsEarned: pts };
}

function activityLabel(activity: PointsActivity): string {
  const labels: Record<PointsActivity, string> = {
    BILL_UPLOAD: 'Uploaded a hospital bill',
    BILL_VERIFIED: 'Bill verified by admin',
    OCR_BILL: 'Bill uploaded with document',
    REFERRAL_JOIN: 'Friend joined via referral',
    REVIEW_POSTED: 'Posted a hospital review',
    DAILY_LOGIN: 'Daily login',
    PROFILE_COMPLETE: 'Completed profile',
  };
  return labels[activity] || activity;
}

export async function getUserBadges(userId: string): Promise<typeof BADGES[number][]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
  if (!user) return [];
  return BADGES.filter(b => user.points >= b.minPoints);
}

export async function createReferral(referrerId: string, referredId: string, code: string) {
  const referral = await prisma.referral.create({
    data: { referrerId, referredId, code, pointsEarned: POINTS.REFERRAL_JOIN },
  });
  // Award to both
  await awardPoints(referrerId, 'REFERRAL_JOIN', referredId, 'Friend joined using your referral');
  await awardPoints(referredId, 'BILL_UPLOAD', referrerId, 'Welcome bonus — joined via referral');
  return referral;
}
