# Signup-Login-Render

A full-stack authentication project demonstrating secure user login and registration using **email and password**, JWT, and HTTP-only cookies. It features a React + Vite frontend, and an Express + MongoDB backend, structured for clarity and deployment-ready via [Render.com](https://signup-login-render.onrender.com/).

---

### Current Login Method: Email & Password

This version uses **email-based authentication**.

Key highlights:

- JWT-based session management
- Secure password hashing with bcrypt
- HTTP-only cookies to prevent XSS
- Protected routes and admin access
- Modular backend structure
- React frontend with feedback messages

---

### Prefer Username Login?

Switch to the [`feature/username-login`](https://github.com/TVATDCI/signup-login-render/tree/feature/username-login) branch for a version that uses **username-based login**.

---

### Table of Contents

- [Signup-Login-Render](#signup-login-render)
  - [Current Login Method: Email \& Password](#current-login-method-email--password)
  - [Prefer Username Login?](#prefer-username-login)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Installation](#installation)
    - [Project Structure](#project-structure)

---

### Features

- Email/password registration and login
- JWT-based authentication with `httpOnly` cookies
- Protected routes for authenticated users
- Admin route access demonstration
- Password hashing using `bcrypt`
- Clear error/success alerts in UI
- React frontend + Express backend separation

---

### Technologies Used

#### Frontend

- **React** – UI library
- **Vite** – Build tool for lightning-fast development
- **Material-UI** – Component styling
- **Axios** – API communication
- **React Router** – Frontend routing

#### Backend

- **Express** – Node.js web framework
- **MongoDB** – Database
- **Mongoose** – MongoDB ODM
- **bcrypt** – Password hashing
- **jsonwebtoken** – JWT handling
- **cookie-parser** – Cookie middleware
- **cors** – Cross-origin requests
- **dotenv** – Environment variables

---

#### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/TVATDCI/signup-login-render.git
cd signup-login-render
```

2 **Install dependencies:**

```bash
npm install
cd client && npm install
```

3 **Run the frontend and backend:**

```bash
# From root
npm run client-dev
# In another terminal
npm start
```

#### Project Structure

```pgsql
signup-login-render/
├── .env
├── .gitignore
├── README.md
├── package.json
├── server.js
├── client/
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── Auth.jsx
│       ├── index.css
│       ├── main.jsx
│       └── components/
│           ├── Admin/
│           │   └── Admin.jsx
│           ├── Login/
│           │   └── Login.jsx
│           ├── Logout/
│           │   └── Logout.jsx
│           ├── NavBar/
│           │   └── NavBar.jsx
│           └── Register/
│               └── Register.jsx
├── controllers/
│   └── user.js
├── libs/
│   ├── db.js
│   └── jwt.js
├── middleware/
│   └── auth.js
├── models/
│   └── User.js
└── routes/
    └── userRoute.js
```

Thanks for smiling ! :satisfied:
