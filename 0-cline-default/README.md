# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

要記述

## プロジェクトの略称

要記述

## 基本的なインフラ

- `AWS`
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
サーバー上の開発環境は`dev`,
サーバー上の本番環境は`prod`として識別します.
サーバー上の環境が一つしかない場合は`prod`を採用してください.
全ての手順が終わったら`doc/manual.md`に使い方・テストの注意をまとめてください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/<プロジェクトの略称>`に`cdk init`する
3. (手動)：`packages/hono-api`で`Hono`を初期化する
4. (手動)：`packages/remix`で`Remix`を初期化する
5. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`と`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
6. `DynamoDB`のプロジェクトを作り、簡単な二種類のテーブルを作り、
   それらに対するCRUD操作とテストを書く。
7. `Hono`と`Remix`から`DynamoDB`を呼び出せるようにする。テストも書く。
8. ローカル・AWS上の開発環境に対する簡易結合テストを作成する。
   APIは全てを一通り叩いて結果が返るか確認する。
   環境指定で`local`・`dev`・`prod`を選べるようにし、適切な環境を指定して簡易結合テストできるようにする.
   この指定がない場合は自動的に`local`になるとする。
9. 環境を削除する

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

#### AWS用

```sh
corepack enable && corepack prepare pnpm@latest --activate
asdf reshim nodejs
pnpm -v
pnpm init

mkdir -p packages/<proj-name>
cd packages/<proj-name>
cdk init sample-app --language typescript
rm -rf test

pnpm create hono@latest packages/hono-api
pnpm dlx create-remix@latest packages/remix
```

#### cloudflare用

`pnpm create cloudflare@latest -- --framework=remix`では,
`Framework Starter`から`React Router (formerly Remix)`を選ぶ。

```sh
npm install -g wrangler@latest

mkdir -p packages/<proj-name>-api
cd packages/<proj-name>-api
pnpm create cloudflare@latest -- --framework=hono
mv packages/<proj-name>-api packages/hono-api

mkdir -p packages/remix
pnpm create cloudflare@latest -- --framework=remix
wrangler d1 create <proj-name>-db
```

`wrangler d1 create <proj-name>-db`で出てきた記述を`wrangler.jsonc`に追加する.

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

本番環境に反映する方法：最終的にはきちんと`CI/CD`に設定すること.

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

#### リファクタリング時のお勧めプロンプト

- [オリジナル](https://zenn.dev/erukiti/articles/2503-cline-express)

>このプロジェクトはAIが作り上げた。現在、このプロジェクトの利用者は存在しない
>
>あなたには、コードの一貫性のなさや重複などを削除し技術的負債を軽減してほしい。
>ただし、過去の失敗を見るに、一気にやろうとする、
>あるいは中途半端な進め方をすると同じように失敗し、
>さらに一貫性のなさ・乱立が進むだけだろうと懸念している。
>そこで、そうならないための方法を考えてほしい
>
>- **開発者は一人であり、API利用者はまだ存在しない。移行期間・互換性維持は不要**
>- **互換性を残すな。すべて消せ**
>- すべてのdeprecatedのコードを削除しろ
>- **新しい仕組みへの中間状態を作るな**
>- anyを使用しないこと。型安全を努力しろ
>- classを極力使わず関数で実装しろ。関数は単体テストしろ
>- 不要なコメントを削除しろ。食い違いのあるコメントは修正しろ
>- 性能は二の次、シンプルにしろ
>
>計画が大規模すぎると失敗する。
>現実的な粒度で解決してほしい。
>また、今後も設計・実装を行うのはAIである。
>それ故にAIに可能な手段で考えろ。
>今回のあなたの提案はそれ一つで全問題を解決することを考えるな。
>AIだから無限に働ける。
>何度もリトライできる。
>
>技術的負債解消は今回だけでは終わらない。
>一段目の取り組みとして何をやるべきか考えろ。
>
>**技術的負債を根本解決するたった一つだけを考えろ。それ以外の余計なことを考えるな。排除しろ。提案するな。たった一つだけをやれ**
