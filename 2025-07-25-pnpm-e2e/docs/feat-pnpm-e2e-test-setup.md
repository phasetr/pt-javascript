# pnpm E2Eテストサンプルプロジェクト作業計画書

作成日時: 2025-07-25

## プルリクエスト

- URL: <https://github.com/phasetr/pt-javascript/pull/3>

## 概要

pnpmモノレポ構成でE2Eテストのサンプルプロジェクトを実装します。HonoX + sql.js/D1/DynamoDB混成での動作確認を行い、並列実行可能なE2Eテスト環境を構築します。

## 開発方針

- 今回は厳格なモジュラーモノリス、鉄道指向、TDDは採用しない
- E2Eテスト重視の構成
- 単体テストは作成しない
- TypeScriptの厳格な設定を採用
- biomeをリンター・フォーマッターとして使用
- lint:fixは "biome check . --fix --diagnostic-level=error" を使用
- pnpm checkコマンドは使用（テスト部分を除く）

## 作業計画

### フェーズ1: プロジェクト初期設定 - 完了

1. pnpmワークスペースの設定
   - pnpm-workspace.yamlの作成
   - ルートpackage.jsonの設定
   - TypeScript/biome設定
   - **評価項目**: pnpm checkコマンドの設定と動作確認
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

#### 対応内容

1. pnpmワークスペースの設定完了
   - pnpm-workspace.yaml作成
   - ルートpackage.json作成（TypeScript + biome設定）
   - tsconfig.json作成（厳格な設定）
   - biome.json作成（リンター・フォーマッター設定）
   - .gitignore作成
   - pnpm checkコマンドの動作確認完了

**確認事項**:

- pnpm install成功
- pnpm check動作確認（リント・ビルド・型チェック）
- biomeによるフォーマット適用

### フェーズ2: パッケージ構成

1. coreパッケージの作成 - 完了
   - drizzleによるdbモジュール実装
   - numbersテーブル（id, name, number, created_at, updated_at）
   - 基本的なCRUD操作の実装
   - 初期データ5件のマイグレーション
   - **評価項目**: coreパッケージのビルド成功
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット
   - **重要な発見**: core内で(sqliteの)マイグレーションをしようとしてはならない。このために不要な`@libsql/client`が必要になり、webパッケージで事故が起きる。

2. webパッケージの作成（HonoX）とCRUD実装
   - HonoXのセットアップ
   - 重ねて注意：厳格なモジュラーモノリス・鉄道指向・TDDは採用しない
   - 画面のレイアウトは`_renderer.tsx`利用
   - `tailwind`ライクに各要素に直接css適用
   - numbersテーブルに対するCRUD画面
   - sql.js/wrangler/DynamoDB切り替え可能な設計（実装はsql.jsのみ）
   - **評価項目**: sql.jsでの開発サーバー起動と画面での動作確認（ユーザー確認必須）
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

3. e2e-testパッケージの作成（段階的実装）
   - 第1段階: 手動起動のWebサーバーに対するテスト（固定URL）
     - Playwrightの基本設定
     - **評価項目**: 固定URLでのE2Eテスト動作確認
     - **ユーザー確認後**: 作業概要と進捗を整理してコミット
   - 第2段階: Webサーバーの自動起動対応
     - ポート独立性の確保
     - **評価項目**: 自動起動でのE2Eテスト動作確認
     - **ユーザー確認後**: 作業概要と進捗を整理してコミット
   - 第3段階: オンメモリDB利用と並列実行
     - **評価項目**: E2Eテストの並列実行成功
     - **ユーザー確認後**: 作業概要と進捗を整理してコミット

### フェーズ3: wrangler対応

1. wranglerでの開発サーバー起動
   - wrangler設定の追加
   - **評価項目**: wranglerでの画面動作確認（ユーザー確認必須）
   - **評価項目**: sql.jsでのE2Eテストが破壊されないことの確認
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

### フェーズ4: DynamoDB対応

1. DynamoDB実装
   - DynamoDB localの設定
   - storage層のDynamoDB実装
   - **評価項目**: DynamoDBでの画面動作確認
   - **評価項目**: DynamoDBでのE2Eテスト動作
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

### フェーズ5: 最終確認

1. 全体テストの実行
   - **定期確認**（pnpm check）の無エラー完了
   - E2Eテストの実行
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

## 成功基準

- pnpm checkが無エラーで完了すること
- E2Eテストが並列実行可能なこと
- sql.jsとDynamoDB localの両方でテストが動作すること
