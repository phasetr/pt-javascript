CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
INSERT INTO users (id, name, email) VALUES
  (1, '田中太郎', 'tanaka@example.com'),
  (2, '佐藤花子', 'sato@example.com'),
  (3, '鈴木一郎', 'suzuki@example.com'),
  (4, '高橋美咲', 'takahashi@example.com'),
  (5, '山田健太', 'yamada@example.com');
