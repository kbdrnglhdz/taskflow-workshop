# TaskFlow - Personal Task Planner

A full-stack personal task management application with intentional architectural issues.

## Tech Stack

- **Backend:** Node.js + Express + SQLite
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** SQLite (file-based)

## Project Structure

```
taskflow/
├── backend/           # Express API server
│   ├── src/
│   │   ├── index.js   # Main server (500+ lines)
│   │   ├── db.js      # Database connection
│   │   └── routes/
│   │       └── tasks.js
│   └── database.db    # SQLite database
└── frontend/          # React application
    ├── src/
    │   ├── App.tsx    # Main component (400+ lines)
    │   ├── api.ts     # API functions
    │   ├── types.ts   # TypeScript interfaces
    │   └── index.css  # Global styles
    └── public/
        └── index.html
```

## Running the Application

### Backend (Port 3000)

```bash
cd taskflow/backend
npm install
npm start
```

### Frontend (Port 5173)

```bash
cd taskflow/frontend
npm install
npm run dev
```

## Features

- Create, read, update, delete tasks
- Mark tasks as completed
- Filter tasks by status (All/Active/Completed)
- Basic statistics
- LocalStorage backup

## Known Issues

This project contains intentional architectural problems for demonstration purposes:

- SQL injection vulnerabilities
- No input validation
- Giant monolithic components
- No error handling
- Global variables
- No TypeScript strict mode
- Inline styles mixed with CSS
- Performance issues (re-renders)

## API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | /api/tasks | Get all tasks |
| GET | /api/tasks/:id | Get task by ID |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/toggle | Toggle completion |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tasks/filter/:status | Filter tasks |
| GET | /api/stats | Get statistics |

## License

MIT# taskflow-workshop
