# Docker Setup Guide

This document provides complete instructions for running the Asana clone application using Docker.

## Overview

The application uses Docker and Docker Compose to containerize:
- **Next.js Web Application** - Running on port 3001
- **WebSocket Server** - Running on port 3002 (for real-time features)
- **SQLite Database** - Persisted using Docker volumes

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- At least 2GB of available RAM
- At least 5GB of available disk space

## Quick Start

### 1. Clone the Repository

```bash
cd /path/to/asana
```

### 2. Configure Environment Variables

Copy the Docker environment template:

```bash
cp .env.docker .env
```

Edit `.env` and update the following variables:

```env
# Required: Change this to a random 32+ character string
BETTER_AUTH_SECRET=your-super-secret-auth-key-change-this-in-production-min-32-chars

# Your application URL
BETTER_AUTH_URL=http://localhost:3001

# CORS origin (same as BETTER_AUTH_URL for local development)
CORS_ORIGIN=http://localhost:3001

# Database configuration (use default for Docker)
DATABASE_URL=file:./local.db
```

### 3. Build and Run

```bash
# Build the Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at:
- **Web Application**: http://localhost:3001
- **WebSocket Server**: ws://localhost:3002

### 4. Initialize the Database

On first run, you need to push the database schema:

```bash
docker-compose exec web bun run db:push
```

Optionally, seed the database with sample data:

```bash
docker-compose exec web bun run seed:notifications
```

## Docker Commands

### Building

```bash
# Build all images
docker-compose build

# Build with no cache (fresh build)
docker-compose build --no-cache

# Build specific service
docker-compose build web
```

### Running

```bash
# Start all services in detached mode
docker-compose up -d

# Start all services with logs
docker-compose up

# Start specific service
docker-compose up web

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Logs and Debugging

```bash
# View logs for all services
docker-compose logs

# Follow logs
docker-compose logs -f

# View logs for specific service
docker-compose logs web

# View last 100 lines
docker-compose logs --tail=100

# Execute command in running container
docker-compose exec web sh

# Run Bun command in container
docker-compose exec web bun run --help
```

### Database Management

```bash
# Push database schema
docker-compose exec web bun run db:push

# Generate Drizzle types
docker-compose exec web bun run db:generate

# Run migrations
docker-compose exec web bun run db:migrate

# Open Drizzle Studio
docker-compose exec web bun run db:studio
```

### Maintenance

```bash
# Restart services
docker-compose restart

# Restart specific service
docker-compose restart web

# View service status
docker-compose ps

# Remove stopped containers
docker-compose rm

# Prune Docker system (free up space)
docker system prune -a
```

## Project Structure

```
asana/
├── Dockerfile              # Multi-stage Dockerfile
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files excluded from build
├── .env.docker            # Environment variables template
├── apps/
│   └── web/
│       ├── local.db       # SQLite database (persisted)
│       └── ...
└── packages/
    ├── api/
    ├── auth/
    └── db/
```

## Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **deps** - Installs dependencies using Bun
2. **builder** - Builds the Next.js application
3. **runner** - Production runtime with minimal dependencies

This approach:
- Reduces final image size
- Improves security by excluding dev dependencies
- Speeds up subsequent builds with layer caching

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret key for auth (32+ chars) | `super-secret-key-min-32-chars` |
| `BETTER_AUTH_URL` | Application URL | `http://localhost:3001` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3001` |
| `DATABASE_URL` | SQLite database path | `file:./local.db` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Web app port | `3001` |
| `WS_PORT` | WebSocket server port | `3002` |

## Volume Persistence

The following data is persisted using Docker volumes:

- **SQLite Database**: `./apps/web/local.db` - All application data
- **Source Code** (development only): Hot reload support

To backup the database:

```bash
# Copy database from container
docker cp asana-web:/app/apps/web/local.db ./backup-local.db

# Restore database to container
docker cp ./backup-local.db asana-web:/app/apps/web/local.db
docker-compose restart web
```

## Networking

The application uses a custom bridge network (`asana-network`) to allow communication between services:

- Web application communicates with WebSocket server
- Both services can access the shared database

Port mappings:
- `3001:3001` - Web application
- `3002:3002` - WebSocket server

## Health Checks

The web service includes a health check that:
- Checks every 30 seconds
- Has a 10-second timeout
- Retries 3 times before marking unhealthy
- Waits 40 seconds before first check (startup period)

View health status:

```bash
docker-compose ps
```

## Production Deployment

### Security Considerations

1. **Change the auth secret**:
   ```env
   BETTER_AUTH_SECRET=$(openssl rand -base64 32)
   ```

2. **Use environment-specific URLs**:
   ```env
   BETTER_AUTH_URL=https://your-domain.com
   CORS_ORIGIN=https://your-domain.com
   ```

3. **Consider using PostgreSQL or MySQL** instead of SQLite for production

4. **Enable HTTPS** using a reverse proxy (nginx, Traefik)

### Recommended Production Stack

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web:
    image: your-registry/asana-web:latest
    environment:
      - NODE_ENV=production
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=https://your-domain.com
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
```

## Troubleshooting

### Build Failures

**Error**: `COPY failed: file not found`

**Solution**: Ensure you're running commands from the project root directory.

```bash
cd /e/Projects/asana
docker-compose build
```

**Error**: `failed to solve: context canceled`

**Solution**: Increase Docker resources (RAM/CPU) in Docker Desktop settings.

---

**Error**: `Bun not found`

**Solution**: Rebuild with no cache:

```bash
docker-compose build --no-cache
```

### Runtime Issues

**Error**: `Database locked`

**Solution**: Stop all containers and restart:

```bash
docker-compose down
docker-compose up -d
```

---

**Error**: `Port already in use`

**Solution**: Change ports in `docker-compose.yml`:

```yaml
ports:
  - "3003:3001"  # Use different host port
```

---

**Error**: `Cannot connect to WebSocket`

**Solution**: Ensure WebSocket container is running:

```bash
docker-compose ps
docker-compose logs websocket
```

### Performance Issues

**Slow build times**:
- Use BuildKit: `DOCKER_BUILDKIT=1 docker-compose build`
- Increase Docker Desktop resource limits

**High memory usage**:
- Reduce number of concurrent builds
- Clear Docker cache: `docker system prune -a`

### Database Issues

**Lost data after restart**:
- Check volume mounts in `docker-compose.yml`
- Verify database file permissions

**Schema mismatch**:
```bash
docker-compose exec web bun run db:push --force
```

## Cleanup

### Remove all containers and volumes

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi $(docker images -q asana-*)

# Clean up Docker system
docker system prune -a
```

## Development with Docker

For development with hot reload:

```bash
# Use development override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  web:
    command: ["bun", "run", "dev"]
    environment:
      - NODE_ENV=development
    volumes:
      - ./apps/web/src:/app/apps/web/src
      - ./packages:/app/packages
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker-compose build

      - name: Run tests
        run: docker-compose run web bun test

      - name: Push to registry
        run: |
          docker tag asana-web:latest registry.com/asana-web:${{ github.sha }}
          docker push registry.com/asana-web:${{ github.sha }}
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Docker Documentation](https://bun.sh/docs/install/docker)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Open an issue on the project repository
