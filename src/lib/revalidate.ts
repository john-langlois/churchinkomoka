import { revalidatePath } from 'next/cache';

/** Bust the ISR cache for sermon pages after any sermon mutation. */
export function revalidateSermons(): void {
  try {
    revalidatePath('/resources');
    revalidatePath('/resources/[id]', 'page');
  } catch (err) {
    // Not fatal: pages still refresh on the hourly revalidate window.
    console.warn('[revalidate] failed:', err);
  }
}
