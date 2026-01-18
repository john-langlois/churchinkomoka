import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

// Create typed Hono RPC client
export const client = hc<AppType>(
  typeof window !== 'undefined' 
    ? '/api' 
    : process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api`
      : 'http://localhost:3000/api'
);
