## signup-login-render

This project demonstrates the use of HTTP-only cookies to enhance security by preventing client-side JavaScript from accessing cookie data. The project includes a frontend application built with React and Vite, and a backend application using Express and MongoDB.

## Table of Contents

- [signup-login-render](#signup-login-render)
- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Technologies Used](#technologies-used)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Installation](#installation)
  - [Usage](#usage)
- [Usage](#usage-1)
- [Project Structure](#project-structure)
- [Deployment on Render.com](#deployment-on-rendercom)

## Features

- User registration and login
- Secure authentication using JWT tokens
- HTTP-only cookies for enhanced security
- Protected routes for authorized users

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
npm install --prefix client
```

### Usage

1. Sure, here is an updated version of the

README.md

file with a table of contents, project details, features, technologies used, installation, usage, project structure, and deployment instructions for Render.com:

````markdown
# HTTP-only Cookies Project

This project demonstrates the use of HTTP-only cookies to enhance security by preventing client-side JavaScript from accessing cookie data. The project includes a frontend application built with React and Vite, and a backend application using Express and MongoDB.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Deployment on Render.com](#deployment-on-rendercom)

## Features

- User registration and login
- Secure authentication using JWT tokens
- HTTP-only cookies for enhanced security
- Protected routes for authorized users

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
````

2. Install dependencies for both frontend and backend:

```sh
npm install
npm install --prefix client
```

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


package.json


	public/
	README_DE.md


README.md


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

1. Create a new web service on Render.com.

2. Connect your GitHub repository to Render.

3. Set the build command to:

```sh
npm install && npm install --prefix client && npm run build --prefix client
```

4. Set the start command to:

```sh
node

server.js


```

5. Ensure that the `PORT` environment variable is set to the port Render expects.

6. Add any other necessary environment variables (e.g., `MONGO_URI`, `JWT_SECRET`, etc.).

7. Deploy the service.

8. Monitor the deployment logs to ensure the build and deployment are successful.

By following these steps, you should be able to deploy your project on Render.com successfully.

```

```
