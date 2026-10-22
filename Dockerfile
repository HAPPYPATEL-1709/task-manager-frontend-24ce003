# ====================================================================
# Practical 11: Task Manager Frontend Dockerfile (React + Vite)
# Multi-stage aware build serving the production bundle on port 5173
# ====================================================================

FROM node:18 AS build

# Set container working directory
WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install application dependencies inside the container
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# Expose Vite preview / service port
EXPOSE 5173

# Launch the built React app bound to 0.0.0.0
CMD ["npm", "run", "preview", "--", "--host"]
