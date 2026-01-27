import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

// Event category enum
export const eventCategoryEnum = pgEnum('event_category', [
  'Service',
  'Prayer',
  'Retreat',
  'Bible Study',
  'Outreach'
]);

// Recurrence pattern enum
export const recurrencePatternEnum = pgEnum('recurrence_pattern', [
  'daily',
  'weekly',
  'monthly',
  'yearly'
]);

// Main events table
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: eventCategoryEnum('category').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  startDate: timestamp('start_date'), // For one-time events
  endDate: timestamp('end_date'), // Optional, for multi-day events
  time: varchar('time', { length: 50 }), // e.g., "10:00 AM - 11:30 AM"
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrencePattern: recurrencePatternEnum('recurrence_pattern'), // 'daily', 'weekly', 'monthly', 'yearly'
  recurrenceDayOfWeek: integer('recurrence_day_of_week'), // 0-6, for weekly (0 = Sunday)
  recurrenceDayOfMonth: integer('recurrence_day_of_month'), // 1-31, for monthly
  recurrenceEndDate: timestamp('recurrence_end_date'), // Optional end date for recurring events
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
