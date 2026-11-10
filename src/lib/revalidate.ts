import { revalidatePath } from 'next/cache';

function safe(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    // Not fatal: pages still refresh on their revalidate window.
    console.warn('[revalidate] failed:', err);
  }
}

/** Bust the ISR cache for pages that show sermons (list, detail, home "latest"). */
export function revalidateSermons(): void {
  safe(() => {
    revalidatePath('/');
    revalidatePath('/resources');
    revalidatePath('/resources/[id]', 'page');
  });
}

/** Bust the ISR cache for pages that show events (home featured, calendar). */
export function revalidateEvents(): void {
  safe(() => {
    revalidatePath('/');
    revalidatePath('/calendar');
  });
}
