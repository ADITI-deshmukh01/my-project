# 🎓 CampusPlacement Portal - CareerConnect

A comprehensive full-stack web application for college training and placement management, featuring AI-powered career guidance, user authentication, and comprehensive placement tracking.

## ✨ Features

### 🔐 Authentication & User Management
- **Multi-role Support**: Students, Faculty, Admin, Placement Officers
- **Secure JWT Authentication**: Token-based authentication with refresh capabilities
- **Role-based Access Control**: Granular permissions for different user types
- **Profile Management**: User profiles with customizable preferences

### 🤖 AI-Powered Career Assistant
- **OpenAI Integration**: GPT-powered career guidance and advice
- **Resume Review**: AI-powered resume analysis and improvement suggestions
- **Interview Preparation**: Personalized interview guidance and practice questions
- **Career Planning**: Tailored career advice based on user profile

### 📊 Placement Management
- **Placement Records**: Comprehensive tracking of student placements
- **Company Information**: Detailed company profiles and requirements
- **Application Tracking**: Monitor application status and progress
- **Statistics & Analytics**: Placement trends and performance metrics

### 🎯 Training Programs
- **Program Management**: Create and manage training programs
- **Student Enrollment**: Easy enrollment and progress tracking
- **Certification System**: Automated certificate generation
- **Feedback System**: Student feedback and rating collection

### 🎓 Higher Studies Support
- **Exam Information**: GATE, GRE, CAT, TOEFL details and timelines
- **University Database**: Comprehensive university and program information
- **Scholarship Information**: Available scholarships and application processes
- **Preparation Roadmaps**: Structured study plans for various exams

### 📱 Modern User Interface
- **Responsive Design**: Mobile-first, responsive web interface
- **Real-time Updates**: Live data updates and notifications
- **Interactive Elements**: Modern UI components and animations
- **Accessibility**: WCAG compliant design

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful API**: Well-structured REST endpoints
- **MongoDB Integration**: NoSQL database with Mongoose ODM
- **Socket.IO**: Real-time communication capabilities
- **Security Features**: Rate limiting, CORS, Helmet security headers

### Frontend (Vanilla JavaScript)
- **Modern JavaScript**: ES6+ features and async/await
- **Component-based Architecture**: Modular, maintainable code structure
- **State Management**: Client-side state management
- **API Integration**: RESTful API consumption

### Database (MongoDB)
- **Schema Design**: Well-designed data models with relationships
- **Indexing**: Optimized database performance
- **Data Validation**: Comprehensive input validation
- **Aggregation**: Advanced data analytics and reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- Docker & Docker Compose (for containerized deployment)
- OpenAI API key (for chatbot functionality)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-placement-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0
   
   # Or install MongoDB locally
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Docker Deployment

1. **Run the deployment script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Access the application**
   - Main App: https://localhost
   - API: https://localhost/api
   - MongoDB Express: http://localhost:8081

## 📁 Project Structure

```
campus-placement-portal/
├── public/                 # Frontend static files
│   ├── index.html         # Main application page
│   ├── app.js            # Frontend JavaScript
│   ├── app.css           # Frontend styles
│   └── ...               # Other frontend assets
├── models/                # Database models
│   ├── User.js           # User model
│   ├── Placement.js      # Placement model
│   ├── Training.js       # Training model
│   └── ...               # Other models
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── placements.js     # Placement routes
│   ├── training.js       # Training routes
│   ├── higherStudies.js  # Higher studies routes
│   ├── chatbot.js        # AI chatbot routes
│   └── admin.js          # Admin routes
├── middleware/            # Custom middleware
│   └── auth.js           # Authentication middleware
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── nginx.conf             # Nginx configuration
├── deploy.sh              # Deployment script
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/campus_placement_portal
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Database Setup

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Collections**: The application will create necessary collections automatically
3. **Indexes**: Database indexes are created automatically for optimal performance

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Placement Endpoints

- `GET /api/placements` - Get all placements
- `POST /api/placements` - Create placement record
- `PUT /api/placements/:id` - Update placement
- `GET /api/placements/stats/overview` - Placement statistics

### Training Endpoints

- `GET /api/training` - Get training programs
- `POST /api/training` - Create training program
- `POST /api/training/:id/enroll` - Enroll in training
- `PUT /api/training/:id/progress` - Update progress

### Chatbot Endpoints

- `POST /api/chatbot/chat` - General career guidance
- `POST /api/chatbot/resume-review` - Resume analysis
- `POST /api/chatbot/interview-prep` - Interview preparation

## 🎨 Customization

### Adding New Features

1. **Create Model**: Add new database model in `models/` directory
2. **Create Routes**: Add API routes in `routes/` directory
3. **Update Frontend**: Add corresponding frontend components
4. **Update Documentation**: Document new features

### Styling

- **CSS Variables**: Customize colors and themes in `styles.css`
- **Component Styles**: Modify component-specific styles in `app.css`
- **Responsive Design**: Update media queries for different screen sizes

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin resource sharing protection
- **Security Headers**: Helmet.js security headers
- **SQL Injection Protection**: MongoDB with parameterized queries

## 📊 Performance Optimization

- **Database Indexing**: Optimized MongoDB indexes
- **Caching**: Response caching for frequently accessed data
- **Compression**: Gzip compression for responses
- **Image Optimization**: Optimized image handling
- **Lazy Loading**: Progressive loading of content

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set up SSL certificates
   - Configure email services

2. **Docker Deployment**
   ```bash
   ./deploy.sh
   ```

3. **Manual Deployment**
   ```bash
   npm run build
   npm start
   ```

### Cloud Deployment

- **AWS**: Use AWS ECS or EC2 with RDS
- **Google Cloud**: Deploy to Google Cloud Run
- **Azure**: Use Azure App Service
- **Heroku**: Deploy to Heroku platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write meaningful commit messages
- Add documentation for new features
- Ensure all tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CCoEW**: Cummins College of Engineering for Women
- **OpenAI**: For AI-powered chatbot functionality
- **MongoDB**: For database technology
- **Node.js Community**: For the amazing ecosystem

## 📞 Support

For support and questions:

- **Email**: support@campusplacement.com
- **Documentation**: [Wiki](https://github.com/username/campus-placement-portal/wiki)
- **Issues**: [GitHub Issues](https://github.com/username/campus-placement-portal/issues)

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile Application (React Native)
- [ ] Advanced Analytics Dashboard
- [ ] Integration with Job Portals
- [ ] Video Interview Platform
- [ ] Alumni Network Features
- [ ] Multi-language Support

### Version History
- **v1.0.0**: Initial release with core features
- **v1.1.0**: Enhanced chatbot and analytics
- **v1.2.0**: Mobile responsiveness improvements
- **v2.0.0**: Major UI/UX overhaul

---

**Made with ❤️ for the CCoEW community**

*Empowering women engineers through technology and innovation*
