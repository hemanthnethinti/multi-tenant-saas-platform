# Technical Specification

## Project Structure
backend/
  - src/
    - controllers/
    - routes/
    - middleware/
    - utils/
    - app.js
    - db.js
  - migrations/
  - seeds/
  - Dockerfile
  - .env.example
frontend/
  - src/
  - public/
  - Dockerfile

## Development Setup
- Prerequisites: Docker Desktop
- Environment variables: see backend/.env.example; provided via docker-compose.yml
- Run locally: `docker-compose up -d`
- Health: `GET /api/health`
- Tests: planned in backend/tests and frontend/App.test.js
