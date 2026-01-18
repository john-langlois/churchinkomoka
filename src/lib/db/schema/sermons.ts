import { pgTable, uuid, varchar, text, date, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Main sermons table
export const sermons = pgTable('sermons', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  speaker: varchar('speaker', { length: 255 }).notNull(),
  date: date('date').notNull(),
  thumbnail: text('thumbnail'), // URL
  youtubeId: varchar('youtube_id', { length: 50 }),
  spotifyLink: text('spotify_link'), // URL
  articleContent: jsonb('article_content').$type<{
    intro: string;
    paragraphs: string[];
    takeaways: string[];
  }>(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Sermon = typeof sermons.$inferSelect;
export type NewSermon = typeof sermons.$inferInsert;
