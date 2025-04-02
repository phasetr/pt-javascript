# トラブルシューティング: Cloudflare WorkersでのAWS認証情報エラー

## 発生した問題

Hono APIからメール送信機能を呼び出した際に、以下のエラーが発生しました：

### 問題1: AWS認証情報の不足

```txt
Error getting stack output: Error: Credential is missing

      at credentialDefaultProvider
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/node_modules/.pnpm/@aws-sdk+client-cloudformation@3.777.0/node_modules/@aws-sdk/client-cloudformation/dist-es/runtimeConfig.browser.js:22:102)
      at fn
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/node_modules/.pnpm/@aws-sdk+core@3.775.0/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js:127:35)
      at null.<anonymous>
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/node_modules/.pnpm/@smithy+core@3.2.0/node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/httpAuthSchemeMiddleware.js:31:29)
      at null.<anonymous> (async
  file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/packages/hono-api/.wrangler/tmp/dev-DjJF0G/index.js:4506:22)
      at async getStackOutput
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/packages/aws-utils/src/index.ts:33:22)
      at async sendEmail
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/packages/aws-utils/src/index.ts:85:5)
```

### 問題2: processオブジェクトが定義されていない

```txt
✘ [ERROR] ReferenceError: process is not defined

      at null.<anonymous>
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/packages/hono-api/src/index.ts:28:5)
      at dispatch
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/node_modules/.pnpm/hono@4.7.5/node_modules/hono/dist/compose.js:22:23)
      at null.<anonymous>
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/node_modules/.pnpm/hono@4.7.5/node_modules/hono/dist/compose.js:22:46)
      at cors2
  (file:///Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/node_modules/.pnpm/hono@4.7.5/node_modules/hono/dist/middleware/cors/index.js:74:11)
```

## 原因

1. **AWS認証情報の不足**:
   - Cloudflare Workers環境（wrangler dev）では、ローカルのAWS認証情報（~/.aws/credentials）にアクセスできません。
   - aws-utilsパッケージのsendEmail関数は、SNSトピックARNが指定されていない場合、CloudFormationからARNを取得しようとします。
   - CloudFormationからARNを取得するには、AWS認証情報が必要です。

2. **環境の違い**:
   - ローカル環境（Node.js）では、AWS SDKは自動的に~/.aws/credentialsからAWS認証情報を読み込みます。
   - Cloudflare Workers環境では、AWS認証情報を明示的に提供する必要があります。

## 解決策

1. **CloudFormationからSNSトピックARNを動的に取得**:
   - ハードコードされたSNSトピックARNを使用する代わりに、CloudFormationからARNを動的に取得するように修正しました。
   - AWS認証情報を使用して、CloudFormationからSNSトピックARNを取得します。

    ```typescript
    // AWS認証情報を取得
    const accessKeyId = c.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = c.env.AWS_SECRET_ACCESS_KEY;
    
    // メールを送信（SNSトピックARNはCloudFormationから取得）
    const result = await sendEmail(
      email,
      subject,
      message,
      undefined, // SNSトピックARNはCloudFormationから取得
      region,
      accessKeyId,
      secretAccessKey
    );
    ```

2. **環境変数のサポート**:
   - Cloudflare WorkersのSecrets機能を使用して、AWS認証情報とスタック名を設定できるようにしました。
   - CloudflareBindingsの型定義を拡張して、AWS認証情報とスタック名を追加しました。

    ```typescript
    // CloudflareBindingsの型定義を拡張
    type CloudflareBindings = {
      // 必要に応じてCloudflareの環境変数やシークレットを追加
      AWS_REGION?: string;
      AWS_STACK_NAME?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
    };
    ```

3. **AWS認証情報を引数として渡す**:
   - SNSクライアントの初期化時に引数として渡されたAWS認証情報を使用するように修正しました。
   - これにより、Cloudflare Workers環境でもSNSクライアントが初期化できるようになります。

    ```typescript
    /**
     * SNSを使用してメールを送信する
     * @param email 送信先メールアドレス
     * @param subject メールの件名
     * @param message メールの本文
     * @param topicArn SNSトピックのARN
     * @param region AWSリージョン
     * @param accessKeyId AWS認証情報のアクセスキーID（オプション）
     * @param secretAccessKey AWS認証情報のシークレットアクセスキー（オプション）
     * @returns 送信結果
     */
    export async function sendEmail(
      email: string,
      subject: string,
      message: string,
      topicArn?: string,
      region: string = DEFAULT_REGION,
      accessKeyId?: string,
      secretAccessKey?: string,
    ): Promise<{ success: boolean; messageId?: string; error?: any }> {
      // SNSクライアントの設定
      const clientOptions = { region };
    
      // AWS認証情報が指定されている場合は設定
      if (accessKeyId && secretAccessKey) {
        clientOptions.credentials = {
          accessKeyId,
          secretAccessKey,
        };
      }
    
      // SNSクライアントを作成
      const client = new SNSClient(clientOptions);
      
      // ...
    }
    ```

4. **Hono APIからAWS認証情報を渡す**:
   - Hono APIのコードを修正して、環境変数からAWS認証情報を取得し、aws-utilsパッケージの関数に渡すようにしました。
   - これにより、process.envへの参照を削除し、Cloudflare Workers環境でも動作するようになります。

    ```typescript
    // メール送信エンドポイント
    app.post("/send-email", async (c) => {
      try {
        // ...
    
        // AWS認証情報を取得
        const accessKeyId = c.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = c.env.AWS_SECRET_ACCESS_KEY;
    
        // メールを送信
        const result = await sendEmail(
          email,
          subject,
          message,
          topicArn,
          region,
          accessKeyId,
          secretAccessKey
        );
        
        // ...
      } catch (error) {
        // ...
      }
    });
    ```

5. **.dev.varsファイルの作成**:
   - Cloudflare Workersのローカル開発環境用の環境変数を設定するための.dev.varsファイルを作成しました。
   - AWS認証情報とSNSトピックARNを設定できるようにしました。

    ```txt
    # Cloudflare Workers開発環境用の環境変数
    # 実際の値は手動で設定してください
    
    # AWS認証情報
    AWS_ACCESS_KEY_ID=
    AWS_SECRET_ACCESS_KEY=
    
    # AWS SNS設定
    SNS_TOPIC_ARN=arn:aws:sns:ap-northeast-1:573143736992:CCQM-EmailTopic-dev
    AWS_REGION=ap-northeast-1
    ```

## 学んだこと

1. **環境の違いを考慮する**:
   - 異なる実行環境（Node.js、Cloudflare Workers、AWS Lambda）では、AWS SDKの動作が異なります。
   - Cloudflare Workersのような制限された環境では、AWS認証情報の取得方法を明示的に指定する必要があります。

2. **依存関係の最小化**:
   - 可能な限り、外部サービスへの依存を最小限に抑えることが重要です。
   - 設定値（ARNなど）を直接指定することで、認証情報の取得に関する問題を回避できます。

3. **環境変数の活用**:
   - 環境固有の設定は、ハードコードせずに環境変数として提供することが望ましいです。
   - Cloudflare WorkersではSecrets機能を使用して、機密情報を安全に管理できます。

## 今後の改善点

1. **環境変数の設定**:
   - 本番環境では、`wrangler secret put SNS_TOPIC_ARN`コマンドを使用して、SNSトピックARNをSecretとして設定することを推奨します。

2. **AWS認証情報の提供**:
   - 必要に応じて、AWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYをSecretとして設定することで、CloudFormationからARNを動的に取得することも可能です。

3. **エラーハンドリングの改善**:
   - AWS認証情報が不足している場合のエラーメッセージをより明確にし、トラブルシューティングを容易にすることが望ましいです。
