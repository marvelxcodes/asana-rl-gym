# asana

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **tRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system
- **Docker** - Full containerization support with Docker Compose

## Getting Started

You can run this project in two ways:

### Option 1: Docker (Recommended)

The fastest way to get started is with Docker:

```bash
# 1. Set up environment variables
cp .env.docker .env
# Edit .env and set BETTER_AUTH_SECRET to a secure random string

# 2. Build and run with Docker
docker-compose build
docker-compose up -d

# 3. Initialize database
docker-compose exec web bun run db:push

# 4. (Optional) Seed sample data
docker-compose exec web bun run seed:notifications
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see your application.

**📘 Full Docker Documentation**: See [DOCKER.md](DOCKER.md) for complete Docker setup guide, troubleshooting, and production deployment.

### Option 2: Local Development

If you prefer to run without Docker:

**1. Install dependencies:**
```bash
bun install
```

**2. Database Setup:**

This project uses SQLite with Drizzle ORM.

```bash
# Start the local SQLite database
cd apps/web && bun db:local

# Update your .env file in apps/web/ directory with connection details

# Apply the schema to your database
bun db:push
```

**3. Run the development server:**
```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see your fullstack application.







## Project Structure

```
asana/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

### Local Development
- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `cd apps/web && bun db:local`: Start the local SQLite database

### Docker Commands
- `docker-compose up -d`: Start all services in background
- `docker-compose down`: Stop all services
- `docker-compose logs -f`: View logs
- `docker-compose exec web sh`: Access web container shell
- `docker-compose exec web bun run db:push`: Push database schema in Docker
- `docker-compose restart`: Restart all services

## Docker Deployment

This project includes full Docker support for easy deployment and development:

### Features
- ✅ **Multi-stage builds** - Optimized production images
- ✅ **Bun-based** - Fast package management and runtime
- ✅ **Monorepo support** - Handles workspace dependencies correctly
- ✅ **Health checks** - Automatic service monitoring
- ✅ **Database persistence** - SQLite data persisted via volumes
- ✅ **Hot reload** - Development mode with live updates
- ✅ **WebSocket support** - Real-time features containerized

### Services
| Service | Port | Description |
|---------|------|-------------|
| web | 3001 | Next.js application |
| websocket | 3002 | WebSocket server for real-time features |

### Documentation
- **Quick Start**: [DOCKER.md](DOCKER.md)
- **Complete Guide**: [apps/web/docs/docker-setup.md](apps/web/docs/docker-setup.md)
- **Production Deployment**: See docs for security best practices and CI/CD setup
