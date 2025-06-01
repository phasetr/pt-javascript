# hono-apiのCRUD実装と共有D1データベース

## ユーザーからの指示

> hono-apiもルート直下の.wrangler-persistのSQLiteを見る形でCRUDのAPIを書いてください。

## 対応内容

### 1. 共有データベースの設定

#### 1.1 独自.wranglerディレクトリの削除

```bash
cd packages/hono-api && rm -rf .wrangler
```

hono-apiが独自に持っていた`.wrangler`ディレクトリを削除し、ルートの`.wrangler-persist`を使うように設定。

#### 1.2 package.jsonの設定

既に`--persist-to ../../.wrangler-persist`オプションが設定済みであることを確認：

```json
"dev": "wrangler dev --persist-to ../../.wrangler-persist"
```

### 2. CRUD APIの実装

#### 2.1 既存のエンドポイント

- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `GET /api/users/:id` - ユーザー詳細取得

#### 2.2 新規追加したエンドポイント

- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除

#### 2.3 実装の詳細

**ユーザー更新 (PUT)**:

```typescript
app.put('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { email, name } = body
    
    const db = createD1Db(c.env.DB)
    const updateData: any = {}
    
    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name
    
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json(result[0])
  } catch (error) {
    console.error('Error updating user:', error)
    return c.json({ error: 'Failed to update user' }, 500)
  }
})
```

**ユーザー削除 (DELETE)**:

```typescript
app.delete('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = createD1Db(c.env.DB)
    
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ message: 'User deleted successfully', user: result[0] })
  } catch (error) {
    console.error('Error deleting user:', error)
    return c.json({ error: 'Failed to delete user' }, 500)
  }
})
```

### 3. CORS対応

クロスオリジンリクエストを許可するため、CORS middlewareを追加：

```typescript
import { cors } from 'hono/cors'

// CORSを有効化
app.use('/*', cors())
```

### 4. テスト用HTMLファイルの作成

`packages/hono-api/test-api.html`を作成し、以下の機能を実装：

- ユーザー一覧取得
- 新規ユーザー作成（プロンプトで入力）
- ユーザー詳細取得
- ユーザー更新
- ユーザー削除（確認付き）

### 5. データベースファイルの確認

```bash
find . -name "*.sqlite" -type f
# 結果：
# ./packages/hono-api/.wrangler/... (削除済み)
# ./.wrangler-persist/v3/d1/miniflare-D1DatabaseObject/....sqlite
```

共通の`.wrangler-persist`ディレクトリのみにSQLiteファイルが存在することを確認。

### 6. 技術的な詳細

#### 6.1 Drizzle ORMの使用

- `createD1Db`関数でD1データベースインスタンスを作成
- `drizzle-orm`の`eq`関数で条件指定
- `.returning()`で更新・削除後のデータを返却

#### 6.2 エラーハンドリング

- try-catchブロックで例外をキャッチ
- 適切なHTTPステータスコード（400, 404, 500）を返却
- エラーログをコンソールに出力

#### 6.3 リクエストバリデーション

- POSTリクエストでemailの必須チェック
- PUTリクエストで部分更新に対応（undefinedチェック）

### 7. 成果物

- 完全なCRUD APIの実装
- React Routerと同じD1データベースを共有
- CORS対応でクロスオリジンアクセス可能
- テスト用HTMLファイルで動作確認可能

### 8. 動作確認

1. hono-apiの起動：

   ```bash
   cd packages/hono-api
   pnpm dev
   ```

2. APIエンドポイントへのアクセス：
   - ブラウザで <http://localhost:8787> にアクセス
   - test-api.htmlをブラウザで開く
   - curlコマンドでAPIを直接叩く

これにより、hono-apiとReact Routerが同じD1データベース（`.wrangler-persist`内）を共有し、両方からCRUD操作が可能になった。
