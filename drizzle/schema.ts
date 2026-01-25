import { pgTable, uuid, varchar, boolean, timestamp, date, text, foreignKey, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const eventCategory = pgEnum("event_category", ['Service', 'Prayer', 'Retreat', 'Bible Study', 'Outreach'])
export const recurrencePattern = pgEnum("recurrence_pattern", ['daily', 'weekly', 'monthly', 'yearly'])
export const registrationStatus = pgEnum("registration_status", ['pending', 'confirmed', 'cancelled', 'waitlisted'])
export const registrationType = pgEnum("registration_type", ['individual', 'family'])


export const otpCodes = pgTable("otp_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	identifier: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 10 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	verified: boolean().default(false).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sermons = pgTable("sermons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	speaker: varchar({ length: 255 }),
	date: date(),
	youtubeId: varchar("youtube_id", { length: 50 }),
	spotifyLink: text("spotify_link"),
	articleContent: text("article_content"),
	isPublic: boolean("is_public").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const retreatRegistrations = pgTable("retreat_registrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: registrationType().notNull(),
	profileId: uuid("profile_id").notNull(),
	contactName: varchar("contact_name", { length: 255 }).notNull(),
	contactEmail: varchar("contact_email", { length: 255 }).notNull(),
	contactPhone: varchar("contact_phone", { length: 20 }),
	status: registrationStatus().default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		retreatRegistrationsProfileIdProfilesIdFk: foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "retreat_registrations_profile_id_profiles_id_fk"
		}),
	}
});

export const retreatRegistrants = pgTable("retreat_registrants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull(),
	profileId: uuid("profile_id"),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	age: integer(),
	isAdult: boolean("is_adult").default(true).notNull(),
	dietaryRestrictions: text("dietary_restrictions"),
	medicalNotes: text("medical_notes"),
	emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		retreatRegistrantsRegistrationIdRetreatRegistrationsIdFk: foreignKey({
			columns: [table.registrationId],
			foreignColumns: [retreatRegistrations.id],
			name: "retreat_registrants_registration_id_retreat_registrations_id_fk"
		}).onDelete("cascade"),
		retreatRegistrantsProfileIdProfilesIdFk: foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "retreat_registrants_profile_id_profiles_id_fk"
		}),
	}
});

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	avatarUrl: text("avatar_url"),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: eventCategory().notNull(),
	location: varchar({ length: 255 }).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	time: varchar({ length: 50 }),
	isRecurring: boolean("is_recurring").default(false).notNull(),
	recurrencePattern: recurrencePattern("recurrence_pattern"),
	recurrenceDayOfWeek: integer("recurrence_day_of_week"),
	recurrenceDayOfMonth: integer("recurrence_day_of_month"),
	recurrenceEndDate: timestamp("recurrence_end_date", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});
