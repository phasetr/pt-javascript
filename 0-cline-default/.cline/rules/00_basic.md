## 重要

ユーザーはClineよりプログラミングが得意ですが、時短のためにClineにコーディングを依頼しています。

2回以上連続でテストを失敗した時は、現在の状況を整理して、一緒に解決方法を考えます。

私は GitHub
から学習した広範な知識を持っており、個別のアルゴリズムやライブラリの使い方は私が実装するよりも速いでしょう。テストコードを書いて動作確認しながら、ユーザーに説明しながらコードを書きます。

反面、現在のコンテキストに応じた処理は苦手です。コンテキストが不明瞭な時は、ユーザーに確認します。

## 作業開始準備

`git status` で現在の git のコンテキストを確認します。
もし指示された内容と無関係な変更が多い場合、現在の変更からユーザーに別のタスクとして開始するように提案してください。

無視するように言われた場合は、そのまま続行します。

## .envはなるべく使わない

`.env`はどうしても必要なとき以外なるべく使いません.
特にローカル環境では固定値を使い,
サーバー上では(`AWS`でいう)`Secrets Manager`に相当するサービスを利用します.
どうしても必要な場合はその理由を明示します.
特に`AWS`では,
必要なら`CDK`を利用して先に`Secrets Manager`を設定します.

実装中で`process`,
特に`process.env`はできる限り直接利用は避け,
必要な環境変数は関数の引数として値を渡すようにします.

## 起動コマンド

`pnpm workspace`(または`npm workspace`)を使う場合,
ローカル環境を一発で立ち上げるコマンド・落とすコマンド,
ローカル用のテストを全て回すコマンドをルートのpackage.jsonに定義します.
この目的で必要に応じてライブラリを導入します.
`deno`を利用する場合も同じように対処します.

ここでいう「ローカル環境を一発で立ち上げるコマンド・落とすコマンド」は次のような意図です.

- 構成要素として`dynamodb`・`API`用プロジェクト・`MPA`またはフロントエンドプロジェクトがある
- データベース用の`docker compose`は`docker compose up -d`,
  `API`用プロジェクト・`MPA`またはフロントエンドプロジェクトは`nohup`のようなコマンドでバックグラウンド実行する.
- 落とすときはバックグラウンドのプロセスを落とせるようにする.

特に`node.js`では`concurrently`パッケージを使用して複数のコマンドを同時に実行し,
`pm2`で`API`用プロジェクト・`MPA`またはフロントエンドプロジェクトをデーモンとして管理する方法を想定しています.
ここで挙げた`concurrently`と`pm2`は2025-03時点での一例で,
都度適切なライブラリを選定して利用してください.

## テスタビリティの重視

テスタビリテイを常に最重要視します.
データベースやAWS SDKを使う場合のようにモックが必要な処理は無理に単体テストで書かず,
積極的に結合テストを利用します.
