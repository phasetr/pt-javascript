# README

- [参考：2025-01-22 Remix + Cloudflare Pages + D1を使ってみる](https://zenn.dev/sinozu/articles/aa84ccc957ef1e)
- [参考：Drizzle Kitでデータベースマイグレーションを行う](https://zenn.dev/satonopan/articles/9182a9eda4d574)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

Cloudflare Workers上でReact Router+D1(+Drizzle ORM)での開発環境を構成するサンプル.
三項目だけを持つごく簡潔なテーブルを作り,
そのCRUD処理に関するページを作る.
ローカル開発環境は自動リロードが効く上で`wrangler dev`で動作するようにしたい.

## プロジェクトの略称

CRD(Cloudflare RR D1)

## 基本的なインフラ

- `Cloudflare`

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切な`typescript`のプログラムとしてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
設計・実装方針としてできる限り副作用,
とりわけ環境変数は利用せず,
環境変数を利用する場合は関数の引数として与えるようにし,
関数の純粋性・テスタビリティを確保してください.
テスト用スクリプトも原則として`typescript`で書いて実行してください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`年月日-時間-step.md`として記録してください.
環境ごとに区別が必要な場合,
ローカル開発環境は`local`,
サーバー上の本番環境は`prod`として識別します.
全ての手順が終わったら`doc/manual.md`に使い方・テストの注意をまとめてください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/rr`で`React Router`を初期化する
3. `Drizzle ORM`を前提にユーザーのテーブルを作り,
   マイグレーション・初期データ作成・ローカルのテーブル作成・リモートへの反映を一通り済ませる.
4. React RouterでCRUD処理のページを作る.
5. (手動)動作確認する.
6. 環境を削除する

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

#### cloudflare用

`pnpm create cloudflare@latest -- --framework=remix`では,
`Framework Starter`から`React Router (formerly Remix)`を選ぶ。

```sh
npm install -g wrangler@latest
mkdir -p packages/rr
cd packages/rr
pnpm create cloudflare@latest -- --framework=react-router
wrangler d1 create crd-sample-db
```

`wrangler d1 create crd-sample-db`で出てきた記述を`wrangler.jsonc`に追加する.

次の内容で`schema.sql`を作成.

```sql
DROP TABLE IF EXISTS Customers;
CREATE TABLE IF NOT EXISTS Customers (CustomerId INTEGER PRIMARY KEY, CompanyName TEXT, ContactName TEXT);
INSERT INTO Customers (CustomerID, CompanyName, ContactName) VALUES (1, 'Alfreds Futterkiste', 'Maria Anders'), (4, 'Around the Horn', 'Thomas Hardy'), (11, 'Bs Beverages', 'Victoria Ashworth'), (13, 'Bs Beverages', 'Random Name');
```

```sh
npx wrangler d1 execute crd-sample-db --local --file=./schema.sql
npx wrangler d1 execute crd-sample-db --local --command="SELECT * FROM Customers"
pnpm run typecheck
```

本番環境に反映する方法

```sh
npx wrangler d1 execute crd-sample-db --remote --file=./schema.sql
```

`wrangler dev --port 3000`などとすれば`wrangler`での起動でもポートが固定できるため,
必要に応じて利用すること.

##### misc

機密情報の設定・削除

```sh
wrangler secret put <KEY>
wrangler secret delete <KEY>
```

`wrangler.jsonc`を書き換えたら次のコマンドを実行

```sh
npm run typegen
```

```sh
npm run deploy
```

```sh
wrangler delete
```

アカウントの確認

```sh
wrangler whoami
```

アカウントの切り替え

```sh
wrangler logout
wrangler login
```
