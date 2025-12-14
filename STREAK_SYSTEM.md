# Streak & Safety System

## Overview
A comprehensive gamification and safety system that rewards positive behavior and enforces community standards through progressive account locks.

## Features

### 1. Daily Streak System
- **Current Streak**: Tracks consecutive days of positive content posting
- **Longest Streak**: Records your personal best streak
- **Streak Display**: Shows on profile with a fire icon (🔥)
- **Auto-Reset**: Resets to 0 if you miss a day or violate community standards

### 2. Violation Tracking
- **Daily Counter**: Tracks violations within 24-hour periods
- **Total Count**: Lifetime violation counter
- **Consecutive Days**: Monitors patterns of repeated violations
- **Automatic Reset**: Daily violation count resets every 24 hours

### 3. Progressive Lock System
When a user accumulates **3 violations in 24 hours**, their account is locked:

| Lock Count | Duration | Description |
|------------|----------|-------------|
| 1st | 6 hours | First offense warning |
| 2nd | 12 hours | Repeated violation |
| 3rd | 24 hours | Pattern emerging |
| 4th | 48 hours | Serious concern |
| 5th | 7 days | Major violation |
| 6th+ | 30 days | Permanent behavior issue |

### 4. Content Moderation Integration
The system checks all posts and comments for:
- Offensive language
- Bullying and harassment
- Hate speech
- Violence
- Self-harm content
- Spam

## Database Schema Updates

### User Model Changes
```typescript
{
  // Streak tracking
  streak: {
    currentStreak: Number,
    longestStreak: Number,
    lastStreakUpdate: Date
  },
  
  // Violation tracking
  violations: {
    dailyCount: Number,
    totalCount: Number,
    lastViolationDate: Date,
    consecutiveViolationDays: Number
  },
  
  // Account lock
  accountLock: {
    isLocked: Boolean,
    lockUntil: Date,
    lockCount: Number,
    lockReason: String
  }
}
```

## API Endpoints

### GET /api/streak
Get current user's streak and safety information.

**Response:**
```json
{
  "streak": {
    "currentStreak": 5,
    "longestStreak": 12,
    "lastStreakUpdate": "2025-12-14T00:00:00.000Z"
  },
  "violations": {
    "dailyCount": 0,
    "totalCount": 2,
    "lastViolationDate": "2025-12-10T00:00:00.000Z",
    "consecutiveViolationDays": 0
  },
  "accountLock": {
    "isLocked": false,
    "lockUntil": null,
    "lockCount": 1,
    "lockReason": null
  }
}
```

### POST /api/posts
Create a new post with automatic streak update and violation checking.

**Error Response (Violation):**
```json
{
  "success": false,
  "error": "Post rejected: Content contains bullying language. Warning: 2/3 violations today.",
  "data": {
    "code": "CONTENT_MODERATION_FAILED",
    "flaggedCategories": ["bullying"],
    "dailyViolationCount": 2,
    "streakReset": true
  }
}
```

**Error Response (Account Locked):**
```json
{
  "success": false,
  "error": "Post rejected. Account locked for 6 hours due to 3 violations.",
  "data": {
    "code": "ACCOUNT_LOCKED",
    "accountLocked": true,
    "lockDuration": 6,
    "lockUntil": "2025-12-14T12:00:00.000Z",
    "remainingMinutes": 360
  }
}
```

## UI Components

### ProfileCard
- Displays current streak badge next to connections
- Shows fire icon with day count
- Gradient orange/yellow styling

### Settings Page - Streak & Safety Tab
Features two main sections:

**1. Your Streak**
- Current streak (large number with fire icon)
- Longest streak (personal record with shield icon)
- Information box explaining how streaks work

**2. Content Safety**
- Daily violation counter (0/3) with color coding:
  - Green: 0 violations
  - Yellow: 1 violation
  - Red: 2+ violations
- Total lifetime violations
- Account lock status
- Progressive lock system explanation

## Utility Functions

### checkAccountLock(userEmail)
Checks if an account is currently locked.

### recordViolation(userEmail, moderationResult)
Records a violation and locks account if threshold reached.

### updateStreak(userEmail)
Updates user's streak when they post clean content.

### resetDailyViolations()
Resets daily violation counts (for cron job).

## Behavior Flow

### Posting Clean Content
1. User creates post/comment
2. Content moderation check passes
3. `updateStreak()` is called
4. Streak increments by 1 day
5. Post is published successfully

### Posting Offensive Content
1. User creates post/comment
2. Content moderation check fails
3. `recordViolation()` is called
4. Streak resets to 0
5. Daily violation count increments
6. If daily count >= 3:
   - Account is locked
   - Lock duration is progressive
   - User receives detailed error message
7. Post/comment is rejected

### Account Lock Expiry
1. System checks `lockUntil` timestamp
2. If current time > `lockUntil`:
   - Account is automatically unlocked
   - Lock count remains for history
3. User can resume normal activity

## Testing

### Test Scenarios

1. **Building Streak**
   - Post clean content daily
   - Verify streak increments
   - Check profile displays streak badge

2. **Streak Reset**
   - Post offensive content
   - Verify streak resets to 0
   - Check violation count increases

3. **Account Lock**
   - Post 3 offensive items in 24 hours
   - Verify account locks for 6 hours
   - Attempt to post - should fail with lock error
   - Wait for expiry or adjust `lockUntil` in database
   - Verify unlock happens automatically

4. **Progressive Locks**
   - Repeat violation → lock cycle multiple times
   - Verify lock duration increases: 6h → 12h → 24h → 48h → 7d → 30d

## Migration Notes

### Updating Existing Users
Run this MongoDB update to initialize new fields for existing users:

```javascript
db.users.updateMany(
  {},
  {
    $set: {
      "streak.currentStreak": 0,
      "streak.longestStreak": 0,
      "streak.lastStreakUpdate": null,
      "violations.dailyCount": 0,
      "violations.totalCount": 0,
      "violations.lastViolationDate": null,
      "violations.consecutiveViolationDays": 0,
      "accountLock.isLocked": false,
      "accountLock.lockUntil": null,
      "accountLock.lockCount": 0,
      "accountLock.lockReason": null
    }
  }
)
```

## Future Enhancements

1. **Streak Rewards**
   - Badges for milestones (7, 30, 100, 365 days)
   - Special profile badges
   - Leaderboard

2. **Appeal System**
   - Allow users to appeal violations
   - Admin review dashboard

3. **Streak Recovery**
   - Allow one "freeze" per month
   - Grace period for technical issues

4. **Analytics Dashboard**
   - Community-wide safety statistics
   - Trending violation types
   - Effectiveness metrics

5. **Notifications**
   - Streak milestone celebrations
   - Warning before violations accumulate
   - Lock expiry reminders

## Support

For issues or questions about the streak system:
- Check the Settings → Streak & Safety tab for current status
- Review community guidelines
- Contact support for appeal requests
