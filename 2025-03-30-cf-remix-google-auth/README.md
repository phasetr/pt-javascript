# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

Cloudflare上のRemixでGoogle認証を確認するだけ.
ログイン用の記録保持で必要ならD1を設定して利用する.
データベースはORMで処理し,
マイグレーションもORMで管理する.

## プロジェクトの略称

CRGA(Cloudflare Remix Google Auth)

## 基本的なインフラ

- `Cloudflare`

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

1. (手動)：`cloudflare cli`で`Remix`初期化・初期リリース
2. 認証しなければ入れないページを`auth`ディレクトリ以下に二ページ作る.
   メインページはログインページ(フォーム)があるとし,
   常に表示されるメニューにログイン・ログアウトリンクがあるとする.
   ログイン用の記録保持で必要ならD1を設定して利用する.
3. `Remix`にGoogle認証を追加する。
   <steps/2025-03-30-1332-step4.md>に沿ってGoogle Cloudのコンソールでプロジェクト設定する。
4. ローカル・サーバー双方でGoogle認証の動作を確認
5. Cloudflare上の環境を削除
6. Google Cloudのプロジェクトを削除

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

cloudflare用

```sh
mkdir <proj-name>
cd <proj-name>
npm create cloudflare@latest -- --framework=remix
wrangler dev
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
