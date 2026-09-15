# Memora Backend (Python FastAPI + SQLite + Gemini AI)

This is the real backend for the **Memora** Cognitive Care & Assistive Memory Prototype (SIH26003).

## Features
- **FastAPI**: Clean REST API with automatic OpenAPI Swagger documentation at `/docs`.
- **SQLite Database**: Lightweight, zero-setup relational persistence using SQLAlchemy.
- **Cognitive Analytics Service**: Evaluates activity performance across 6 cognitive skills:
  - Recall (Routine Quiz)
  - Recognition (Familiar Faces, Familiar Voices)
  - Associative Memory (Matching Family Members, Familiar Voices)
  - Problem-solving (Photo Puzzle, Shape Fit)
  - Categorization (Odd One Out)
  - Visual-spatial (Shape Fit)
- **Deterministic Adaptive Safety Engine**: Constrains difficulty levels to safe bounds (1 to 5) so elderly users are never overwhelmed.
- **Gemini AI Integration**: Generates supportive caregiver suggestions and personalized activity recommendations, respecting safe boundaries.
- **Multilingual TTS Service**: High-fidelity neural voice synthesis for Assamese, Bengali, Nepali, and English, with honest text fallback for regional languages without active neural models.
- **Offline Sync & Resilient Fallback**: Frontend seamlessly uses `localStorage` cache if backend is unavailable.

---

## Setup & Running

### 1. Prerequisites
- Python 3.10+ (Python 3.13 recommended)

### 2. Create and Activate Virtual Environment
```bash
cd backend
python -m venv .venv

# On Windows PowerShell:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```
Optionally add your `GEMINI_API_KEY`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no Gemini API key is configured, the backend automatically provides rule-based deterministic insights so the application remains 100% functional.*

### 5. Run Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
Backend will be live at:
- Health check: `http://localhost:8000/api/health`
- Interactive API docs: `http://localhost:8000/docs`

---

## Running Frontend
From root directory (`memora-app`):
```bash
npm run dev
```
Frontend runs at `http://localhost:5173`.
