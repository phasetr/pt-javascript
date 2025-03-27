# IAM Identity Centerを使用したAWS Consoleへのログイン方法

IAM Identity Center（旧AWS SSO）を使用してAWS Consoleにログインする方法について説明します。

## 前提条件

1. IAM Identity Centerが組織で設定されていること
2. ユーザーがIAM Identity Centerのディレクトリに追加されていること
3. ユーザーに適切なパーミッションセット（ReadOnly、Developer、Adminなど）が割り当てられていること

## ログイン手順

### 1. IAM Identity Centerのユーザーポータルにアクセス

IAM Identity Centerのユーザーポータルは通常、以下のURLでアクセスできます：

```txt
https://<your-domain>.awsapps.com/start
```

組織によっては、カスタムドメインが設定されている場合もあります。管理者から提供されたURLを使用してください。

### 2. ユーザー認証

1. ユーザー名とパスワードを入力してログインします
2. 多要素認証（MFA）が設定されている場合は、追加の認証コードを入力します

### 3. AWS アカウントの選択

ログイン後、アクセス権のあるAWSアカウントの一覧が表示されます。

1. 使用したいAWSアカウントをクリックします（例：開発環境用アカウント、本番環境用アカウントなど）

### 4. パーミッションセットの選択

選択したAWSアカウントに対して割り当てられているパーミッションセットの一覧が表示されます。

1. 使用したいパーミッションセットをクリックします：
   - **CIIC-dev-ReadOnly**: 開発環境の読み取り専用アクセス
   - **CIIC-dev-Developer**: 開発環境の開発者アクセス
   - **CIIC-dev-Admin**: 開発環境の管理者アクセス
   - **CIIC-prod-ReadOnly**: 本番環境の読み取り専用アクセス
   - **CIIC-prod-Developer**: 本番環境の開発者アクセス
   - **CIIC-prod-Admin**: 本番環境の管理者アクセス

### 5. AWS Management Consoleへのアクセス

パーミッションセットを選択すると、AWS Management Consoleに自動的にリダイレクトされます。これで選択したパーミッションセットの権限でAWSリソースにアクセスできるようになります。

## AWS CLIでの使用

IAM Identity Centerの認証情報をAWS CLIで使用することもできます。

### 1. AWS CLIのセットアップ

最新のAWS CLI（バージョン2）がインストールされていることを確認します。

### 2. SSO設定の追加

`~/.aws/config` ファイルに以下のような設定を追加します：

```ini
[profile ciic-dev]
sso_start_url = https://<your-domain>.awsapps.com/start
sso_region = <your-sso-region>
sso_account_id = <aws-account-id>
sso_role_name = CIIC-dev-Developer
region = ap-northeast-1
output = json
```

### 3. AWS CLIでのログイン

```bash
# 開発環境用のプロファイルでログイン
aws sso login --profile ciic-dev
```

ブラウザが開き、IAM Identity Centerの認証ページが表示されます。認証が完了すると、AWS CLIでコマンドを実行できるようになります。

### 4. AWS CLIでのコマンド実行

```bash
# 開発環境のDynamoDBテーブル一覧を取得
aws dynamodb list-tables --profile ciic-dev
```

## セッション期間

IAM Identity Centerのセッションは、パーミッションセットの設定に基づいて一定時間（通常は12時間）後に期限切れになります。セッションが期限切れになった場合は、再度ログインする必要があります。
