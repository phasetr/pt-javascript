# pnpm E2Eテストサンプルプロジェクト作業計画書

作成日時: 2025-07-25

## プルリクエスト

- URL: <https://github.com/phasetr/pt-javascript/pull/3>

## 概要

pnpmモノレポ構成でE2Eテストのサンプルプロジェクトを実装します。HonoX + sql.js/D1/DynamoDB混成での動作確認を行い、並列実行可能なE2Eテスト環境を構築します。

### 当初想定

>データベースつきWebアプリに対してpnpm利用でE2Eテストを書くサンプルを作るプロジェクトです。適切なE2Eテストの構成調査がメインであるため、今回は厳密なモジュラーモノリス・鉄道指向・TDDには従いません。ただしpnpmパッケージ構成としてcore, web, db-itest, e2e-testなどのパッケージ分類には従います。ある程度先は見据えつつインクリメンタルに対応します。大まかに次のような対応を考えています。
>
>- MPAフレームワークとしてHonoX利用
>- データベースはsql.js（オンメモリSQLite）, Cloudflare D1（ローカルでのwrangler利用）, DynamoDB混成で利用できるようにする
>- sql.js・DynamoDBはviteで動作、D1はwranglerで動作させる
>- D1はwranglerで開発サーバーが動作すればよく、wrangler実行でのE2Eテストは考えない
>- DynamoDBはDockerでのdynamodb-local利用
>- sql.js・DynamoDBでのE2Eが重要
>- ごく簡単なCRUDアプリを作って、初期投入データの一覧・要素追加・編集・削除のE2Eを並列実行できるようにする：DBの独立性確保と別途起動している可能性がある開発サーバー・DBとの不干渉が保てるかが重要。データのシーディング・フィクチャー適用が適切に進むかも重要
>
>対応順としては次のような形を考えています。
>
>- coreパッケージでdrizzleでのスキーマ作成とマイグレーションファイル作成
>- coreパッケージでsql.js想定のstorageを書く
>- webパッケージでvite+sql.js前提のアプリを書き、オンメモリにマイグレーション・シーディングが適用されて画面が動くか確認
>- webパッケージでwranglerでもアプリが動くか確認：すぐにできないようなら一旦断念して、まずはvite+sql.js前提のE2Eに集中（vite+sql.jsとwranglerの両立は別プロジェクトで継続対応まで含む）
>- E2Eテストを書く：URL固定などまずはとにかく動くようにする
>- E2Eテストの調整：並列実行に向けた調整
>- vite+DynamoDBでのアプリ実装・動作実験
>- DynamoDBでのE2E動作確認
>
>DynamoDBも入れる点がやや異常な構成ですが、様々な設定の場合分けの参考用で、vite, wrangler混成構成がうまく行って時間があれば最後に検討します。初めから考慮した形にしないとあとで大変更が起きてシステムが破壊されるため最初から要件として盛り込んでいるにすぎません。
>
>大まかな要件は以上の通りです。まずはブランチ・プルリクを切って作業計画を立ててください。そこでやりとりしながら細部を埋めます。

## 開発方針

- 今回は厳格なモジュラーモノリス、鉄道指向、TDDは採用しない
- E2Eテスト重視の構成
- 単体テストは作成しない
- TypeScriptの厳格な設定を採用
- biomeをリンター・フォーマッターとして使用
- lint:fixは "biome check . --fix --diagnostic-level=error" を使用
- pnpm checkコマンドは使用（テスト部分を除く）
- 項目のうちnameを一意化：同じ値を入れるテストを並列・連続で走らせて独立しているかを検証するため

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

#### ステップ1 coreパッケージの作成 - 完了

- drizzleによるdbモジュール実装
- numbersテーブル（id, name, number, created_at, updated_at）
- 基本的なCRUD操作の実装
- 初期データ5件のマイグレーション
- **評価項目**: coreパッケージのビルド成功
- **ユーザー確認後**: 作業概要と進捗を整理してコミット
- **重要な発見**: core内で(sqliteの)マイグレーションをしようとしてはならない。このために不要な`@libsql/client`が必要になり、webパッケージで事故が起きる。

#### ステップ2. webパッケージの作成（HonoX）とCRUD実装 - 完了

- HonoXのセットアップ
- 重ねて注意：厳格なモジュラーモノリス・鉄道指向・TDDは採用しない
- 画面のレイアウトは`_renderer.tsx`利用
- `tailwind`ライクに各要素に直接css適用
- numbersテーブルに対するCRUD画面
- sql.js/wrangler/DynamoDB切り替え可能な設計（実装はsql.jsのみ）
- **評価項目**: sql.jsでの開発サーバー起動と画面での動作確認（ユーザー確認必須）
- **ユーザー確認後**: 作業概要と進捗を整理してコミット
- **判断**: `drizzle`+`sql.js`+`HonoX`の連携が全くうまくいかない。この時点で`D1`利用切り替える。
- 【新タスク】D1利用に切り替える。 - 完了
  - packages/core/dbをsql.jsからD1メインに切り替える（切り替え余地は残すため`Database`型を`D1`由来のdrizzleの型のエイリアスにする）
  - packages/webをD1前提に書き換える
  - packages/dkitをD1でのセットアップに修正：wrangler d1で`ptdev`というテーブルを作成し、これの`--local`でデータベースを生成する。特にパスはルート直下の`.wrangler-persist`にする。各種ファイルの参照もここに置き換える。
  - **作業終了時**: ユーザーに報告してローカル開発環境が立ち上がってデータベース読み込みできるか確認する。
- **次回タスク**: CRUD全実装 - 完了
  - 詳細計画:
     1. 一覧表示機能 - 完了（index.tsx実装済み）
     2. 新規作成機能（/numbers/new）
        - フォーム画面の実装
        - POSTハンドラーの実装
        - **エラー処理**: バリデーションエラー時は適切なエラーメッセージを表示して入力画面に戻す
          - nameが空の場合: "Name is required"
          - numberが数値でない場合: "Number must be a valid integer"
          - 入力値を保持して再表示
     3. 編集機能（/numbers/[id]）
        - 編集フォーム画面の実装
        - GETハンドラー（既存データ取得）
        - POSTハンドラー（更新処理）
        - **エラー処理**: バリデーションエラー時は適切なエラーメッセージを表示して編集画面に戻す
          - nameが空の場合: "Name is required"
          - numberが数値でない場合: "Number must be a valid integer"
          - 入力値を保持して再表示
     4. 削除機能（/numbers/[id]/delete）
        - POSTハンドラーの実装
     5. coreパッケージへのCRUD関数追加 - 完了
        - createNumber - 実装済み
        - findNumberById - 実装済み
        - updateNumber - 実装済み
        - deleteNumber - 実装済み
     6. **全実装完了後の確認作業**
        - プロジェクトルートで定期確認（pnpm check）を実行
        - エラーがないことを確認
        - ユーザーに開発サーバー起動を依頼
        - 画面での動作確認をユーザーに依頼
          - 一覧表示
          - 新規作成（正常系・エラー系）
          - 編集（正常系・エラー系）
          - 削除

#### ステップ3. name属性の一意化対応 - 完了

- numbersテーブルのname属性にUNIQUE制約を追加
- 重複エラー時の適切なエラーハンドリング実装
- **詳細計画**:
  1. データベーススキーマとマイグレーション - 完了
     - packages/core/db/schema.tsでnameカラムにUNIQUE制約を追加
     - 新しいマイグレーションファイルの生成（drizzle-kit使用）
     - ローカルD1データベースへのマイグレーション適用
       - プロジェクトルートから`pnpm d1:migrate:local`を実行
     - sqlite3コマンドでUNIQUE制約の確認
       - sqlite3で`.wrangler-persist`のファイルを確認
       - `.schema numbers`でテーブル定義を確認
       - `UNIQUE`制約が`name`カラムに追加されていることを確認
       - `.exit`で終了
     - 既存の初期データ（0001_initial_seed.sql）の修正 - 対応済み
       - 5件のデータのnameは既に一意（"First", "Second", "Third", "Fourth", "Fifth"）
     - **作業終了時**: プロジェクトルートで定期確認（pnpm check）を実行
     - **ユーザー確認**: sqlite3でUNIQUE制約が正しく適用されているか確認を依頼
  2. コアパッケージのエラーハンドリング強化 - 完了
     - packages/core/db/operations.tsで重複エラーの適切な処理
     - UNIQUE制約違反時のエラー型定義と判定ロジック
     - createNumber/updateNumberでのエラーハンドリング追加
     - **作業終了時**: プロジェクトルートで定期確認（pnpm check）を実行
     - **ユーザー確認**: 実装したエラーハンドリングコードのレビューを依頼（画面の動作確認は別途実施）
       - エラー制御があったからとりあえずよしとした
  3. Webパッケージの画面修正 - 完了
     - 新規作成画面（/numbers/new）
       - 重複エラー時のエラーメッセージ表示: "Name already exists" - 実装済み
       - 入力値の保持とエラー状態での再表示 - 実装済み
     - 編集画面（/numbers/[id]）
       - 自分自身以外との重複チェック - 実装済み（データベース側で制御）
       - 重複エラー時のエラーメッセージ表示: "Name already exists" - 実装済み
       - 入力値の保持とエラー状態での再表示 - 実装済み
     - **作業終了時**: プロジェクトルートで定期確認（pnpm check）を実行 - 完了
     - **ユーザー確認**: 開発サーバー起動を依頼し、以下の動作確認を実施
       - 新規作成時の重複エラー確認
       - 編集時の重複エラー確認（自分自身は許可）
       - エラー発生時の入力値保持確認
       - **AIが大暴走してくれて激怒したことを怒りに任せて特記**
- **評価項目**:
  - データベーススキーマにUNIQUE制約が正しく適用されていること
  - 新規作成・編集時の重複エラーが適切に表示されること
  - プロジェクトルートでの定期確認（pnpm check）が無エラーで完了すること
- **ユーザー確認後**: 作業概要と進捗を整理してコミット

#### ステップ4. e2e-testパッケージの作成（段階的実装） - 第1段階完了

**調査結果**: Docker+Playwright+pnpm workspaceの組み合わせによる並列実行戦略は有効

- SQLite/sql.jsによるオンメモリデータベースでの高速テスト実行
- ワーカー単位でのデータベース分離
- Cloudflare D1/Wranglerとの統合によるシームレスな開発-本番移行

**第1段階実装完了**:

- e2e-testパッケージの初期設定とPlaywright設定 ✓
- webパッケージにdata-testid属性追加 ✓
- 包括的E2Eテスト実装（7テスト：CRUD全操作+バリデーション） ✓
- テスト実行環境の修正と安定化 ✓
- .gitignoreにPlaywrightファイル追加 ✓

**新修正計画**:

- 第1段階: wrangler起動での基本テスト（固定値利用）
- 第2段階: Docker環境構築と動作確認
- 第3段階: Docker並列実行実装
- 第4段階: 完全CRUD並列テスト

- 第1段階: wrangler起動での基本テスト（固定値利用） - **完了**
  - **目的**: 固定値での基本動作確認とデータベース独立性問題の検出
  - **実装完了内容**:
    - e2e-testパッケージの作成とPlaywright設定
    - data-testid属性をwebパッケージコンポーネントに追加
    - 包括的E2Eテスト実装（7テスト）:
      - 新規作成成功テスト
      - バリデーションエラーテスト（name空、number無効、両方無効）
      - 編集機能テスト（成功・バリデーションエラー）
      - 削除機能テスト
    - テスト修正対応完了:
      - コマンドエラー修正（正しいコマンド: `pnpm dev`、`pnpm test:e2e`）
      - TypeScript設定修正（@types/node追加、build/typecheckスクリプト追加）
      - input[type=number]バリデーション修正（空文字列での検証）
      - DOM選択の堅牢化（text-based selector使用）
      - strict mode違反修正（filter使用で特定要素選択）
    - **最終結果**: 7/7テストが全て成功（Chromium）
    - **.gitignore更新**: Playwrightテスト結果ファイルの除外設定追加
  - **評価項目**: wranglerでの固定URLでのE2Eテスト動作確認 ✓

**第1段階で発生した問題と対処**:

1. **コマンドエラー**: 初期提案で誤ったコマンド（`pnpm -w dev:d1`等）を提示 → 正しいコマンド（`pnpm dev`, `pnpm test:e2e`）に修正
2. **TypeScript設定不備**: e2e-testパッケージでbuild/typecheckスクリプト不足、@types/node未追加 → 追加して解決
3. **Playwright実行エラー**: input[type=number]への無効値入力、DOM選択の不安定性、strict mode違反 → text-based selector、filter使用で安定化
4. **テスト結果ファイル**: Playwrightが生成するファイルが未追跡 → .gitignoreに追加

**次段階への準備状況**: 第1段階が完全に完了し、Docker環境構築に進む準備が整った

- 第2段階: Docker環境構築と動作確認 - **完了**
  - **目的**: Docker環境でテストが正常実行されることを確認
  - **実装完了内容**:
    - Dockerfileの作成（Playwright + Node.js環境）- e2e-test用とweb用を作成
    - docker-compose.ymlの作成（アプリケーション + テスト環境）- ネットワーク設定含む
    - データベースシーディング戦略の実装 - ワーカー別DB分離スクリプト作成
    - 既存テストの無修正実行確認 - 全21テスト成功（chromium, firefox, webkit）
    - 開発用サーバーも自動起動し、開発環境に影響しないか確認 - ポート分離（8788）で実現
  - **緊急対応した問題**:
    - **wranglerネットワーク接続問題**: localhostでのみlistenしDocker内からアクセス不可
      - 対処: `--ip 0.0.0.0 --port 8788`オプション追加でネットワーク公開
    - **ローカル開発との干渉問題**: Docker環境が8787ポートを使用し競合
      - 対処: Docker環境を8788ポート、ローカル開発専用`dev:docker`コマンド作成
    - **Playwrightバージョン問題**: v1.42.1が古い
      - 対処: v1.54.1に更新
  - **評価項目**: Docker環境での既存テスト動作確認 ✓
  - **最終結果**: Docker環境で全21テストが安定動作、ローカル開発と完全分離
  
- 第3段階: Docker環境でのE2Eテスト安定化実装 - **完了**
  - **当初目標**: Docker環境での並列実行機能の実装
  - **実装方針の変更経緯**
    - 当初は並列実行（ワーカー分離）を目指していたが、調査・実装過程でwranglerでのWebサーバー起動とDB連携で分離が難しい事実が判明
    - 問題が「安全確実にE2Eが通り続ける体制作り」が最優先
    - ユーザーから「いま大事なのは時間短縮・並列化ではなく、いつでも安全確実にE2Eが通り続けるか」との明確な指示
    - 結果として**順次実行（`fullyParallel: false`, `workers: 1`）**で確実なデータベースリセット方式を採用
  - **ワーカー定義**: Playwrightが並列テスト実行のために作成する独立したNode.jsプロセス。各ワーカーは独自のブラウザインスタンスとメモリ空間を持つ。
  - **発見・解決した技術問題**:
    - **workerdプラットフォーム不一致問題**: macOSでインストールした`@cloudflare/workerd-darwin-arm64`がDockerのLinux環境で動作不能
    - **環境差異問題**: Docker環境とローカル環境でのコマンド・パス差異
    - **ファイル配置問題**: reset.sqlのプロジェクトルート散乱
  - **実装完了内容**:
    - workerdプラットフォーム問題解決（Docker内で`rm -rf node_modules && pnpm install`追加）
    - 環境判定ロジック実装（Docker: wrangler, ローカル: pnpm wrangler）
    - `reset.sql`ファイルの適切な配置（`packages/e2e-test/`内に移動）
    - beforeEachでの確実なデータベースリセット処理実現（**順次実行**）
    - 両環境でのクロスプラットフォーム対応完了
  - **最終結果**:
    - **ローカル環境**: 21/21テスト成功 ✓（順次実行）
    - **Docker環境**: 21/21テスト成功 ✓（順次実行）
    - **データベースリセット機能**: 両環境で正常動作 ✓
    - **安定性確保**: 確実なテスト実行環境の確立 ✓
  - **評価項目**: 「安全確実にE2Eが通り続ける」環境の実現 - **達成済み**
  
- 第4段階: 並列実行実装（将来検討）
  - **目的**: 既存のE2Eテスト（CRUD操作完了済み）の並列実行による時間短縮
  - **現状**:
    - **E2Eテスト実装は完了**（7テスト：CRUD全操作+バリデーション）
    - 第3段階で安定性を優先し順次実行を採用したため並列化は未実装
  - **将来実装予定**:
    - ワーカー単位でのデータベース分離実装（`worker-{id}.sqlite`ファイル分離）
    - 並列実行設定の調整（`fullyParallel: true`, `workers > 1`）
    - データ競合回避機能の実装
  - **評価項目**: 既存21テストの並列実行での安定動作とパフォーマンス向上

### フェーズ3: wrangler対応 - オンメモリSQL対応断念でフェーズ2で対応済み

1. wranglerでの開発サーバー起動
   - wrangler設定の追加
   - **評価項目**: wranglerでの画面動作確認（ユーザー確認必須）
   - **評価項目**: sql.jsでのE2Eテストが破壊されないことの確認
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

### フェーズ4: 最終確認 - 完了

1. 全体テストの実行
   - **定期確認**（pnpm check）の無エラー完了 ✓
   - E2Eテストの実行 ✓（Docker環境で全21テスト成功）
   - **ユーザー確認後**: 作業概要と進捗を整理してコミット

**第3段階完了時点での到達状況**:

- Docker環境でのE2Eテスト実行基盤が完成 ✓
- ローカル開発環境との完全分離実現 ✓
- wrangler + D1での安定動作確認 ✓
- **クロスプラットフォーム対応完了** ✓（macOS開発環境 + Linux Docker環境）
- **データベースリセット機能実現** ✓（beforeEachでの確実な初期化）
- **環境自動判定システム完了** ✓（Docker/ローカル環境の自動切り替え）

**核心目標達成**:

- **「安全確実にE2Eが通り続ける」** ✓ - 両環境で21/21テスト安定成功

### フェーズ5: 他のDBでのE2Eに向けた準備

**目的**: 現在のwrangler+D1基盤から3つの実装環境への拡張

- wrangler + D1（既存）
- Node.js + オンメモリSQLite
- Node.js + DynamoDB

#### ステップ1: 構造リファクタリング

**実装内容**:

1. 既存構成のリネーム
   - `packages/web` → `packages/wrangler`
   - `packages/e2e-test` → `packages/wrangler-e2e`
2. 共通コンポーネント化
   - `packages/web/app` → `packages/core/web`（UI共通化）
   - データアクセス層の抽象化実装
3. 起動コマンド・スクリプト設定の調整
   - ルートpackage.jsonの更新
   - Docker Compose設定の調整

**評価項目**:

- リファクタリング後のwrangler環境でのE2E動作確認（21/21テスト成功維持）
- ローカル・Docker両環境での動作確認

### フェーズ6: Node.js + オンメモリSQLite実装

**実装内容**:

1. 新規パッケージ作成
   - `packages/node-onmemsqlite`（HonoX + Node.js + sql.js/Node.js標準SQLite）
   - `packages/node-onmemsqlite-e2e`（Playwright E2E）
2. HonoXのNode.js単体起動実装
   - `@hono/node-server`使用
   - vite非依存のビルド・起動
3. オンメモリSQLiteでのDB分離
   - Playwrightワーカー単位での独立DB
   - `:memory:`オプション使用
   - 各テスト開始時のスキーマ+初期データ自動投入

**評価項目**:

- Node.js環境での安定起動
- オンメモリDB並列実行での21/21テスト成功
- Docker環境での動作確認

#### フェーズ7: Node.js + DynamoDB実装

**実装内容**:

1. 新規パッケージ作成
   - `packages/node-ddb`（HonoX + Node.js + DynamoDB local）
   - `packages/node-ddb-e2e`（Playwright E2E）
2. DynamoDB local統合
   - Docker ComposeでDynamoDB localサービス追加
   - AWS SDK v3による接続実装
   - NoSQLスキーマ設計（リレーショナル→NoSQL変換）
3. テーブル管理・データクリア機能
   - テスト前のテーブル作成・初期化
   - 各テスト後のデータクリーンアップ

**評価項目**:

- DynamoDB local環境での安定起動
- NoSQLでの21/21テスト成功（スキーマ変換後）
- Docker環境での動作確認

## 成功基準

- pnpm checkが無エラーで完了すること ✓
- **核心目標**: 「安全確実にE2Eが通り続ける」 ✓（21/21テスト安定成功）

**達成済み主要成果**:

- Docker + Playwright + pnpm workspaceによる安定E2E実行環境完成
- クロスプラットフォーム対応（macOS開発 + Linux Docker）
- データベースリセット機能による確実なテスト分離（順次実行）
- 環境自動判定による運用の簡素化
- workerdプラットフォーム問題の解決

**将来検討事項**:

- 並列実行の実装（現在は安定性優先で順次実行）
- sql.jsとDynamoDB localでのテスト動作（現在はD1のみ対応済み）
