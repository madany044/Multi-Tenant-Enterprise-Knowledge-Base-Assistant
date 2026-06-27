# Multi-Tenant Enterprise Knowledge Base Assistant (RAG SaaS)

## Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database
- Gemini API Key

## 1. Backend Setup
1. Navigate to the `backend` folder: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in your database URL, Gemini API key, and JWT secret.
6. Run database migrations: `alembic upgrade head` (Note: Alembic setup is conceptual in this scaffold, you may need to run `alembic init alembic` if not fully configured).
7. Start the server: `uvicorn app.main:app --reload`

## 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8000/api/v1`
4. Start the development server: `npm run dev`

## 3. Using the Application
1. Access the frontend at `http://localhost:5173`.
2. Sign up for a new company (tenant).
3. Upload a PDF document.
4. Wait for ingestion status to become 'Ready'.
5. Go to the Chat section and ask questions based on your document!
