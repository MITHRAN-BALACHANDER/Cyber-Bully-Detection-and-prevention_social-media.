# Quick Start Guide

## ✅ Installation Complete!

Dependencies have been installed successfully. Follow these steps to start the application:

## 1. Start Required Services

### Option A: Using Docker (Recommended)
```bash
docker-compose up -d
```
This starts MongoDB on port 27017 and Redis on port 6379.

### Option B: Local Installation
Make sure you have MongoDB and Redis running locally:
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379`

## 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/socialhub

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 3. Run the Application

### Development Mode

Open **two terminal windows**:

**Terminal 1 - Next.js Server:**
```bash
npm run dev
```
This starts the web application on http://localhost:3000

**Terminal 2 - Socket.IO Server:**
```bash
npm run socket
```
This starts the real-time chat server on http://localhost:3001

**Or run both together:**
```bash
npm run dev:all
```

## 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 5. Create Your First Account

1. Click "Join Now" or navigate to `/register`
2. Fill in your details:
   - Full Name
   - Username (lowercase, no spaces)
   - Email
   - Password (min 8 characters)
   - Choose account type (User, Creator, or Recruiter)
3. Click "Create Account"
4. You'll be redirected to your feed!

## Available Features

Once logged in, you can:

- 📝 **Create Posts** - Text, images, videos, or articles
- 📸 **Share Media** - Upload photos and videos
- 💬 **Chat** - Real-time messaging with typing indicators
- 🤝 **Network** - Connect with other users
- 👤 **Profile** - Build your professional profile
- 📰 **Feed** - View chronological updates from your network

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:
```bash
# Find and kill the process using the port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different ports
PORT=3002 npm run dev
```

### MongoDB Connection Error

Make sure MongoDB is running:
```bash
# Check with Docker
docker ps

# Or check local MongoDB service
# Windows: Open Services and check "MongoDB Server"
```

### Redis Connection Error

Make sure Redis is running:
```bash
# Check with Docker
docker ps

# Or test connection
redis-cli ping
```

### Module Not Found Errors

Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Production Build

To build for production:

```bash
# Build the application
npm run build

# Start production server
npm start

# Start Socket.IO server (in another terminal)
npm run socket
```

## Next Steps

- Customize the theme in `tailwind.config.js`
- Configure Cloudinary for media uploads (optional)
- Add more features or customize existing ones
- Deploy to Vercel, AWS, or your preferred hosting

## Need Help?

Check the main [README.md](README.md) for:
- Complete API documentation
- Socket.IO events reference
- Architecture overview
- Contributing guidelines

---

Happy coding! 🚀
