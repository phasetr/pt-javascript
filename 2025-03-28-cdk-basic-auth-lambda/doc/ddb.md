# DynamoDBの設計

## Todoテーブル

| 論理名     | 物理名    | 型   | 備考                                |
|------------+-----------+------+-------------------------------------|
| ID         | id        | S    | HASH（パーティションキー）          |
| タイトル   | title     | S    |                                     |
| 完了フラグ | completed | BOOL |                                     |
| 期日       | dueDate   | S    |                                     |
| ユーザーID | userId    | S    | ユーザーIDで検索するためにGSIを設定 |
| 作成日     | createdAt | S    |                                     |
| 更新日     | updatedAt | S    |                                     |

## CRUD処理一覧

| 操作          | HTTPメソッド | エンドポイント          | 説明                       | リクエストボディ                                        | レスポンス                                |
|---------------+--------------+-------------------------+----------------------------+---------------------------------------------------------+-------------------------------------------|
| Create        | POST         | /api/todos              | 新しいTodoを作成           | userId, title, completed, dueDate(optional)             | 201 Created, 作成されたTodo               |
| Read (All)    | GET          | /api/todos/user/:userId | 特定ユーザーの全Todoを取得 | -                                                       | 200 OK, Todoの配列                        |
| Read (Single) | GET          | /api/todos/:id          | 特定のTodoを取得           | -                                                       | 200 OK, Todoオブジェクト or 404 Not Found |
| Update        | PUT          | /api/todos/:id          | Todoを更新                 | title(optional), completed(optional), dueDate(optional) | 200 OK, 更新されたTodo                    |
| Delete        | DELETE       | /api/todos/:id          | Todoを削除                 | -                                                       | 200 OK, 削除成功メッセージ                |
