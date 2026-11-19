# Client & Payment Management System (Zcaleup)

A modern, production-ready SaaS application for managing clients, assigned projects, full/installment payment schedules, real-time business statistics, and AI-powered financial queries.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, Bootstrap 5, React Router 6, Axios, Lucide React icons
- **Backend**: Python 3, Django 5, Django REST Framework, SimpleJWT (JWT Authentication), WhiteNoise, Gunicorn
- **Database**: PostgreSQL (production), SQLite (local development fallback)
- **AI Chatbot**: OpenAI API backend integration with read-only tools and graceful fallback
- **Hosting / Deployment**: Vercel (Frontend) & Render (Backend & PostgreSQL)

---

## 2. Project Structure

```
client-payment-management/
├── backend/
│   ├── api/
│   │   ├── management/commands/seed_data.py
│   │   ├── chatbot.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── core/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── .env.example
│   ├── .env
│   ├── manage.py
│   ├── Procfile
│   ├── render.yaml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   ├── clientService.js
│   │   │   ├── projectService.js
│   │   │   ├── paymentService.js
│   │   │   ├── dashboardService.js
│   │   │   └── chatService.js
│   │   ├── components/
│   │   │   ├── Chatbot.jsx
│   │   │   ├── ClientDetailModal.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── EditClientModal.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── MarkPaidModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AddClient.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Payments.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 3. Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Seed the default admin user and initial sample client records:
   ```bash
   python manage.py seed_data
   ```
   *Default Admin Credentials:*
   - **Username:** `admin`
   - **Password:** `adminpassword123`
7. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   API runs at: `http://127.0.0.1:8000/`

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:5173/`

---

## 4. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `SECRET_KEY` | Django cryptographic secret key. Set a secure random string in production. |
| `DEBUG` | `True` for development, `False` for production. |
| `ALLOWED_HOSTS` | Comma-separated list of permitted hostnames (e.g. `localhost,127.0.0.1,.onrender.com`). |
| `DATABASE_URL` | PostgreSQL connection URL (`postgres://user:password@host:port/dbname`). Leave empty for local SQLite fallback. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend domains permitted for CORS requests. |
| `OPENAI_API_KEY` | Optional OpenAI API Key for chatbot function calling. |
| `OPENAI_MODEL` | OpenAI model identifier (default: `gpt-4o-mini`). |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API (e.g. `http://127.0.0.1:8000` or production Render URL). |

---

## 5. API Endpoints

### Authentication
- `POST /api/auth/login/` - Authenticate admin with username & password, returns JWT tokens
- `POST /api/auth/refresh/` - Refresh expired access token
- `GET /api/auth/user/` - Retrieve current admin profile

### Clients
- `GET /api/clients/` - List clients with status filtering and search
- `POST /api/clients/` - Create new client (optionally with initial project & installment schedule)
- `GET /api/clients/{id}/` - Retrieve client details, projects, and payment schedule
- `PUT /api/clients/{id}/` - Update client information
- `DELETE /api/clients/{id}/` - Delete client and associated records

### Projects
- `GET /api/projects/` - List projects (supports client filtering)
- `POST /api/projects/` - Create project and generate payment records
- `GET /api/projects/{id}/` - Retrieve project details
- `PUT /api/projects/{id}/` - Update project details
- `DELETE /api/projects/{id}/` - Delete project

### Payments
- `GET /api/payments/` - List payment records (filterable by `PAID`, `PENDING`, `OVERDUE`)
- `GET /api/payments/{id}/` - Retrieve payment record
- `POST /api/payments/{id}/mark-paid/` - Mark payment as paid with paid date & transaction reference
- `GET /api/payments/upcoming/` - Retrieve pending payments due in the next 30 days
- `GET /api/payments/overdue/` - Retrieve overdue payments

### Dashboard
- `GET /api/dashboard/summary/` - Calculate aggregate business statistics, upcoming, overdue, and status breakdown

### AI Chatbot
- `POST /api/chat/` - Ask business questions with read-only database tools

---

## 6. AI Chatbot Architecture

The AI Chatbot lives at the bottom-right corner of every page. It runs entirely on the Django backend using the OpenAI API:
- **No API keys** are exposed in React frontend code.
- **Read-Only Database Tools**: The backend exposes registered query functions to the model:
  - `get_dashboard_summary`
  - `get_overdue_payments`
  - `get_upcoming_payments`
  - `get_client_details`
  - `get_client_payment_history`
  - `get_payment_summary`
- **Graceful Fallback**: If `OPENAI_API_KEY` is not provided in `backend/.env`, the application does not crash. Instead, it informs the user and returns live business summary statistics.

---

## 7. Production Deployment Guide

### Backend Deployment (Render)
1. Push this repository to GitHub or GitLab.
2. In the Render Dashboard, create a **PostgreSQL Database** (`client-payment-db`).
3. Create a new **Web Service** connected to your repository:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --no-input`
   - **Start Command:** `gunicorn core.wsgi:application`
4. Add the following Environment Variables in Render:
   - `SECRET_KEY`: (Generate a secure secret key)
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `your-app-name.onrender.com`
   - `DATABASE_URL`: (Paste internal database connection string from Render PostgreSQL)
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
   - `OPENAI_API_KEY`: (Your OpenAI API key)
5. Create the initial admin user using the Render Shell tab:
   ```bash
   python manage.py seed_data
   ```

### Frontend Deployment (Vercel)
1. In Vercel, click **Add New Project** and import the repository.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend-app.onrender.com`
5. Deploy. Vercel automatically uses `vercel.json` for client-side routing.
