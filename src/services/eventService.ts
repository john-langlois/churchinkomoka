import { db } from '@/src/lib/db/connection';
import { events } from '@/src/lib/db/schema';
import { eq, and, gte, or, isNull, desc, asc } from 'drizzle-orm';
import type { Event, NewEvent } from '@/src/lib/db/schema/events';

export type EventForDisplay = Event & {
  displayDate: string;
  nextOccurrence?: Date;
  isUpcoming: boolean;
};

/**
 * Calculate the next occurrence date for a recurring event
 */
export function calculateNextOccurrence(event: Event): Date | null {
  if (!event.isRecurring || !event.recurrencePattern) {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if recurrence has ended
  if (event.recurrenceEndDate) {
    const endDate = new Date(event.recurrenceEndDate);
    if (endDate < today) {
      return null; // Recurrence has ended
    }
  }

  let nextDate: Date;

  switch (event.recurrencePattern) {
    case 'daily':
      // Next day from today
      nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      if (event.recurrenceDayOfWeek === null || event.recurrenceDayOfWeek === undefined) {
        return null;
      }
      // Find next occurrence of the day of week
      const currentDay = today.getDay();
      const targetDay = event.recurrenceDayOfWeek;
      let daysUntilNext = (targetDay - currentDay + 7) % 7;
      if (daysUntilNext === 0) {
        daysUntilNext = 7; // If it's today, get next week's occurrence
      }
      nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysUntilNext);
      break;

    case 'monthly':
      if (event.recurrenceDayOfMonth === null || event.recurrenceDayOfMonth === undefined) {
        return null;
      }
      // Find next occurrence of the day of month
      nextDate = new Date(today);
      const targetDayOfMonth = event.recurrenceDayOfMonth;
      
      // If today's day is before or equal to target day, use this month
      if (today.getDate() < targetDayOfMonth) {
        nextDate.setDate(targetDayOfMonth);
      } else {
        // Otherwise, use next month
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(targetDayOfMonth);
      }
      break;

    case 'yearly':
      // Find next occurrence of same date next year
      if (event.startDate) {
        const startDate = new Date(event.startDate);
        nextDate = new Date(startDate);
        nextDate.setFullYear(today.getFullYear());
        
        // If this year's date has passed, use next year
        if (nextDate < today) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      } else {
        return null;
      }
      break;

    default:
      return null;
  }

  // Check if calculated date is beyond recurrence end date
  if (event.recurrenceEndDate && nextDate > new Date(event.recurrenceEndDate)) {
    return null;
  }

  return nextDate;
}

/**
 * Format event date for display
 */
function formatEventDate(event: Event, nextOccurrence?: Date | null): string {
  if (event.isRecurring && nextOccurrence) {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return `Next: ${nextOccurrence.toLocaleDateString('en-US', options)}`;
  }
  
  if (event.startDate) {
    const startDate = new Date(event.startDate);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return startDate.toLocaleDateString('en-US', options);
  }

  return 'Date TBD';
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    const allEvents = await db
      .select()
      .from(events)
      .where(eq(events.isActive, true))
      .orderBy(asc(events.startDate));
    
    return allEvents;
  } catch (error) {
    console.error('Error in getAllEvents:', error);
    return [];
  }
}

/**
 * Get upcoming events (next N events)
 */
export async function getUpcomingEvents(limit?: number): Promise<EventForDisplay[]> {
  try {
    const allEvents = await db
      .select()
      .from(events)
      .where(eq(events.isActive, true))
      .orderBy(asc(events.startDate));

    const now = new Date();
    const eventsForDisplay: EventForDisplay[] = [];

    for (const event of allEvents) {
      let nextOccurrence: Date | null = null;
      let isUpcoming = false;

      if (event.isRecurring) {
        nextOccurrence = calculateNextOccurrence(event);
        if (nextOccurrence) {
          isUpcoming = nextOccurrence >= now;
        }
      } else if (event.startDate) {
        const startDate = new Date(event.startDate);
        isUpcoming = startDate >= now;
        if (isUpcoming) {
          nextOccurrence = startDate;
        }
      }

      if (isUpcoming || nextOccurrence) {
        eventsForDisplay.push({
          ...event,
          displayDate: formatEventDate(event, nextOccurrence),
          nextOccurrence: nextOccurrence || undefined,
          isUpcoming,
        });
      }
    }

    // Sort by next occurrence date
    eventsForDisplay.sort((a, b) => {
      const dateA = a.nextOccurrence || new Date(0);
      const dateB = b.nextOccurrence || new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

    return limit ? eventsForDisplay.slice(0, limit) : eventsForDisplay;
  } catch (error) {
    console.error('Error in getUpcomingEvents:', error);
    return [];
  }
}

/**
 * Get events formatted for display (handles recurring logic)
 */
export async function getEventsForDisplay(): Promise<EventForDisplay[]> {
  try {
    const allEvents = await db
      .select()
      .from(events)
      .where(eq(events.isActive, true))
      .orderBy(asc(events.startDate));

    const eventsForDisplay: EventForDisplay[] = allEvents.map(event => {
      const nextOccurrence = event.isRecurring ? calculateNextOccurrence(event) : null;
      return {
        ...event,
        displayDate: formatEventDate(event, nextOccurrence),
        nextOccurrence: nextOccurrence || undefined,
        isUpcoming: nextOccurrence ? nextOccurrence >= new Date() : false,
      };
    });

    return eventsForDisplay;
  } catch (error) {
    console.error('Error in getEventsForDisplay:', error);
    return [];
  }
}

/**
 * Get event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const result = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error in getEventById:', error);
    return null;
  }
}

/**
 * Create a new event
 */
export async function createEvent(
  eventData: Omit<NewEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; event: Event | null; error?: string }> {
  try {
    const newEvent: NewEvent = {
      ...eventData,
      updatedAt: new Date(),
    };

    const [event] = await db
      .insert(events)
      .values(newEvent)
      .returning();

    return { success: true, event };
  } catch (error) {
    console.error('Error in createEvent:', error);
    return {
      success: false,
      event: null,
      error: error instanceof Error ? error.message : 'Failed to create event',
    };
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  id: string,
  eventData: Partial<Omit<NewEvent, 'id' | 'createdAt'>>
): Promise<{ success: boolean; event: Event | null; error?: string }> {
  try {
    const [event] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    if (!event) {
      return { success: false, event: null, error: 'Event not found' };
    }

    return { success: true, event };
  } catch (error) {
    console.error('Error in updateEvent:', error);
    return {
      success: false,
      event: null,
      error: error instanceof Error ? error.message : 'Failed to update event',
    };
  }
}

/**
 * Delete an event (soft delete by setting isActive to false)
 */
export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(events)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id));

    return { success: true };
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete event',
    };
  }
}
