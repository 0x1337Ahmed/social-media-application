# Social Media Application

A full-stack social media application built with the MERN stack (MongoDB, Express.js, React, Node.js) and real-time features using Socket.IO.

## Features

- **Authentication**
  - User registration and login
  - JWT-based authentication
  - Password encryption
  - Profile management

- **Social Features**
  - Create, edit, and delete posts
  - Like and comment on posts
  - Friend requests and connections
  - Real-time chat messaging
  - User search and discovery

- **User Experience**
  - Responsive design for all devices
  - Dark/Light theme support
  - Real-time notifications
  - Infinite scroll for posts
  - Modern UI with Tailwind CSS

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Tailwind CSS for styling
- Socket.IO Client for real-time features
- Axios for API requests
- React Toastify for notifications
- React TimeAgo for timestamp formatting

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- Bcrypt for password hashing
- Express Validator for input validation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/social-media-app.git
cd social-media-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm run install-all
\`\`\`

3. Create a .env file in the backend directory:
\`\`\`env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
\`\`\`

4. Start the development servers:
\`\`\`bash
npm run dev
\`\`\`

The application will start with:
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000

## Project Structure

\`\`\`
├── backend/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Custom middlewares
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   └── server.js       # Entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/ # Reusable components
│       ├── contexts/   # React contexts
│       ├── pages/      # Page components
│       └── index.js    # Entry point
└── package.json
\`\`\`

## API Endpoints

### Auth Routes
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user
- PUT /api/auth/me - Update profile

### Post Routes
- GET /api/posts/feed - Get feed posts
- POST /api/posts - Create post
- PUT /api/posts/:id - Update post
- DELETE /api/posts/:id - Delete post
- POST /api/posts/:id/like - Toggle like
- POST /api/posts/:id/comments - Add comment

### Friend Routes
- GET /api/friends - Get friends list
- POST /api/friends/request - Send friend request
- POST /api/friends/accept - Accept friend request
- POST /api/friends/reject - Reject friend request
- GET /api/friends/search - Search users

### Chat Routes
- GET /api/chats - Get user's chats
- POST /api/chats/private - Create/access private chat
- POST /api/chats/group - Create group chat
- GET /api/chats/:id/messages - Get chat messages
- POST /api/chats/:id/messages - Send message

### Explore Routes
- GET /api/explore/trending - Get trending posts
- GET /api/explore/groups - Get popular groups
- GET /api/explore/tags/:tag - Get posts by tag

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
