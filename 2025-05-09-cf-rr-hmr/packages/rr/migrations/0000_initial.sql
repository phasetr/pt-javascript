-- Create users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert initial data
INSERT INTO users (name, email) VALUES
  ('山田太郎', 'taro@example.com'),
  ('佐藤花子', 'hanako@example.com'),
  ('鈴木一郎', 'ichiro@example.com'),
  ('田中美咲', 'misaki@example.com'),
  ('伊藤健太', 'kenta@example.com');

-- Create products table
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert initial product data
INSERT INTO products (name, price, description) VALUES
  ('ノートパソコン', 120000, '高性能ノートパソコン'),
  ('スマートフォン', 80000, '最新モデルのスマートフォン'),
  ('ワイヤレスイヤホン', 15000, 'ノイズキャンセリング機能付き'),
  ('スマートウォッチ', 30000, '健康管理機能搭載'),
  ('タブレット', 50000, '大画面タブレット');
