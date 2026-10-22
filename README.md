# Task Management System — React Frontend

A modern React (Vite) single-page application for the Task Management System with JWT authentication, real-time cache analytics, background event visualization, and full containerization via Docker.

---

## Practical 11: Containerization with Docker

This frontend is containerized using Docker and ready for orchestration via Docker Compose.

### Dockerfile Highlights
- **Base Image**: `node:18` (matches lab environment)
- **Layer Caching**: `package*.json` copied and installed prior to copying source files
- **Build Step**: Executes `npm run build` to generate optimized production assets in `dist/`
- **Serve Step**: Runs `npm run preview -- --host` on port `5173`
- **Multi-Stage Option**: Also provides [`Dockerfile.multistage`](./Dockerfile.multistage) utilizing `nginx:alpine` to reduce image size from ~1.1GB to ~25MB.

### Build and Run with Docker Locally

```bash
# Build the Docker image
docker build -t task-manager-frontend .

# Run the container mapping host port 5173 to container port 5173
docker run -d -p 5173:5173 --name task-frontend task-manager-frontend

# Access in browser
http://localhost:5173
```

### Full-Stack Orchestration

To run the entire full stack (Frontend + Express Backend + MongoDB), run:

```bash
# From workspace / parent root
docker-compose up --build
```

---

## Project Structure

```
task-manager-frontend/
├── Dockerfile              # Dockerfile using node:18 + vite preview (port 5173)
├── Dockerfile.multistage   # Multi-stage production build using nginx:alpine
├── .dockerignore           # Excludes node_modules, dist, and local environment files
├── vite.config.js          # Configured with host: '0.0.0.0' and port: 5173
├── src/
│   ├── api.js              # REST API client with VITE_API_URL fallback
│   ├── App.jsx             # Main application UI and state management
│   └── main.jsx            # React root entrypoint
└── package.json
```
