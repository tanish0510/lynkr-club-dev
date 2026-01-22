# Docker Setup Guide

This project is fully dockerized and can be run using Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB of available RAM

## Quick Start

1. **Create a `.env` file** in the root directory (`lynkr-club-dev/`) with the following variables:

```env
# MongoDB Configuration
DB_NAME=lynkr_db

# JWT Configuration (REQUIRED)
JWT_SECRET=your-secret-key-here-change-this-in-production-min-32-chars
JWT_ALGORITHM=HS256

# Email Configuration (Optional)
RESEND_API_KEY=your-resend-api-key
SENDER_EMAIL=noreply@lynkr.club

# Frontend URL
FRONTEND_URL=http://localhost:3000

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key

# Emergent LLM Configuration (Optional)
EMERGENT_LLM_KEY=your-emergent-llm-key

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:80

# Frontend Backend URL
REACT_APP_BACKEND_URL=http://localhost:8000

# MongoDB Express UI (Optional)
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=admin
```

2. **Build and start all services**:

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MongoDB: localhost:27017
   - MongoDB Express UI: http://localhost:8081 (username: admin, password: admin)

## Services

The docker-compose setup includes:

1. **MongoDB** - Database service
   - Port: 27017
   - Data persisted in Docker volume

2. **Backend** - FastAPI Python application
   - Port: 8000
   - Hot reload enabled for development
   - Connected to MongoDB

3. **Frontend** - React application
   - Port: 3000
   - Hot reload enabled for development
   - Connected to Backend API

4. **MongoDB Express** - Web-based MongoDB admin interface
   - Port: 8081
   - Access at http://localhost:8081
   - Default credentials: admin/admin (change in .env)
   - View and manage MongoDB data in browser

## Useful Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f mongo-express
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (clears database)
```bash
docker-compose down -v
```

### Rebuild specific service
```bash
docker-compose build backend
docker-compose build frontend
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh
```

### Restart a service
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mongo-express
```

### Access MongoDB Express UI
```bash
# Open in browser
open http://localhost:8081

# Or visit manually:
# URL: http://localhost:8081
# Username: admin (or value from MONGO_EXPRESS_USERNAME in .env)
# Password: admin (or value from MONGO_EXPRESS_PASSWORD in .env)
```

## Development

The setup is configured for development with:
- Hot reload for both frontend and backend
- Volume mounts for live code changes
- Development-friendly configurations

## Production

For production deployment, you should:
1. Use production Dockerfiles (separate from dev)
2. Set proper environment variables
3. Use production builds for frontend
4. Configure proper CORS origins
5. Set secure JWT secrets
6. Use managed database services

## Troubleshooting

### Port already in use
If ports 3000, 8000, or 27017 are already in use, either:
- Stop the conflicting service
- Change ports in `docker-compose.yml`

### MongoDB connection issues
- Ensure MongoDB container is healthy: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`

### Frontend can't connect to backend
- Verify `REACT_APP_BACKEND_URL` is set correctly
- Check backend is running: `docker-compose ps backend`
- Check CORS settings in backend

### Build failures
- Clear Docker cache: `docker-compose build --no-cache`
- Check Docker has enough resources allocated
