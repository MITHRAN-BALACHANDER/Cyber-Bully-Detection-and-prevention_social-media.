/**
 * Violation Tracking and Account Locking Utility
 * Handles progressive locking system for users who violate community standards
 */

import User from '@/models/User';
import { ModerationResult } from './content-moderation';

// Progressive lock durations in hours
const LOCK_DURATIONS = [
  6,   // First lock: 6 hours
  12,  // Second lock: 12 hours
  24,  // Third lock: 24 hours
  48,  // Fourth lock: 48 hours
  168, // Fifth lock: 7 days
  720, // Sixth+ lock: 30 days
];

const DAILY_VIOLATION_THRESHOLD = 3; // Lock after 3 violations in a day

/**
 * Check if a user's account is currently locked
 */
export async function checkAccountLock(userEmail: string): Promise<{
  isLocked: boolean;
  lockUntil: Date | null;
  lockReason: string | null;
  remainingMinutes: number;
}> {
  const user = await User.findOne({ email: userEmail });
  
  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  
  // Initialize accountLock if it doesn't exist
  if (!user.accountLock) {
    user.accountLock = {
      isLocked: false,
      lockUntil: null,
      lockCount: 0,
      lockReason: null,
    };
  }

  const accountLock = user.accountLock;

  // Check if lock has expired
  if (accountLock.isLocked && accountLock.lockUntil) {
    if (now >= new Date(accountLock.lockUntil)) {
      // Unlock the account
      user.accountLock = {
        isLocked: false,
        lockUntil: null,
        lockCount: accountLock.lockCount,
        lockReason: null,
      };
      await user.save();
      
      return {
        isLocked: false,
        lockUntil: null,
        lockReason: null,
        remainingMinutes: 0,
      };
    }

    // Still locked
    const remainingMs = new Date(accountLock.lockUntil).getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

    return {
      isLocked: true,
      lockUntil: accountLock.lockUntil,
      lockReason: accountLock.lockReason,
      remainingMinutes,
    };
  }

  return {
    isLocked: false,
    lockUntil: null,
    lockReason: null,
    remainingMinutes: 0,
  };
}

/**
 * Record a content violation and potentially lock the account
 */
export async function recordViolation(
  userEmail: string,
  moderationResult: ModerationResult
): Promise<{
  violationRecorded: boolean;
  dailyCount: number;
  accountLocked: boolean;
  lockDuration?: number;
  lockUntil?: Date;
  streakReset: boolean;
}> {
  const user = await User.findOne({ email: userEmail });
  
  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Initialize violations if not exists
  if (!user.violations) {
    user.violations = {
      dailyCount: 0,
      totalCount: 0,
      lastViolationDate: null,
      consecutiveViolationDays: 0,
    };
  }

  // Check if this is a new day
  let lastViolationDate = user.violations.lastViolationDate;
  let isNewDay = true;
  
  if (lastViolationDate) {
    const lastDate = new Date(
      new Date(lastViolationDate).getFullYear(),
      new Date(lastViolationDate).getMonth(),
      new Date(lastViolationDate).getDate()
    );
    isNewDay = today.getTime() !== lastDate.getTime();
  }

  // Reset daily count if new day
  if (isNewDay) {
    user.violations.dailyCount = 0;
    
    // Check if violations are consecutive days
    if (lastViolationDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastDateObj = new Date(
        new Date(lastViolationDate).getFullYear(),
        new Date(lastViolationDate).getMonth(),
        new Date(lastViolationDate).getDate()
      );
      
      if (lastDateObj.getTime() === yesterday.getTime()) {
        user.violations.consecutiveViolationDays = (user.violations.consecutiveViolationDays || 0) + 1;
      } else {
        user.violations.consecutiveViolationDays = 0;
      }
    }
  }

  // Increment violation counts
  user.violations.dailyCount += 1;
  user.violations.totalCount = (user.violations.totalCount || 0) + 1;
  user.violations.lastViolationDate = now;

  // Reset streak to 0
  if (user.streak) {
    user.streak.currentStreak = 0;
  }

  const dailyCount = user.violations.dailyCount;
  let accountLocked = false;
  let lockDuration = 0;
  let lockUntil: Date | undefined;

  // Check if we should lock the account
  if (dailyCount >= DAILY_VIOLATION_THRESHOLD) {
    // Initialize accountLock if not exists
    if (!user.accountLock) {
      user.accountLock = {
        isLocked: false,
        lockUntil: null,
        lockCount: 0,
        lockReason: null,
      };
    }

    // Get lock duration based on lock count (progressive)
    const lockCount = user.accountLock.lockCount || 0;
    const durationHours = LOCK_DURATIONS[Math.min(lockCount, LOCK_DURATIONS.length - 1)];
    lockDuration = durationHours;
    
    // Calculate lock until time
    lockUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    // Lock the account
    user.accountLock = {
      isLocked: true,
      lockUntil,
      lockCount: lockCount + 1,
      lockReason: `Account locked for ${durationHours} hours due to ${dailyCount} violations in 24 hours. Violations: ${moderationResult.reasons.join(', ')}`,
    };

    accountLocked = true;

    // Reset daily count since we're locking
    user.violations.dailyCount = 0;
  }

  await user.save();

  return {
    violationRecorded: true,
    dailyCount,
    accountLocked,
    lockDuration,
    lockUntil,
    streakReset: true,
  };
}

/**
 * Update user's streak (call this when user posts clean content)
 */
export async function updateStreak(userEmail: string): Promise<{
  updated: boolean;
  currentStreak: number;
  longestStreak: number;
  message: string;
}> {
  const user = await User.findOne({ email: userEmail });
  
  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Initialize streak if not exists
  if (!user.streak) {
    user.streak = {
      currentStreak: 0,
      longestStreak: 0,
      lastStreakUpdate: null,
    };
  }

  // Check if already updated today
  if (user.streak.lastStreakUpdate) {
    const lastUpdateDate = new Date(
      new Date(user.streak.lastStreakUpdate).getFullYear(),
      new Date(user.streak.lastStreakUpdate).getMonth(),
      new Date(user.streak.lastStreakUpdate).getDate()
    );

    if (today.getTime() === lastUpdateDate.getTime()) {
      return {
        updated: false,
        currentStreak: user.streak.currentStreak,
        longestStreak: user.streak.longestStreak,
        message: 'Streak already updated today',
      };
    }

    // Check if streak should be reset (more than 1 day gap)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastUpdateDate.getTime() !== yesterday.getTime()) {
      // Gap detected, reset streak
      user.streak.currentStreak = 0;
    }
  }

  // Increment streak
  user.streak.currentStreak += 1;
  user.streak.longestStreak = Math.max(
    user.streak.currentStreak,
    user.streak.longestStreak
  );
  user.streak.lastStreakUpdate = now;

  await user.save();

  return {
    updated: true,
    currentStreak: user.streak.currentStreak,
    longestStreak: user.streak.longestStreak,
    message: `Streak updated to ${user.streak.currentStreak} days!`,
  };
}

/**
 * Reset daily violation count (called by a daily cron job)
 */
export async function resetDailyViolations(): Promise<void> {
  await User.updateMany(
    {},
    {
      $set: {
        'violations.dailyCount': 0,
      },
    }
  );
}
