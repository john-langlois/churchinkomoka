# Church in Komoka

A Next.js 16 application built with the Hono-RPC Stack architecture pattern.

## Architecture

This application follows the "Hono-RPC Stack" architecture:

- **Next.js 16** with App Router and Turbopack
- **Hono** for type-safe API routes
- **Drizzle ORM** for database operations
- **NextAuth v5** for authentication (OTP-based)
- **React Query** for data fetching
- **Service Layer Pattern** for business logic

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker Desktop (for database setup) - [Download here](https://www.docker.com/products/docker-desktop/)
  - **Note:** Make sure Docker Desktop is running before starting the database

### Installation

1. Install dependencies:
```bash
npm install
```

2. **Start Docker Desktop** (if not already running)
   - On macOS: Open Docker Desktop from Applications
   - Wait for the Docker icon in the menu bar to show it's running

3. Start the PostgreSQL database with Docker:
```bash
docker-compose up -d
# or use the npm script:
npm run db:up
```

**If Docker is not available**, see [Alternative Setup](#alternative-setup) below.

4. Set up environment variables:
```bash
cp .env.example .env.local
```

The default `DATABASE_URL` in `.env.example` is already configured for Docker. You still need to:
- Generate `AUTH_SECRET` with: `openssl rand -base64 32`

5. Set up the database:
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup Options

**Option 1: Docker (Recommended for local development)**
- Already configured in `docker-compose.yml`
- Includes pgvector extension for future RAG features
- **Make sure Docker Desktop is running first!**
- See [docker/README.md](docker/README.md) for details

**Option 2: Local PostgreSQL Installation**

If you prefer not to use Docker, install PostgreSQL locally:

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb oikos_db
psql oikos_db -c "CREATE EXTENSION vector;"
```

Then update `DATABASE_URL` in `.env.local`:
```
DATABASE_URL=postgresql://$(whoami)@localhost:5432/oikos_db
```

**Option 3: External PostgreSQL**
- Update `DATABASE_URL` in `.env.local` with your connection string
- Ensure pgvector extension is installed: `CREATE EXTENSION vector;`

## Project Structure

```
/
├── app/
│   ├── (auth)/             # Public auth pages
│   ├── (dashboard)/        # Protected app pages
│   └── api/
│       ├── auth/           # NextAuth handlers
│       └── [[...route]]/   # Hono catch-all API
├── src/
│   ├── lib/
│   │   ├── db/             # Database layer (Drizzle)
│   │   ├── hono.ts         # Typed RPC client
│   │   └── langchain/      # AI framework (future)
│   ├── services/           # Business logic layer
│   ├── features/           # Frontend feature modules
│   └── components/         # React components
├── drizzle/                # Database migrations
└── middleware.ts           # Next.js middleware (auth protection)
```

## Development

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Migration Notes

This application was migrated from a Vite + React SPA to Next.js 16. All existing pages and UI components have been preserved and adapted to the Next.js App Router structure.

## License

Private - Church in Komoka
