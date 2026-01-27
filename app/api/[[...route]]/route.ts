import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { NextRequest } from 'next/server';
import profiles from './routes/profiles';
import retreat from './routes/retreat';
import events from './routes/events';
import sermons from './routes/sermons';

const app = new Hono()
  .basePath('/api')
  .use('*', logger())
  .use('*', cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  }))
  .get('/', (c) => {
    return c.json({ status: 'ok', message: 'API is running' });
  })
  .route('/profiles', profiles)
  .route('/retreat', retreat)
  .route('/events', events)
  .route('/sermons', sermons);

export type AppType = typeof app;

async function handler(request: NextRequest) {
  try {
    const res = await app.fetch(request);
    
    // If it's a 400 error, log the response body for debugging
    if (res.status === 400) {
      const clonedRes = res.clone();
      const body = await clonedRes.text();
      console.error('400 Validation Error:', body);
    }
    
    return res;
  } catch (err) {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    // Handle validation errors and other errors
    console.error('API Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
