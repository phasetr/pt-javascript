CREATE TABLE `numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

-- 初期データ5件
INSERT INTO `numbers` (`name`, `number`, `created_at`, `updated_at`) VALUES 
('One', 1, datetime('now'), datetime('now')),
('Two', 2, datetime('now'), datetime('now')),
('Three', 3, datetime('now'), datetime('now')),
('Four', 4, datetime('now'), datetime('now')),
('Five', 5, datetime('now'), datetime('now'));
