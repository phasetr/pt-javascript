# Remix APIプロジェクトドキュメント作成プロンプト

**作成日時**: 2025年3月24日 10:05
**更新日時**: 2025年3月24日 10:38

## プロンプト内容

```
このプロジェクトに関するドキュメントを作成してください。特に起動法とcurlによるAPIの挙動確認手順を冒頭にまとめてください。
```

```
Honoを利用してWebSocketの簡単なサーバーも実装してください。
```

```
websocketの動作確認はブラウザからではなくAPIとしてコマンドラインからwscatで動作確認できるように実装し、ドキュメントにもその前提で記録してください。
```

## 対応内容

1. プロジェクトの構造を分析
   - `git status`でGitの状態を確認
   - `ls -la`でファイル一覧を確認
   - `README.md`、`package.json`などの基本ファイルを読み込み
   - `app`ディレクトリの構造を確認
   - APIエンドポイントのコードを確認

2. ドキュメントの作成
   - `docs/README.md`ファイルを作成
   - 以下のセクションを含むドキュメントを作成:
     - 起動方法（開発環境と本番環境）
     - APIエンドポイントの説明
     - curlによる挙動確認手順
     - プロジェクト概要
     - ディレクトリ構造
     - 開発ガイド

3. WebSocket機能の実装
   - Honoを使用したSSE (Server-Sent Events) ベースのリアルタイム通信サーバーを実装
   - `app/routes/api.websocket.tsx`ファイルを作成
   - メッセージ履歴の保存機能を実装
   - コマンドラインからの操作に適したAPIエンドポイントを設計

4. コマンドラインからの動作確認機能
   - SSEストリームエンドポイント (`/api/websocket/stream`) を実装
   - メッセージ一覧取得エンドポイント (`/api/websocket`) を実装
   - メッセージ送信エンドポイント (`/api/websocket/send`) を実装
   - curlコマンドでの動作確認手順をドキュメントに追加

5. wscatを使用した動作確認機能
   - WebSocketプロキシ (`websocket-proxy.js`) を実装
   - SSEとWebSocketの間でメッセージを変換する機能を実装
   - wscatを使用した接続方法をドキュメントに追加
   - WebSocketプロキシの使用方法に関するREADMEを作成

6. ドキュメントの更新
   - コマンドラインからの動作確認手順を詳細に記載
   - SSEの実装詳細と使用方法を説明
   - curlとwscatを使用したメッセージ送信方法を追加
   - 複数ターミナルでのテスト方法を説明

7. プロンプト記録
   - `prompts`ディレクトリを作成
   - 日時を含むファイル名でプロンプトを記録

## 実行結果

- `docs/README.md`: Remix APIプロジェクトのドキュメント（コマンドラインからの動作確認手順を含む）
- `app/routes/api.websocket.tsx`: SSEベースのリアルタイム通信サーバー実装
- `websocket-proxy.js`: WebSocketプロキシの実装（SSEとWebSocketの間でメッセージを変換）
- `README-websocket.md`: WebSocketプロキシの使用方法に関するドキュメント
- `prompts/20250324_1005_remix_api_documentation.md`: プロンプト記録

## 再現手順

1. Remixプロジェクトのルートディレクトリで実行
2. プロジェクトに`app/routes/api.example.tsx`と`app/routes/api.hono.tsx`のようなAPIエンドポイントが存在することを確認
3. 上記のプロンプトを実行
4. 開発サーバーを起動して以下のコマンドでAPIを確認:
   ```bash
   # メッセージ一覧の取得
   curl http://localhost:5173/api/websocket
   
   # リアルタイムストリームの開始
   curl -N http://localhost:5173/api/websocket/stream
   
   # メッセージの送信
   curl -X POST -H "Content-Type: application/json" -d '{"message":"テスト"}' http://localhost:5173/api/websocket/send
   ```

5. wscatを使用してWebSocketプロキシに接続:
   ```bash
   # 必要な依存関係をインストール
   npm install ws eventsource
   
   # WebSocketプロキシを起動
   node websocket-proxy.js
   
   # 別のターミナルでwscatをインストールして接続
   npm install -g wscat
   wscat -c ws://localhost:8080
   ```

## 変更履歴

- 2025年3月24日 10:05: 初回作成
- 2025年3月24日 10:20: WebSocket機能の実装を追加
- 2025年3月24日 10:27: コマンドラインからの動作確認手順を追加
- 2025年3月24日 10:30: ブラウザからの確認用ファイルを削除し、コマンドラインのみの確認に変更
- 2025年3月24日 10:38: wscatを使用したWebSocket接続のためのプロキシを実装
