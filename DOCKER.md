# Docker Setup Guide

This guide explains how to build, run, and deploy the Hospital Management System using Docker.

## 🐳 Quick Start with Docker Compose

The easiest way to run the entire stack locally:

```bash
# Clone the repository
git clone <your-repo-url>
cd hospital-management-system

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services started:**
- PostgreSQL database on port `5432`
- Backend API on port `5000`
- Frontend on port `5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (used by docker-compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=hospital_management

# Backend
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Frontend (optional - defaults shown)
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

## 🏗️ Building Docker Images Manually

### Backend Image

```bash
cd backend
docker build -t hospital-backend:latest .
```

**Run the backend container:**

```bash
docker run -d \
  --name hospital-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_NAME=hospital_management \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  -e FRONTEND_URL=http://localhost:5173 \
  hospital-backend:latest
```

### Frontend Image

```bash
cd frontend

# Build with specific API URL
docker build \
  --build-arg VITE_API_URL=http://api.example.com/api \
  --build-arg VITE_SOCKET_URL=http://api.example.com \
  --build-arg VITE_RAZORPAY_KEY_ID=rzp_test_xxx \
  -t hospital-frontend:latest .
```

**Run the frontend container:**

```bash
docker run -d \
  --name hospital-frontend \
  -p 80:80 \
  -e VITE_API_URL=http://api.example.com/api \
  -e VITE_SOCKET_URL=http://api.example.com \
  hospital-frontend:latest
```

## 📦 Using Pre-built Images from GitHub Container Registry

Images are automatically built and pushed on every push to `main` branch.

### Pull and Run Latest Images

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/YOUR_USERNAME/hospital-management-system/backend:latest
docker pull ghcr.io/YOUR_USERNAME/hospital-management-system/frontend:latest

# Run backend
docker run -d \
  --name hospital-backend \
  -p 5000:5000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  ghcr.io/YOUR_USERNAME/hospital-management-system/backend:latest

# Run frontend
docker run -d \
  --name hospital-frontend \
  -p 80:80 \
  -e VITE_API_URL=http://your-api-url/api \
  ghcr.io/YOUR_USERNAME/hospital-management-system/frontend:latest
```

## 🚀 GitHub Actions Workflows

### Automatic CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main` or `master` branch
- Pull requests
- Manual workflow dispatch

**Jobs:**
1. **Test Backend** - Runs database tests with PostgreSQL service
2. **Test Frontend** - Lints and builds the frontend
3. **Build & Push** - Creates and pushes Docker images to GHCR
4. **Deploy Staging** - Deploys to staging environment
5. **Deploy Production** - Deploys to production (manual trigger)

### Manual Docker Build (`.github/workflows/docker-build.yml`)

Build and push images with custom parameters:

1. Go to **Actions** tab in your GitHub repository
2. Select **"Build and Push Docker Images"**
3. Click **"Run workflow"**
4. Configure parameters:
   - **Tag:** Version tag (e.g., `v1.0.0`)
   - **VITE_API_URL:** Your backend API URL
   - **VITE_SOCKET_URL:** Your WebSocket URL

### Required GitHub Secrets

Set these in your repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
|--------|-------------|---------|
| `GITHUB_TOKEN` | Auto-generated, no need to set | - |
| `VITE_API_URL` | Backend API URL for frontend | `https://api.hospital.com/api` |
| `VITE_SOCKET_URL` | WebSocket URL | `https://api.hospital.com` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay payment key | `rzp_test_xxx` |

### Optional Secrets for Production

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `SENDGRID_API_KEY` | For email notifications |
| `TWILIO_ACCOUNT_SID` | For SMS notifications |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |

## 🔌 Frontend URL Configuration

The frontend supports **two modes** of configuration:

### 1. Build-Time Configuration (Default)

Set during Docker image build with `--build-arg`:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.example.com/api \
  -t hospital-frontend:latest .
```

### 2. Runtime Configuration (Docker)

Override at container startup with environment variables:

```bash
docker run -d \
  -e VITE_API_URL=https://api.example.com/api \
  -e VITE_SOCKET_URL=https://api.example.com \
  hospital-frontend:latest
```

**This allows you to use the same Docker image across different environments** (staging, production) without rebuilding!

## 🗂️ Project Structure

```
hospital-management-system/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── nginx.conf
│   ├── .dockerignore
│   └── ...
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       └── docker-build.yml
└── DOCKER.md (this file)
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs hospital-backend
docker logs hospital-frontend

# Check if ports are already in use
netstat -an | grep 5000
netstat -an | grep 5173
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: deletes all data!)
docker-compose down -v
docker-compose up -d
```

### Frontend can't connect to backend

1. Check that `VITE_API_URL` is set correctly
2. Ensure CORS is configured in backend (`FRONTEND_URL` env var)
3. Check browser console for errors

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🤝 Contributing

When adding new features:

1. Update the Dockerfiles if new dependencies are needed
2. Add environment variables to `.env.example`
3. Update this documentation
4. Test with `docker-compose up --build`
