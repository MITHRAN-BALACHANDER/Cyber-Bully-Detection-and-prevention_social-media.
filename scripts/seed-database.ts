/**
 * Database Seeding Script
 * Populates the database with dummy users, posts, connections, and interactions
 * Includes mixed content for testing content moderation
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-platform';

// Dummy users data with Tamil names
const users = [
  {
    email: 'rajesh.kumar@example.com',
    username: 'rajeshkumar',
    password: 'Password123!',
    name: 'Rajesh Kumar',
    headline: 'Full Stack Developer | Tech Enthusiast',
    bio: 'Passionate about building scalable web applications and learning new technologies.',
    location: 'Chennai, Tamil Nadu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
  },
  {
    email: 'priya.selvam@example.com',
    username: 'priyaselvam',
    password: 'Password123!',
    name: 'Priya Selvam',
    headline: 'UX Designer | Creative Problem Solver',
    bio: 'Crafting beautiful and intuitive user experiences. Coffee addict and design enthusiast.',
    location: 'Coimbatore, Tamil Nadu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    skills: ['Figma', 'Adobe XD', 'UI/UX', 'Design Systems', 'Prototyping'],
  },
  {
    email: 'karthik.raman@example.com',
    username: 'karthikraman',
    password: 'Password123!',
    name: 'Karthik Raman',
    headline: 'Product Manager | Startup Advisor',
    bio: 'Helping teams build products that users love. Former founder, current PM at a growing startup.',
    location: 'Bangalore, Karnataka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik',
    skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics', 'Leadership'],
  },
  {
    email: 'deepa.murthy@example.com',
    username: 'deepamurthy',
    password: 'Password123!',
    name: 'Deepa Murthy',
    headline: 'Data Scientist | AI/ML Engineer',
    bio: 'Turning data into insights. Specializing in machine learning and predictive analytics.',
    location: 'Hyderabad, Telangana',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepa',
    skills: ['Python', 'TensorFlow', 'Data Analysis', 'Machine Learning', 'SQL'],
  },
  {
    email: 'arun.krishnan@example.com',
    username: 'arunkrishnan',
    password: 'Password123!',
    name: 'Arun Krishnan',
    headline: 'DevOps Engineer | Cloud Architecture Expert',
    bio: 'Building and scaling cloud infrastructure. Kubernetes enthusiast and automation advocate.',
    location: 'Pune, Maharashtra',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
  },
  {
    email: 'lakshmi.venkat@example.com',
    username: 'lakshmivenkat',
    password: 'Password123!',
    name: 'Lakshmi Venkataraman',
    headline: 'Marketing Manager | Brand Strategist',
    bio: 'Creating compelling brand stories and driving growth through creative marketing.',
    location: 'Mumbai, Maharashtra',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Social Media', 'Analytics'],
  },
  {
    email: 'vijay.anand@example.com',
    username: 'vijayanand',
    password: 'Password123!',
    name: 'Vijay Anand',
    headline: 'Cybersecurity Specialist | Ethical Hacker',
    bio: 'Protecting digital assets and fighting cyber threats. CISSP certified security professional.',
    location: 'Delhi, NCR',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay',
    skills: ['Penetration Testing', 'Network Security', 'Compliance', 'Risk Management', 'SIEM'],
  },
  {
    email: 'divya.subramanian@example.com',
    username: 'divyasubramanian',
    password: 'Password123!',
    name: 'Divya Subramanian',
    headline: 'Content Creator | Tech Blogger',
    bio: 'Writing about tech trends and startups. Helping people understand complex technology.',
    location: 'Madurai, Tamil Nadu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya',
    skills: ['Content Writing', 'Blogging', 'SEO', 'Social Media', 'Video Editing'],
  },
];

// Post content with mixed speech (clean, edgy, and potentially flaggable)
const postContents = [
  // Clean posts
  {
    content: 'Just launched my new portfolio website! Check it out and let me know what you think. Feedback appreciated! 🚀',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Amazing conference today! Learned so much about the future of AI and machine learning. The keynote speaker was inspiring.',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Coffee and code - the perfect combination for a productive Saturday morning ☕💻',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Excited to announce that I\'ve joined a new team! Looking forward to building amazing products together.',
    type: 'text' as const,
    visibility: 'connections' as const,
  },
  {
    content: 'Just hit 1000 followers! Thank you all for your support. Here\'s to the next milestone 🎉',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Working on a side project that uses React and Node.js. Anyone interested in collaborating?',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  // Slightly edgy but acceptable
  {
    content: 'Feeling frustrated with this bug that\'s been haunting me for 3 hours. Time for a break and some fresh air.',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Hot take: Tabs are better than spaces. Fight me in the comments 😄',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Another meeting that could have been an email. Corporate life in a nutshell.',
    type: 'text' as const,
    visibility: 'connections' as const,
  },
  // Testing content moderation (mild profanity)
  {
    content: 'This code is driving me crazy! Why the heck won\'t this compile?!',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Damn, that was a tough interview. Fingers crossed I hear back soon!',
    type: 'text' as const,
    visibility: 'connections' as const,
  },
  // Positive engagement posts
  {
    content: 'Huge shoutout to my team for shipping this feature on time! You all are incredible 👏',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Just finished reading "Clean Code" by Robert Martin. Highly recommend it to all developers!',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Looking for recommendations on the best VS Code extensions for productivity. What are your favorites?',
    type: 'text' as const,
    visibility: 'public' as const,
  },
  {
    content: 'Celebrating 5 years in tech today! It\'s been an amazing journey filled with learning and growth.',
    type: 'text' as const,
    visibility: 'public' as const,
  },
];

// Comments with varied content
const commentTexts = [
  'Great post! Thanks for sharing.',
  'This is really helpful, appreciate it!',
  'I totally agree with this perspective.',
  'Congrats! Well deserved.',
  'Love this! Keep up the great work.',
  'Interesting take on this topic.',
  'Thanks for the recommendation!',
  'I had the same experience.',
  'This is exactly what I needed to hear today.',
  'Awesome work! Very inspiring.',
  'Could you share more details about this?',
  'Following for updates!',
  'This made my day, thank you!',
  'Really insightful perspective.',
  'I learned something new today!',
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('posts').deleteMany({});
    await db.collection('connections').deleteMany({});
    await db.collection('comments').deleteMany({});
    await db.collection('likes').deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers: any[] = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date(),
      };
      const result = await db.collection('users').insertOne(user);
      createdUsers.push({ ...user, _id: result.insertedId });
      console.log(`  ✓ Created user: ${userData.name} (@${userData.username})`);
    }
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Create connections between users
    console.log('🔗 Creating connections...');
    const connections: any[] = [];
    for (let i = 0; i < createdUsers.length; i++) {
      // Each user connects with 2-4 random other users
      const numConnections = 2 + Math.floor(Math.random() * 3);
      const connectedIndices = new Set<number>();
      
      while (connectedIndices.size < numConnections) {
        const randomIndex = Math.floor(Math.random() * createdUsers.length);
        if (randomIndex !== i) {
          connectedIndices.add(randomIndex);
        }
      }

      for (const connectedIndex of Array.from(connectedIndices)) {
        // Check if connection already exists (to avoid duplicates)
        const exists = connections.some(
          (c) =>
            (c.requesterId.equals(createdUsers[i]._id) && c.recipientId.equals(createdUsers[connectedIndex]._id)) ||
            (c.requesterId.equals(createdUsers[connectedIndex]._id) && c.recipientId.equals(createdUsers[i]._id))
        );

        if (!exists) {
          const connection = {
            requesterId: createdUsers[i]._id,
            recipientId: createdUsers[connectedIndex]._id,
            status: 'accepted' as const,
            createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          };
          connections.push(connection);
        }
      }
    }

    if (connections.length > 0) {
      await db.collection('connections').insertMany(connections);
      console.log(`✅ Created ${connections.length} connections\n`);
    }

    // Create posts
    console.log('📝 Creating posts...');
    const createdPosts = [];
    for (let i = 0; i < 30; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomContent = postContents[Math.floor(Math.random() * postContents.length)];
      
      const post = {
        authorId: randomUser._id,
        content: randomContent.content,
        type: randomContent.type,
        visibility: randomContent.visibility,
        likes: [],
        comments: [],
        shares: [],
        createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };

      const result = await db.collection('posts').insertOne(post);
      createdPosts.push({ ...post, _id: result.insertedId });
    }
    console.log(`✅ Created ${createdPosts.length} posts\n`);

    // Create likes
    console.log('❤️  Creating likes...');
    let likeCount = 0;
    for (const post of createdPosts) {
      // Each post gets 1-5 random likes
      const numLikes = 1 + Math.floor(Math.random() * 5);
      const likedBy = new Set<string>();
      
      while (likedBy.size < numLikes && likedBy.size < createdUsers.length) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        if (!likedBy.has(randomUser._id.toString())) {
          likedBy.add(randomUser._id.toString());
          
          await db.collection('posts').updateOne(
            { _id: post._id },
            { $addToSet: { likes: randomUser._id } }
          );
          likeCount++;
        }
      }
    }
    console.log(`✅ Created ${likeCount} likes\n`);

    // Create comments
    console.log('💬 Creating comments...');
    let commentCount = 0;
    for (const post of createdPosts) {
      // Each post gets 0-3 random comments
      const numComments = Math.floor(Math.random() * 4);
      
      for (let i = 0; i < numComments; i++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const randomCommentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        
        const comment = {
          postId: post._id,
          authorId: randomUser._id,
          content: randomCommentText,
          likes: [],
          createdAt: new Date(post.createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        };

        const result = await db.collection('comments').insertOne(comment);
        
        await db.collection('posts').updateOne(
          { _id: post._id },
          { $addToSet: { comments: result.insertedId } }
        );
        
        commentCount++;
      }
    }
    console.log(`✅ Created ${commentCount} comments\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Connections: ${connections.length}`);
    console.log(`   - Posts: ${createdPosts.length}`);
    console.log(`   - Likes: ${likeCount}`);
    console.log(`   - Comments: ${commentCount}`);
    console.log('\n✨ You can now log in with any of these accounts:');
    console.log('   Email: john.doe@example.com');
    console.log('   Password: Password123!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seeding function
seedDatabase();
