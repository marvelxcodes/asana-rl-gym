# Docker Quick Start Guide

This guide helps you quickly get the Asana clone running with Docker.

## Prerequisites

- [Docker](https://www.docker.com/get-started) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+

## Quick Start

### 1. Set up environment variables

```bash
cp .env.docker .env
```

Edit `.env` and update `BETTER_AUTH_SECRET`:

```env
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters-long
```

### 2. Build and run

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Initialize database

```bash
# Push database schema
docker-compose exec web bun run db:push

# (Optional) Seed sample data
docker-compose exec web bun run seed:notifications
```

### 4. Access the application

- **Web App**: http://localhost:3001
- **WebSocket**: ws://localhost:3002

## Common Commands

```bash
# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f web

# Execute commands in container
docker-compose exec web sh

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Port already in use

Change ports in `docker-compose.yml`:

```yaml
ports:
  - "3003:3001"  # Change host port
```

### Build fails

Clear cache and rebuild:

```bash
docker-compose build --no-cache
```

### Database issues

Reset database:

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec web bun run db:push
```

## Full Documentation

For complete Docker documentation, see: [apps/web/docs/docker-setup.md](apps/web/docs/docker-setup.md)

## Production Deployment

See the [Docker Setup Guide](apps/web/docs/docker-setup.md#production-deployment) for production deployment instructions.
