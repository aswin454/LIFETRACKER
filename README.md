# LifeTracker | Premium Task Management System

LifeTracker is a modern, responsive, and aesthetically outstanding MERN (MongoDB, Express.js, React, Node.js) stack Task Management application. It empowers users to plan, track, and complete Daily, Weekly, and Monthly schedules with real-time statistics.

---

## Key Features

- **Double-Tiered Authentication**: Highly secure registration and login pages powered by **JWT (JSON Web Tokens)** and password hashing with **bcryptjs**.
- **Categorized Schedules**: Separate planning dashboards for **Daily**, **Weekly**, and **Monthly** tasks.
- **Full CRUD Management**: Seamless creation, reading, editing, and deleting of user-specific tasks.
- **Real-Time Progress Tracking**: Dynamic category-level and overall progress bars showing exact task completion ratios.
- **Premium Aesthetics**: Dark theme styling built with **React**, **Tailwind CSS**, and **Lucide Icons** featuring elegant glassmorphism effects and micro-animations.
- **Robust Connection Fallback**: Auto-fallback to offline mock tasks if the server or database is temporarily unavailable during setup.

---

## Project Structure

```
scheduler/
├── backend/
│   ├── middleware/
│   │   └── auth.js         # JWT Token Verification Middleware
│   ├── models/
│   │   ├── User.js         # Mongoose User Schema
│   │   └── Task.js         # Mongoose Task Schema
│   ├── routes/
│   │   ├── auth.js         # Auth endpoints (Signup/Login/Profile)
│   │   └── tasks.js        # Tasks CRUD & Statistics endpoints
│   ├── .env                # Port, MongoDB URI & JWT secret configuration
│   ├── package.json        # Backend dependencies
│   └── server.js           # Server runner configuration
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # React Context for authentication
    │   ├── pages/
    │   │   ├── LoginPage.jsx    # UI design for user sign-in
    │   │   ├── SignupPage.jsx   # UI design for user registration
    │   │   └── DashboardPage.jsx# Interactive calendar-type scheduler dashboard
    │   ├── App.jsx         # App router and session protection wrapper
    │   ├── index.css       # Tailwind entry and utility styling
    │   └── main.jsx        # App mounting entry point
    ├── index.html          # Global HTML template
    ├── package.json        # Frontend dev tools & dependency configs
    ├── postcss.config.js   # Style compiler config
    ├── tailwind.config.js  # Color tokens, styles & transitions definitions
    └── vite.config.js      # Build details & dev proxy configurations
```

---

## Local Setup Instructions

Follow these simple steps to run the application locally on your machine:

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on port 27017 or a MongoDB Atlas URI)

---

### Step 1: Start the Backend Server

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the server-side dependencies:
   ```bash
   npm install
   ```
3. (Optional) Adjust your `.env` configuration file inside `backend/.env` if your MongoDB connection details differ:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/scheduler
   JWT_SECRET=scheduler_jwt_secure_secret_key_2026
   ```
4. Run the server in development mode (launches Node and listens on port 5000):
   ```bash
   npm run dev
   ```

---

### Step 2: Start the Frontend Application

1. Open a new terminal window/tab and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install client-side packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at:
   [http://localhost:5173](http://localhost:5173)

---

## API Documentation

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | Register new user accounts. |
| `/api/auth/login` | `POST` | Public | Authenticates credentials and issues JWT. |
| `/api/auth/me` | `GET` | Private | Retrieves profile data of currently logged-in user. |
| `/api/tasks` | `GET` | Private | Fetches user tasks (filter by category using `?category=daily/weekly/monthly`). |
| `/api/tasks` | `POST` | Private | Creates a new task in daily, weekly, or monthly logs. |
| `/api/tasks/:id` | `PUT` | Private | Modifies task details (title, category, or completed states). |
| `/api/tasks/:id` | `DELETE`| Private | Permanently deletes a specific task. |
| `/api/tasks/stats` | `GET` | Private | Returns totals, pending counts, and completion percentages. |
