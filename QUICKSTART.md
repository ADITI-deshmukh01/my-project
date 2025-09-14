# 🚀 Quick Start Guide - CampusPlacement Portal

Get your CampusPlacement Portal up and running in minutes! This guide will walk you through the essential steps to get started.

## ⚡ Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **MongoDB** (version 6.0 or higher)
- **Git** (for cloning the repository)

### Installing Prerequisites

#### Windows
```bash
# Install Node.js from: https://nodejs.org/
# Install MongoDB from: https://www.mongodb.com/try/download/community
# Install Git from: https://git-scm.com/download/win
```

#### macOS
```bash
# Using Homebrew
brew install node
brew install mongodb-community
brew install git
```

#### Linux (Ubuntu/Debian)
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Git
sudo apt-get install git
```

## 🎯 Quick Start (5 minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repository-url>
cd campus-placement-portal

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit the .env file with your settings
# At minimum, set these values:
# - JWT_SECRET (generate a random string)
# - MONGODB_URI (your MongoDB connection string)
# - OPENAI_API_KEY (if you want chatbot functionality)
```

**Quick JWT Secret Generation:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Or run in foreground
mongod --dbpath /data/db
```

### 4. Start the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Access Your Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🐳 Docker Quick Start (Even Faster!)

If you prefer Docker, you can get started in just 2 minutes:

### 1. Prerequisites
- **Docker Desktop** installed and running
- **Docker Compose** (usually included with Docker Desktop)

### 2. One-Command Deployment
```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### 3. Access Your Application
- **Main App**: https://localhost
- **API**: https://localhost/api
- **MongoDB Express**: http://localhost:8081

## 🔧 Configuration Options

### Essential Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campus_placement_portal

# Security
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# OpenAI (for chatbot)
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional Features

```env
# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File uploads
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🧪 Testing Your Setup

Run the built-in test suite to verify everything is working:

```bash
# Run all tests
npm test

# Or run the test script directly
node test.js
```

## 📱 First Steps After Setup

### 1. Create Your First User
- Open http://localhost:3000
- Click "Register" to create an account
- Choose your role (student, faculty, admin, or placement officer)

### 2. Explore the Features
- **Dashboard**: View your personalized dashboard
- **Chatbot**: Try the AI career assistant
- **Placements**: Add or view placement records
- **Training**: Browse available training programs

### 3. Admin Setup (if you're an admin)
- Access admin features through the user menu
- View analytics and system statistics
- Manage users and system settings

## 🚨 Troubleshooting

### Common Issues

#### "MongoDB connection failed"
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Start MongoDB if stopped
sudo systemctl start mongod
```

#### "Port already in use"
```bash
# Find what's using the port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

#### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### "Permission denied" (Docker)
```bash
# On Linux/macOS, you might need to run with sudo
sudo ./deploy.sh

# Or add your user to the docker group
sudo usermod -aG docker $USER
# Then log out and back in
```

### Getting Help

1. **Check the logs**: Look at the console output for error messages
2. **Verify configuration**: Ensure all environment variables are set correctly
3. **Check prerequisites**: Make sure Node.js and MongoDB versions are compatible
4. **Run tests**: Use `npm test` to identify specific issues

## 🔄 Next Steps

Once you have the basic application running:

1. **Customize the UI**: Modify `public/app.css` and `public/app.js`
2. **Add your data**: Import your existing placement records and training programs
3. **Configure email**: Set up SMTP for notifications
4. **Deploy to production**: Use the Docker setup or deploy to your preferred cloud platform
5. **Add features**: Extend the application with new functionality

## 📚 Additional Resources

- **Full Documentation**: [README.md](README.md)
- **API Reference**: Check the routes in the `routes/` directory
- **Database Schema**: Review the models in the `models/` directory
- **Deployment Guide**: See [deploy.sh](deploy.sh) for production deployment

## 🆘 Still Stuck?

If you're still having issues:

1. Check the [Issues](https://github.com/username/campus-placement-portal/issues) page
2. Review the troubleshooting section above
3. Ensure you're using compatible versions of all software
4. Try the Docker approach for a clean environment

---

**Happy coding! 🎉**

Your CampusPlacement Portal should now be up and running. Feel free to explore and customize it for your needs!
