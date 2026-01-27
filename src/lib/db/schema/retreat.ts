import { pgTable, uuid, varchar, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

// Registration type enum
export const registrationTypeEnum = pgEnum('registration_type', ['individual', 'family']);

// Registration status enum
export const registrationStatusEnum = pgEnum('registration_status', [
  'pending',
  'confirmed',
  'cancelled',
  'waitlisted'
]);

// Retreats table - stores multiple retreats
export const retreats = pgTable('retreats', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  location: varchar('location', { length: 255 }),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Main retreat registration table
export const retreatRegistrations = pgTable('retreat_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  retreatId: uuid('retreat_id').references(() => retreats.id), // Link to specific retreat
  type: registrationTypeEnum('type').notNull(), // 'individual' or 'family'
  profileId: uuid('profile_id').references(() => profiles.id).notNull(), // Main registrant
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 20 }),
  status: registrationStatusEnum('status').default('pending').notNull(),
  notes: text('notes'), // Additional notes from the registration form
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Individual registrants table (for both individual and family registrations)
export const retreatRegistrants = pgTable('retreat_registrants', {
  id: uuid('id').defaultRandom().primaryKey(),
  registrationId: uuid('registration_id').references(() => retreatRegistrations.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id), // Optional: link to existing profile
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  age: integer('age'), // For children/adults distinction
  isAdult: boolean('is_adult').default(true).notNull(), // true for adult, false for child
  dietaryRestrictions: text('dietary_restrictions'),
  medicalNotes: text('medical_notes'),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Retreat = typeof retreats.$inferSelect;
export type NewRetreat = typeof retreats.$inferInsert;

export type RetreatRegistration = typeof retreatRegistrations.$inferSelect;
export type NewRetreatRegistration = typeof retreatRegistrations.$inferInsert;

export type RetreatRegistrant = typeof retreatRegistrants.$inferSelect;
export type NewRetreatRegistrant = typeof retreatRegistrants.$inferInsert;
