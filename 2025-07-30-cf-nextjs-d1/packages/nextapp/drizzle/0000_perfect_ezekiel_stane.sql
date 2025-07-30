CREATE TABLE `numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`created_at` integer NOT NULL
);

--> statement-breakpoint
-- Initial seed data for numbers table
INSERT INTO numbers (name, number, created_at) VALUES
  ('First Number', 42, strftime('%s', 'now')),
  ('Second Number', 100, strftime('%s', 'now')),
  ('Third Number', 256, strftime('%s', 'now')),
  ('Fourth Number', 512, strftime('%s', 'now')),
  ('Fifth Number', 1024, strftime('%s', 'now'));
