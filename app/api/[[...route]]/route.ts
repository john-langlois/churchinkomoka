import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { NextRequest } from 'next/server';

// Import route modules
import { profilesRouter } from './routes/profiles';
import { retreatRouter } from './routes/retreat';

// Create main Hono instance
const app = new Hono().basePath('/api');

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'API is running' });
});

// Mount route modules
app.route('/profiles', profilesRouter);
app.route('/retreat', retreatRouter);

// Export AppType for client
export type AppType = typeof app;

// Next.js App Router handler
async function handler(request: NextRequest) {
  const url = new URL(request.url);
  const method = request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  // Convert Next.js request to Hono-compatible format
  const honoRequest = new Request(url.toString(), {
    method,
    headers: request.headers,
    body: request.body,
  });

  const response = await app.fetch(honoRequest);
  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
