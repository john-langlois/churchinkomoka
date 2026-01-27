import { relations } from "drizzle-orm/relations";
import { profiles, retreatRegistrations, retreatRegistrants } from "./schema";

export const retreatRegistrationsRelations = relations(retreatRegistrations, ({one, many}) => ({
	profile: one(profiles, {
		fields: [retreatRegistrations.profileId],
		references: [profiles.id]
	}),
	retreatRegistrants: many(retreatRegistrants),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	retreatRegistrations: many(retreatRegistrations),
	retreatRegistrants: many(retreatRegistrants),
}));

export const retreatRegistrantsRelations = relations(retreatRegistrants, ({one}) => ({
	retreatRegistration: one(retreatRegistrations, {
		fields: [retreatRegistrants.registrationId],
		references: [retreatRegistrations.id]
	}),
	profile: one(profiles, {
		fields: [retreatRegistrants.profileId],
		references: [profiles.id]
	}),
}));