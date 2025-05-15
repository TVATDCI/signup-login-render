# signup-login-render

## Login with Email (current)

This version V1.1.0 of the project uses **Email and Password** for login.

---

## Prefer Username Login?

You can check out the old **Username Login** version in the [`feature/username-login`](https://github.com/TVATDCI/signup-login-render/tree/feature/username-login) branch!

This project demonstrates the use of HTTP-only cookies to enhance security by preventing client-side JavaScript from accessing cookie data. The project includes a frontend application built with React and Vite, and a backend application using Express and MongoDB.

## Table of Contents

- [signup-login-render](#signup-login-render)
  - [Login with Email (current)](#login-with-email-current)
  - [Prefer Username Login?](#prefer-username-login)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
    - [Frontend](#frontend)
    - [Backend](#backend)
  - [Installation](#installation)
  - [Pre-Deployment Preparation](#pre-deployment-preparation)
    - [1. Setting up MongoDB Atlas](#1-setting-up-mongodb-atlas)
    - [2. Testing the Backend API](#2-testing-the-backend-api)
  - [Usage](#usage)
  - [Project Structure](#project-structure)
  - [Deployment on Render.com](#deployment-on-rendercom)

## Features

- User registration and login
- Secure authentication using **JWT tokens**
- HTTP-only cookies for enhanced security against XSS attacks
- Protected routes accessible only to authenticated users
- Password hashing using **bcrypt** for secure storage
- Email-based login (instead of username) — [See Username Login version here](https://github.com/TVATDCI/signup-login-render/tree/feature/username-login)
- Frontend/Backend separation (React + Express.js)
- Error handling and user feedback (success/error alerts)

## Technologies Used

### Frontend

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A build tool that provides a faster and leaner development experience for modern web projects.
- **Material-UI**: A popular React UI framework.
- **Axios**: A promise-based HTTP client for the browser and Node.js.
- **React Router**: A collection of navigational components for React applications.

### Backend

- **Express**: A minimal and flexible Node.js web application framework.
- **MongoDB**: A NoSQL database for storing user information.
- **Mongoose**: An ODM (Object Data Modeling) library for MongoDB and Node.js.
- **bcrypt**: A library to help hash passwords.
- **jsonwebtoken**: A library to create and verify JSON Web Tokens (JWT).
- **cookie-parser**: A middleware to parse cookies.
- **cors**: A middleware to enable Cross-Origin Resource Sharing (CORS).
- **dotenv**: A module to load environment variables from a `.env` file.

## Installation

1. Clone the repository:

```sh
git clone https://github.com/TVATDCI/signup-login-render.git
cd signup-login-render
```

2. Install dependencies for both frontend and backend:

```sh
npm install
cd client && npm install && npm run dev
```

## Pre-Deployment Preparation

### 1. Setting up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a new project and cluster.
3. Add a new database user with proper permissions.
4. Allow IP access (0.0.0.0/0 for testing purposes).
5. Copy the connection string and update your `.env` file:

```sh
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 2. Testing the Backend API

1. Start the backend server:

```sh
npm start
```

2. Use Postman or cURL to test the API endpoints:

- **Signup:** `POST http://localhost:5000/api/auth/signup`
- **Login:** `POST http://localhost:5000/api/auth/login`
- **Get User Profile (Protected Route):** `GET http://localhost:5000/api/auth/profile`

Ensure everything works correctly before proceeding to deployment.

## Usage

1. Start the backend server:

```sh
npm start
```

2. Start the frontend development server:

```sh
npm run client-dev
```

3. Open your browser and navigate to `http://localhost:5173`.

## Project Structure

```
.env
.gitignore
client/
	.gitignore
	public/
	src/
		components/
			Admin/
				Admin.jsx
			Login/
				Login.jsx
			Logout/
				Logout.jsx
			NavBar/
				NavBar.jsx
			Register/
				Register.jsx
		index.css
		main.jsx
	vite.config.js
controllers/
	user.js
libs/
	db.js
	jwt.js
middleware/
	auth.js
models/
	User.js
package.json
README.md
routes/
	userRoute.js
server.js
```

## Deployment on Render.com

1. Create a new web service on [Render.com](https://render.com).
2. Connect your GitHub repository to Render.
3. Set the build command to:

```sh
npm run client-setup
```

4. Set the start command to:

```sh
node server.js
```

5. Ensure that the `PORT` environment variable is set to the port Render expects.
6. Add other necessary environment variables (`MONGO_URI`, `JWT_SECRET`, etc.).
7. Deploy the service.
8. Monitor the deployment logs to ensure the build and deployment are successful.

Thanks for smiling ! :satisfied:
