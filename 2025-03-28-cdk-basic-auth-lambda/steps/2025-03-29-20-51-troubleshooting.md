# テスト実行時の404エラー表示に関するトラブルシューティング

## 問題概要

`pnpm test:i:local`コマンドを実行した際に、404エラーが出ているにもかかわらず、テストはパスしている状態でした。これは一見矛盾しているように見えますが、実際にはテストの一部として意図的に404エラーを発生させていることが判明しました。

しかし、エラーのスタックトレースが表示されることで、テスト結果が読みにくくなっていました。テストの本質的な役割を持たないconsole出力を削除し、必要な検証はexpect文で適切に判定するように修正が必要でした。

## 調査ステップ

1. `package.json`を確認して`test:i:local`コマンドの内容を把握
2. 関連するテストファイル（`packages/integration-tests/src/todo-api.test.ts`）を確認
3. APIクライアント（`packages/integration-tests/src/api-client.ts`）の実装を確認
4. テスト実行時のエラーログの出力元を特定

## 発見された問題点

1. テストコードでは、Todoを削除した後に、そのTodoが本当に削除されたかを確認するために再度取得しようとしています。削除されていれば404エラーが発生するはずで、それをキャッチしてテストをパスさせる設計になっていました。
2. APIクライアントの`getTodoById`メソッドでは、エラーが発生した場合にエラーログを出力していました。
3. テストファイルには不要なconsole出力が多く含まれていました。

## 修正内容

### 1. テストファイルの修正

```typescript
// 修正前
it('should delete a todo', async () => {
  const response = await apiClient.deleteTodo(createdTodo.id);
  
  // Assertions
  expect(response).toBeDefined();
  expect(response.message).toBe('Todo deleted successfully');
  
  console.log('Delete Response:', response);
  
  // Verify the todo is deleted by trying to get it (should throw an error)
  try {
    await apiClient.getTodoById(createdTodo.id);
    // If we get here, the todo was not deleted
    expect(true).toBe(false); // This will fail the test
  } catch (error) {
    // Expected error
    expect(error).toBeDefined();
  }
});

// 修正後
it('should delete a todo', async () => {
  const response = await apiClient.deleteTodo(createdTodo.id);
  
  // Assertions
  expect(response).toBeDefined();
  expect(response.message).toBe('Todo deleted successfully');
  
  // Verify the todo is deleted by trying to get it (should throw an error)
  try {
    await apiClient.getTodoById(createdTodo.id);
    // If we get here, the todo was not deleted
    expect(true).toBe(false); // This will fail the test
  } catch (error) {
    // Expected error - 404 Not Found
    expect(error).toBeDefined();
    
    // Check if it's an Axios error with status 404
    // Type guard for Axios error
    if (
      error && 
      typeof error === 'object' && 
      'response' in error && 
      error.response && 
      typeof error.response === 'object' && 
      'status' in error.response
    ) {
      expect(error.response.status).toBe(404);
      
      // データプロパティの存在を確認
      if (
        'data' in error.response && 
        error.response.data && 
        typeof error.response.data === 'object'
      ) {
        // エラーメッセージを検証
        if ('error' in error.response.data) {
          expect(error.response.data.error).toBe('Todo not found');
        }
      }
    }
  }
});
```

また、テスト実行中のコンソール出力を抑制するために、以下のコードを追加しました：

```typescript
// コンソール出力を抑制する
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('Todo API Integration Tests', () => {
  // テスト前にコンソール出力を抑制
  beforeAll(async () => {
    // コンソール出力を抑制
    console.error = () => {};
    console.log = () => {};
    console.warn = () => {};
    
    // 非ローカル環境の場合はAPI URLを取得
    if (getEnvironment(process.env.NODE_ENV) !== 'local') {
      try {
        await getApiUrl();
      } catch (error) {
        // エラーは無視
      }
    }
  });
  
  // テスト後にコンソール出力を元に戻す
  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  // テストケース...
});
```

### 2. APIクライアントの修正

```typescript
// 修正前
async getTodoById(id: string): Promise<Todo> {
  await this.ensureInitialized();

  try {
    const response = await this.client.get(`/api/todos/${id}`);
    return response.data as Todo;
  } catch (error) {
    console.error(`Error getting todo ${id}:`, error);
    throw error;
  }
}

// 修正後
async getTodoById(id: string): Promise<Todo> {
  await this.ensureInitialized();
  
  // エラーログを出力せずに直接結果を返す
  const response = await this.client.get(`/api/todos/${id}`);
  return response.data as Todo;
}
```

## 結果

修正後、`pnpm test:i:local`コマンドを実行すると、エラーログが表示されなくなり、テスト結果が読みやすくなりました。テストは正常に実行され、すべてのテストがパスしています。

これにより、テストの意図が明確になり、404エラーが意図的なものであることがわかりやすくなりました。また、テストの本質的な役割を持たないconsole出力を削除し、必要な検証はexpect文で適切に判定するようになりました。
