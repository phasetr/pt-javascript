# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)
- [OpenAI Realtime conversations](https://platform.openai.com/docs/guides/realtime-conversations)
- [ORIGINAL](https://github.com/twilio-samples/speech-assistant-openai-realtime-api-node)
- APIリファレンス：[このあたり](https://platform.openai.com/docs/api-reference/realtime-server-events)に返り値の`JSON`のデータの定義がある
- 公式：[リアルタイムの会話](https://platform.openai.com/docs/guides/realtime-conversations#handling-audio-with-websockets)
  - 「`response.audio.done`および`response.done`イベントには実際には音声データは含まれず、音声コンテンツの書き起こしのみが含まれることに注意してください」
- 参考メモ：[2024-10-29 Realtime APIとTwilioを用いた電話予約デモシステムの構築](https://www.ai-shift.co.jp/techblog/4980)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

`Hono` on `Cloudflare`でWebSocketサーバーを立て、
試験的に一時間WebSocketで複数のやり取りを並行して実現させて耐久試験するためのサンプルプロジェクト。
最終的には音声のやり取り+そのまとめのメール送信まで対応するが、
いきなり長時間の実験は大変なため段階を踏んで実装・確認を進める。
メール送信は`AWS SES`を利用する。

## プロジェクトの略称

CWHDT(Cloudflare WebSocket Hono Durability Test)

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

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/cwhdt`に`cdk init`する
3. (手動)：`packages/hono-api`で`Hono`を初期化する
4. `CDK`で`SQS`・`SES`・`Lambda`を設定する.
   環境としては`dev`だけあればよくスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
   メール送信に関してテストスクリプトを準備し、簡単に動作確認できるようにする。
   環境変数は絶対に必要でない直接使わず、必ず引数で渡すようにする。
   メールアドレスは都度指定できるように引数で指定する。
   指定がない場合のデフォルトのメールアドレスは`phasetr@gmail.com`とし、
   全体の定数としてプロジェクト全体で共用する。
   `Lambda`の内容は次のステップで詳しく指定する。
5. 「クライアントとサーバーのやり取り」をクライアント,
   サーバーの順に行で区切った200KB程度のファイルとして`data/client-server-conversation.txt`を利用し、
   それを文字列として読み込む形で文字列を準備し,
   それを`SQS`に渡して`Lambda`から`SES`で指定したメールアドレスにメールを送れるか検証する.
   `SQS`に渡す時点で200KB以上ある場合、超えた分は削除し、やり取りは一部しか記録されていない旨をメールにも載せられるようにする。
   メールは件名として送信時刻を指定し、本文は`SQS`に渡した文字列を10KBまで書き、
   それ以上は省略して添付ファイルを確認するように書いておく。
   添付ファイルは常に添付し、添付ファイル名は`日付-時刻.txt`の形式にする。
   特に後で流用できるようにするため、`sendmail`のような関数を作ってそれを呼び出すようにする。
6. `Hono`に対してメール送信確認用の適切な口を一つ作り、
   上記の処理がローカルで`wrangler dev`で起動した`Hono`サーバー,
   さらにそれをCloudlareにデプロイした状態から類似のメールを送れるか検証する.
7. `SQS`でリクエスト元の情報が取れるか、
   それをログに取れるかを調べ、取れるなら`SQS`と`Lambda`のログに記録する。
8. `test-hono-email.ts`で正しくメールが送れるか調べる。
   特に`send-test-email.ts`・`send-conversation-email.ts`と件名で区別できるようにする。
9. `SQS`を介さず（`Lambda`+）`SES`でメールが送れるようにする。
10. `Hono`で`WebSocket`サーバーを実装する。
    環境変数は絶対に必要でない直接使わず、必ず引数で渡すようにする。
    クライアントから応答が来たら、応答を受けた`JST`時刻と`サーバーからの返答`のようにサーバーからの返答である旨を返すようにする。
    接続が切れた時にそこまでのやり取りの内容を発言者とともに時系列でまとめ、
    その文字列はメールの本文に書き、
    内容はテキストファイルに書き出してメールの添付ファイルとする。
    結合テスト用のスクリプトでは、クライアントはサーバーからの応答を受けた後、
    2~3秒置いてやはり`JST`時刻での送信時刻とともにサーバーにメッセージを送るようにする。
    さらにテスト用スクリプトではやり取りを続ける時間も指定でき、
    指定なしの場合は30秒とする。
    結合テスト用スクリプトはオプションでローカルかCloudflare上の環境か指定できるようにし、
    指定なしの場合はローカル環境だとする。
    サーバー・クライアントのメッセージ処理部分は後でOpenAI Realtime APIの文字列処理・音声処理と置き換える予定があるため、
    置き換えやすいように実装すること。
    特にこのメッセージ処理部分もオプションで切り替えられるようにすること。
11. OpenAI Realtime APIで文字列処理・音声処理を追加する。
   まずは文字列処理に関して結合テストを実行する。
   クライアント用のスクリプトは初期値だけ設定して、
   あとはOpenAI Realtime APIを利用して返信を生成できるようにする。
12. 文字列処理を音声処理に切り替えて対応する。
   どのように対応するべきかはまだ検討し切れていないため、後で具体的に検討・実装してテストする。
13. 環境を削除する

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

#### AWS用

```sh
mkdir -p packages/cwhdt
cdk init sample-app --language typescript
```

#### cloudflare用

```sh
mkdir <proj-name>
cd <proj-name>
pnpm create cloudflare@latest -- --framework=hono
```

機密情報の設定・削除

```sh
wrangler secret put <KEY>
wrangler secret delete <KEY>
```

`wrangler.toml`を書き換えたら次のコマンドを実行

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
