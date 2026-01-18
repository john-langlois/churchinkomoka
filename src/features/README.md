# Features Directory

This directory contains frontend feature modules organized by domain.

## Structure

Each feature module should follow this pattern:

```
features/
  └── [domain]/
      ├── api/           # React Query hooks (use-[action].ts)
      ├── components/   # Domain-specific UI components
      └── schemas/      # Zod validation schemas
```

## Example Hook Pattern

```typescript
// src/features/profiles/api/use-get-profile.ts
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export function useGetProfile(id: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const res = await client.api.profiles[':id'].$get({ param: { id } });
      return await res.json();
    },
  });
}
```
