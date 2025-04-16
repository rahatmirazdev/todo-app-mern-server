# MERN Todo App - Backend

A powerful backend for a modern todo application built with Express.js, MongoDB, and Node.js. This backend provides a comprehensive REST API for managing tasks, user authentication, notifications, and analytics.

## Features

- 🔐 User authentication and authorization
- 📋 Complete CRUD operations for todo items
- 🔄 Recurring tasks support
- 📊 Task analytics and statistics
- 📱 Desktop notifications
- 🧠 AI-powered subtask suggestions via Google Gemini AI
- 📆 Smart task scheduling

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication using JSON Web Tokens
- **bcrypt.js** - Password hashing
- **Google Gemini AI** - AI integration for task analysis

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or Atlas)
- Google Gemini API key (for AI features)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mern-todo/backend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d

   # Google Gemini API (for AI features)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   bun dev
   ```

## API Documentation

### Authentication Endpoints

| Method | Endpoint           | Description            | Auth Required |
|--------|-------------------|------------------------|---------------|
| POST   | /api/auth/register | Register a new user    | No           |
| POST   | /api/auth/login    | Login user             | No           |
| GET    | /api/auth/logout   | Logout user            | Yes          |
| GET    | /api/auth/me       | Get current user       | Yes          |

### Todo Endpoints

| Method | Endpoint                    | Description                    | Auth Required |
|--------|----------------------------|--------------------------------|---------------|
| GET    | /api/todos                  | Get todos with filtering       | Yes           |
| GET    | /api/todos/all              | Get all todos (no pagination)  | Yes           |
| GET    | /api/todos/:id              | Get a specific todo            | Yes           |
| POST   | /api/todos                  | Create a new todo              | Yes           |
| PUT    | /api/todos/:id              | Update a todo                  | Yes           |
| DELETE | /api/todos/:id              | Delete a todo                  | Yes           |
| PATCH  | /api/todos/:id/status       | Update todo status             | Yes           |
| GET    | /api/todos/stats            | Get todo statistics            | Yes           |
| GET    | /api/todos/summary          | Get todo summary               | Yes           |
| GET    | /api/todos/tags             | Get all tags                   | Yes           |
| GET    | /api/todos/series/:id       | Get recurring series           | Yes           |
| GET    | /api/todos/:id/history      | Get todo status history        | Yes           |
| POST   | /api/todos/import           | Import todos                   | Yes           |
| POST   | /api/todos/suggest-subtasks | Get AI subtask suggestions     | Yes           |
| POST   | /api/todos/parse-natural-language | Parse natural language task | Yes         |

### Scheduler Endpoints

| Method | Endpoint                       | Description                      | Auth Required |
|--------|-------------------------------|----------------------------------|---------------|
| GET    | /api/scheduler/recommendations/:id | Get scheduling recommendations | Yes          |
| POST   | /api/scheduler/:id               | Schedule a task                 | Yes          |

### Notification Endpoints

| Method | Endpoint                  | Description                      | Auth Required |
|--------|--------------------------|----------------------------------|---------------|
| POST   | /api/notifications/test    | Send a test notification         | Yes           |
| POST   | /api/notifications/due-tasks | Send due tasks notifications  | Yes           |

### User Preferences Endpoints

| Method | Endpoint                  | Description                      | Auth Required |
|--------|--------------------------|----------------------------------|---------------|
| GET    | /api/users/preferences    | Get user preferences             | Yes           |
| PUT    | /api/users/preferences    | Update user preferences          | Yes           |

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- 400 - Bad Request (invalid input)
- 401 - Unauthorized (authentication required)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found (resource not found)
- 500 - Server Error (unexpected server error)

## Deployment

For production deployment:

1. Set NODE_ENV to 'production' in your environment variables
2. Make sure all necessary environment variables are configured
3. Build and start the application:
   ```bash
   bun start
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.