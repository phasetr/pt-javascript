# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

適切なデータを渡した上でキューを詰めて,
渡したデータをもとに適切な処理をして適切な送信元にメールを送るサービス.

## プロジェクトの略称

CQLM(Cdk Queue Lambda Mail)

## 基本的なインフラ

- `AWS`

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切なjsまたはtsプログラム(jsまたはtsファイル)としてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`年月日-時間-step.md`として記録してください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/cqlm`に`cdk init`する
3. `Lambda`用のパッケージを作成する.
   単純な処理とメール送信しかしないため,
   何かのフレームワークは利用しないでよい.
4. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`だけでスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
5. `Lambda`で次のような処理を実装する.
   - 受け取った文字列データに対して適切な文言を追加してメールの文面を作成する.
   - 適切な送信先にメールを送信する.
     送信先は固定値で複数用意しておき,
     ランダムで選ぶようにする.
     メールの送信先はgmailなど一般の送信先とする.
6. `AWS`にデプロイして動作検証する.
   特にキューイングが確実にわかる形で検証できるような手法を検討する.

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

AWS用

```sh
mkdir -p packages/<proj-name>
cdk init sample-app --language typescript
```
