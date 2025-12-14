/**
 * Streak API Route
 * Handles streak updates and checking
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/streak - Get current user's streak info
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const user = await User.findOne({ email: currentUser.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if streak needs to be reset
    const now = new Date();
    const lastUpdate = user.streak?.lastStreakUpdate;
    
    if (lastUpdate) {
      const daysSinceUpdate = Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
      
      // If more than 1 day has passed, reset streak
      if (daysSinceUpdate > 1) {
        user.streak = {
          currentStreak: 0,
          longestStreak: user.streak?.longestStreak || 0,
          lastStreakUpdate: null,
        };
        await user.save();
      }
    }

    return NextResponse.json({
      streak: user.streak || { currentStreak: 0, longestStreak: 0, lastStreakUpdate: null },
      violations: user.violations || { dailyCount: 0, totalCount: 0, lastViolationDate: null, consecutiveViolationDays: 0 },
      accountLock: user.accountLock || { isLocked: false, lockUntil: null, lockCount: 0, lockReason: null },
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}

// POST /api/streak - Update streak (called daily when user posts without violations)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const user = await User.findOne({ email: currentUser.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const lastUpdate = user.streak?.lastStreakUpdate;
    
    // Check if already updated today
    if (lastUpdate) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastUpdateDate = new Date(new Date(lastUpdate).getFullYear(), new Date(lastUpdate).getMonth(), new Date(lastUpdate).getDate());
      
      if (today.getTime() === lastUpdateDate.getTime()) {
        return NextResponse.json({ 
          message: 'Streak already updated today',
          streak: user.streak 
        });
      }
    }

    // Update streak
    const currentStreak = (user.streak?.currentStreak || 0) + 1;
    const longestStreak = Math.max(currentStreak, user.streak?.longestStreak || 0);

    user.streak = {
      currentStreak,
      longestStreak,
      lastStreakUpdate: now,
    };

    await user.save();

    return NextResponse.json({
      message: 'Streak updated successfully',
      streak: user.streak,
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}
