/**
 * Migration Script: Initialize Streak and Safety Fields
 * Run this to update all existing users with the new streak and safety fields
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media';

async function migrateUsers() {
  console.log('🔄 Starting user migration for streak and safety fields...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Count users that need migration
    const usersToMigrate = await usersCollection.countDocuments({
      $or: [
        { streak: { $exists: false } },
        { violations: { $exists: false } },
        { accountLock: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${usersToMigrate} users to migrate\n`);

    if (usersToMigrate === 0) {
      console.log('✨ All users already have the required fields!\n');
      return;
    }

    // Update users that don't have streak field
    const streakResult = await usersCollection.updateMany(
      { streak: { $exists: false } },
      {
        $set: {
          'streak': {
            currentStreak: 0,
            longestStreak: 0,
            lastStreakUpdate: null,
          }
        }
      }
    );
    console.log(`   ✓ Initialized streak for ${streakResult.modifiedCount} users`);

    // Update users that don't have violations field
    const violationsResult = await usersCollection.updateMany(
      { violations: { $exists: false } },
      {
        $set: {
          'violations': {
            dailyCount: 0,
            totalCount: 0,
            lastViolationDate: null,
            consecutiveViolationDays: 0,
          }
        }
      }
    );
    console.log(`   ✓ Initialized violations for ${violationsResult.modifiedCount} users`);

    // Update users that don't have accountLock field
    const lockResult = await usersCollection.updateMany(
      { accountLock: { $exists: false } },
      {
        $set: {
          'accountLock': {
            isLocked: false,
            lockUntil: null,
            lockCount: 0,
            lockReason: null,
          }
        }
      }
    );
    console.log(`   ✓ Initialized accountLock for ${lockResult.modifiedCount} users`);

    const totalModified = streakResult.modifiedCount + violationsResult.modifiedCount + lockResult.modifiedCount;
    console.log(`\n✅ Migration completed!`);
    console.log(`   - Total fields initialized: ${totalModified}\n`);

    // Verify the migration
    const verifyCount = await usersCollection.countDocuments({
      'streak': { $exists: true },
      'violations': { $exists: true },
      'accountLock': { $exists: true }
    });

    console.log(`✅ Verification: ${verifyCount} users now have all required fields\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('🎉 Migration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
