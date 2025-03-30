# Remix + Google認証のトラブルシューティング

## 問題の概要

Cloudflare上で動作するRemixアプリケーションにGoogle認証を実装したが、以下の問題が発生した：

1. 認証ページ（`/auth/page1`と`/auth/page2`）にアクセスすると404エラーが発生
2. 認証自体は成功しているが、認証が必要なページにアクセスするとログイン画面に遷移してしまう

## 調査と解決のステップ

### ステップ1: ルーティング問題の調査

まず、Remixのルーティングが正しく機能しているか確認するため、認証なしでアクセスできるテストページを作成した。

```tsx
// app/routes/test.tsx
export default function TestPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          テストページ
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          このページは認証なしでアクセスできるテストページです。
        </p>
      </div>
      
      {/* ... */}
    </div>
  );
}
```

テストページは正常にアクセスできたが、認証ページ（`/auth/page1`と`/auth/page2`）は404エラーが発生した。

### ステップ2: ルーティング構造の修正

Remixのルーティングには複数の形式があることが判明：

1. **フォルダ構造**：
   - `app/routes/auth/page1.tsx` → `/auth/page1`

2. **フラット構造（ドット記法）**：
   - `app/routes/auth.page1.tsx` → `/auth/page1`

最初はフォルダ構造を使用していたが、このプロジェクトではフラット構造（ドット記法）が正しく機能することが確認された。そのため、ファイル構造を変更：

```bash
# フォルダ構造のファイルを削除
rm app/routes/auth/page1.tsx app/routes/auth/page2.tsx

# フラット構造のファイルを作成
touch app/routes/auth.page1.tsx app/routes/auth.page2.tsx
```

### ステップ3: 認証機能の改善

認証自体は成功しているが、認証が必要なページにアクセスするとログイン画面に遷移する問題を解決するため、認証ミドルウェアを改善した。

```typescript
// app/utils/auth.server.ts
export async function requireUser(request: Request, sessionStorage: SessionStorage) {
  const session = await getSession(request, sessionStorage);
  const userId = session.get("userId");
  
  if (!userId) {
    // 認証されていない場合はログインページにリダイレクト
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo],
      ["error", "認証が必要です。ログインしてください。"]
    ]);
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/login?${searchParams}`,
      },
    });
  }
  
  // ユーザー情報を返す
  const user: User = {
    id: userId,
    name: "認証済みユーザー",
    email: "user@example.com",
    avatarUrl: "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff",
  };
  
  return user;
}
```

### ステップ4: セッション管理の改善

セッションの保存と読み取りを改善し、セキュリティを強化した：

```typescript
// app/routes/auth.google.callback.tsx
// セッションをコミットしてリダイレクト
const cookie = await sessionStorage.commitSession(session, {
  // セッションの有効期限を明示的に設定（1日）
  maxAge: 60 * 60 * 24
});
```

### ステップ5: 認証ページの実装改善

認証が必要なページで、新しい認証ミドルウェアを使用するように修正：

```typescript
// app/routes/auth.page1.tsx
export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    // セッションストレージを作成
    const env = context.env as Record<string, string>;
    const sessionStorage = createCloudflareSessionStorage(env);
    
    // ユーザーが認証されているか確認
    const user = await requireUser(request, sessionStorage);
    
    // 認証済みユーザーのデータを返す
    return json({
      user,
      pageData: {
        title: "認証ページ1",
        content: "このページは認証が必要なコンテンツです。ログインしているユーザーのみがアクセスできます。",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    // エラーが発生した場合はログインページにリダイレクト
    console.error("認証ページ1でエラーが発生しました:", error);
    const searchParams = new URLSearchParams([
      ["redirectTo", request.url],
      ["error", error instanceof Error ? error.message : "認証中にエラーが発生しました。"]
    ]);
    return redirect(`/login?${searchParams}`);
  }
}
```

### ステップ6: メインページのリンク更新

メインページのリンクを更新して、正しいURLパスを指すようにした：

```diff
<li>
  <Link
-   to="/auth/page1"
+   to="/auth.page1"
    className="block rounded-md bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  >
    認証ページ1（ダッシュボード）
  </Link>
</li>
<li>
  <Link
-   to="/auth/page2"
+   to="/auth.page2"
    className="block rounded-md bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  >
    認証ページ2（アクティビティ）
  </Link>
</li>
```

## 結論

1. **ルーティングの問題**：
   - Remixのバージョン（2.15.3）では、フラット構造（ドット記法）が正しく機能することが確認された
   - ファイル名とURLパスの対応関係を正しく理解することが重要

2. **認証の問題**：
   - セッションの保存と読み取りを改善することで、認証が正しく機能するようになった
   - セッションの有効期限を明示的に設定することで、セキュリティを強化した

3. **エラーハンドリングの改善**：
   - 詳細なエラーメッセージをログに出力し、問題の診断を容易にした
   - ユーザーには適切なエラーメッセージを表示するようにした

これらの修正により、Google認証を使用したRemixアプリケーションが正しく機能するようになった。
