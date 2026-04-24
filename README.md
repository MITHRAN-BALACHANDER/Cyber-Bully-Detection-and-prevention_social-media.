# Sentinel - Unified Social Networking Platform

A modular social networking platform combining the best features of Instagram, Twitter, WhatsApp, and LinkedIn into one unified experience.

## 🌟 Features

### 📸 Instagram-style Media
- Photo and video sharing with beautiful galleries
- Grid-based media display with lightbox viewing
- Like and comment on media posts
- Tag support for discoverability

### 🐦 Twitter-style Microblogging
- Text posts and articles
- Like, comment, and repost functionality
- Visibility controls (public, connections, private)
- Chronological feed (no algorithmic manipulation)

### 💬 WhatsApp-style Real-time Chat
- Instant messaging with real-time updates
- Online presence indicators
- Typing indicators
- Seen/read receipts
- Direct and group conversations

### 💼 LinkedIn-style Professional Profiles
- Professional profiles with experience and education
- Skills endorsements
- Connection requests and networking
- Role-based accounts (User, Creator, Recruiter, Admin)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Cache/Presence**: Redis
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Validation**: Zod

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected routes
│   │   ├── feed/           # Main feed page
│   │   ├── profile/        # User profiles
│   │   ├── chat/           # Real-time messaging
│   │   └── network/        # Connections management
│   ├── (auth)/             # Auth routes
│   │   ├── login/
│   │   └── register/
│   └── api/                # API Route Handlers
│       ├── auth/           # Authentication endpoints
│       ├── users/          # User management
│       ├── network/        # Connections
│       ├── posts/          # Microblogging
│       ├── media/          # Media sharing
│       ├── chat/           # Conversations & messages
│       └── feed/           # Unified feed
├── components/             # React components
│   ├── ui/                 # Reusable UI primitives
│   ├── PostCard.tsx        # Twitter-style post display
│   ├── MediaGrid.tsx       # Instagram-style media grid
│   ├── ChatWindow.tsx      # WhatsApp-style chat
│   ├── ProfileCard.tsx     # LinkedIn-style profile
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configurations
│   ├── db.ts               # MongoDB connection
│   ├── redis.ts            # Redis client & helpers
│   ├── auth.ts             # Auth utilities & middleware
│   └── validations.ts      # Zod schemas
├── models/                 # Mongoose models
│   ├── User.ts
│   ├── Post.ts
│   ├── Media.ts
│   ├── Connection.ts
│   ├── Conversation.ts
│   └── Message.ts
├── server/                 # Socket.IO server
│   └── socket-server.ts
├── store/                  # Zustand stores
│   ├── auth-store.ts
│   └── chat-store.ts
└── types/                  # TypeScript definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance (local or cloud)
- npm, yarn, or pnpm

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd social-media
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/sentinel

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Optional: Cloudinary for media uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Running the Application

1. **Development mode** (runs Next.js on port 3000):
```bash
npm run dev
```

2. **Socket.IO server** (runs on port 3001):
```bash
npm run socket
```

3. **Production build**:
```bash
npm run build
npm start
```

### Running with Docker (Optional)

```bash
# Start MongoDB and Redis
docker-compose up -d mongo redis

# Run the application
npm run dev
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/[username]` | Get user profile |
| PUT | `/api/users/[username]` | Update profile |
| POST | `/api/users/[username]/experience` | Add experience |
| POST | `/api/users/[username]/education` | Add education |

### Network
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/network/connect` | Send connection request |
| POST | `/api/network/accept` | Accept connection |
| GET | `/api/network/connections` | List connections |
| DELETE | `/api/network/[connectionId]` | Remove connection |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/[id]` | Get post |
| PUT | `/api/posts/[id]` | Update post |
| DELETE | `/api/posts/[id]` | Delete post |
| POST | `/api/posts/[id]/like` | Toggle like |
| POST | `/api/posts/[id]/comment` | Add comment |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media` | List all media |
| POST | `/api/media` | Upload media |
| GET | `/api/media/[id]` | Get media item |
| DELETE | `/api/media/[id]` | Delete media |
| POST | `/api/media/[id]/like` | Toggle like |
| POST | `/api/media/[id]/comment` | Add comment |
| GET | `/api/media/user/[username]` | User's media gallery |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversation` | List conversations |
| POST | `/api/chat/conversation` | Create conversation |
| POST | `/api/chat/group` | Create group chat |
| GET | `/api/chat/messages/[conversationId]` | Get messages |
| POST | `/api/chat/messages/[conversationId]` | Send message |
| PUT | `/api/chat/messages/[conversationId]/seen` | Mark as seen |

### Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feed` | Get unified chronological feed |

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ conversationId, content }` | Send message |
| `message:seen` | `{ conversationId, messageId }` | Mark seen |
| `typing:start` | `{ conversationId }` | Start typing |
| `typing:stop` | `{ conversationId }` | Stop typing |
| `join:conversation` | `conversationId` | Join room |
| `leave:conversation` | `conversationId` | Leave room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | New message received |
| `message:seen` | `{ messageId, userId }` | Message was seen |
| `user:typing` | `{ conversationId, userId }` | User is typing |
| `user:online` | `userId` | User came online |
| `user:offline` | `userId` | User went offline |

## 🔒 Authentication

The platform uses JWT tokens stored in HTTP-only cookies for security:

- Tokens are automatically included in API requests
- Protected routes redirect to login if unauthenticated
- Role-based access control for admin features

## 🎨 Theming

The platform uses a custom Tailwind theme with:

- Primary brand colors
- Surface colors for cards and backgrounds
- Semantic colors (success, warning, error)
- Custom animations (fade-in, slide-up)

## 📱 Responsive Design

The platform is fully responsive with:

- Mobile-first approach
- Adaptive layouts for tablet and desktop
- Touch-friendly interactions
- Native-like mobile experience

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
