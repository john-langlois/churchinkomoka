# Docker Database Setup

This directory contains Docker configuration for local PostgreSQL database development.

## Quick Start

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Check if it's running:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f postgres
   ```

4. **Stop the database:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove all data:**
   ```bash
   docker-compose down -v
   ```

## Database Connection

The database is configured with:
- **Host:** localhost
- **Port:** 5432
- **Database:** oikos_db
- **Username:** oikos
- **Password:** oikos_dev_password

Connection string:
```
postgresql://oikos:oikos_dev_password@localhost:5432/oikos_db
```

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. The default `DATABASE_URL` in `.env.example` is already configured for Docker.

## Running Migrations

After starting the database, run migrations:

```bash
# Generate migrations (if schema changed)
npm run db:generate

# Run migrations
npm run db:migrate
```

## Accessing the Database

### Using Drizzle Studio

```bash
npm run db:studio
```

This will open Drizzle Studio at `http://localhost:4983`

### Using psql

```bash
docker exec -it oikos-postgres psql -U oikos -d oikos_db
```

### Using a GUI Client

Connect with any PostgreSQL client using:
- Host: `localhost`
- Port: `5432`
- Database: `oikos_db`
- Username: `oikos`
- Password: `oikos_dev_password`

## Features

- **pgvector extension**: Enabled for future RAG/AI capabilities
- **Persistent storage**: Data persists in Docker volume `postgres_data`
- **Health checks**: Automatic health monitoring
- **Auto-restart**: Container restarts unless stopped manually

## Troubleshooting

### Docker daemon not running

If you see an error like `FileNotFoundError: [Errno 2] No such file or directory` or `Error while fetching server API version`, Docker Desktop is not running.

**On macOS:**
1. Open Docker Desktop application
2. Wait for it to fully start (whale icon in menu bar should be steady)
3. Try running `docker-compose up -d` again

**On Linux:**
```bash
# Start Docker service
sudo systemctl start docker
# Or if using service command
sudo service docker start
```

**Verify Docker is running:**
```bash
docker ps
```

### Port already in use

If port 5432 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Use 5433 instead
```

Then update your `DATABASE_URL` accordingly.

### Reset database

To completely reset the database:

```bash
docker-compose down -v
docker-compose up -d
npm run db:migrate
```

### View database logs

```bash
docker-compose logs postgres
```

### Alternative: Use local PostgreSQL

If you prefer not to use Docker, you can install PostgreSQL locally:

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb oikos_db
psql oikos_db -c "CREATE EXTENSION vector;"
```

Then update your `DATABASE_URL` in `.env.local`:
```
DATABASE_URL=postgresql://$(whoami)@localhost:5432/oikos_db
```
