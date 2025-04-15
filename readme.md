# MERN Starter Pack - Backend

This is the backend component of the MERN Starter Pack application.

## Environment Variables

To run this project, you need to create a `.env` file in the backend directory with the following variables:

```
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# JWT Secret Key for authentication
JWT_SECRET=<your_jwt_secret>

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000
```

**Note:** Replace the placeholder values (`<username>`, `<password>`, etc.) with your actual MongoDB credentials and create a secure random string for the JWT_SECRET.

## Getting Started

1. Clone the repository
2. Create the `.env` file with the variables mentioned above
3. Install dependencies:
```
npm install
```
4. Run the server:
```
npm start
```