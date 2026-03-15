import { pgTable, uuid, varchar, text, date, boolean, timestamp } from 'drizzle-orm/pg-core';

// Main sermons table
export const sermons = pgTable('sermons', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  speaker: varchar('speaker', { length: 255 }),
  date: date('date'),
  youtubeId: text('youtube_id'),
  spotifyLink: text('spotify_link'),
  articleContent: text('article_content'),
  thumbnailUrl: text('thumbnail_url'),
  audioUrl: text('audio_url'),
  isPublic: boolean('is_public').default(true).notNull(),
  inPodcastFeed: boolean('in_podcast_feed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Sermon = typeof sermons.$inferSelect;
export type NewSermon = typeof sermons.$inferInsert;
