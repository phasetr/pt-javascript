-- E2Eテスト用データベースリセットスクリプト
-- 全データを削除してオートインクリメントをリセット後、初期データを再投入

-- numbersテーブルの全データを削除
DELETE FROM numbers;

-- オートインクリメントIDをリセット
DELETE FROM sqlite_sequence WHERE name='numbers';

-- 初期データを再投入
INSERT INTO numbers (name, number, created_at, updated_at) VALUES 
('First', 1, datetime('now'), datetime('now')),
('Second', 2, datetime('now'), datetime('now')),
('Third', 3, datetime('now'), datetime('now')),
('Fourth', 4, datetime('now'), datetime('now')),
('Fifth', 5, datetime('now'), datetime('now'));