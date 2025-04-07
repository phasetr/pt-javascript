# Biome セットアップガイド

## 概要

[Biome](https://biomejs.dev/)は、JavaScript/TypeScriptプロジェクト向けの高速なフォーマッター、リンター、およびその他のツールを提供するオールインワンのツールチェーンです。Rustで書かれており、パフォーマンスが非常に高いのが特徴です。

## インストール

プロジェクトにBiomeをインストールするには：

```bash
# npm
npm install --save-dev @biomejs/biome

# yarn
yarn add --dev @biomejs/biome

# pnpm
pnpm add -D @biomejs/biome
```

## 設定

### 最小限の設定

Biomeはデフォルト設定で十分に機能します。プロジェクトルートに最小限の`biome.json`を作成するだけで使用できます：

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json"
}
```

これにより、プロジェクトがBiomeを使用していることが明示され、VSCode拡張機能などのツールがBiomeを認識しやすくなります。

### カスタム設定（オプション）

必要に応じて、`biome.json`にカスタム設定を追加できます：

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "es5",
      "semicolons": "always"
    }
  }
}
```

## VSCodeとの連携

### 拡張機能のインストール

VSCodeマーケットプレイスから「Biome」拡張機能をインストールします。

### VSCode設定

`.vscode/settings.json`に以下の設定を追加します：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

これにより：

- ファイル保存時に自動フォーマットが適用されます
- インポートの自動整理が有効になります
- JavaScript、TypeScript、JSONファイルのデフォルトフォーマッターとしてBiomeが設定されます

## Git連携（コミット前の自動フォーマット）

### 必要なパッケージのインストール

```bash
# npm
npm install --save-dev husky lint-staged

# yarn
yarn add --dev husky lint-staged

# pnpm
pnpm add -D husky lint-staged
```

### huskyの初期化

```bash
npx husky init
```

### pre-commitフックの設定

`.husky/pre-commit`ファイルを以下のように編集します：

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### lint-stagedの設定

`package.json`に以下の設定を追加します：

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json}": [
      "biome format --write",
      "biome lint --apply"
    ]
  }
}
```

これにより、コミット前にステージングされたファイルに対して自動的にBiomeのフォーマットとリントが適用されます。

## 手動での使用

### フォーマット

```bash
# 特定のファイルをフォーマット
npx biome format --write path/to/file.js

# 特定のディレクトリ内のすべてのファイルをフォーマット
npx biome format --write path/to/directory

# 現在のディレクトリ内のすべてのファイルをフォーマット
npx biome format --write .
```

### リント

```bash
# 特定のファイルをリント
npx biome lint path/to/file.js

# 特定のディレクトリ内のすべてのファイルをリント
npx biome lint path/to/directory

# 現在のディレクトリ内のすべてのファイルをリント
npx biome lint .

# 自動修正可能な問題を修正
npx biome lint --apply path/to/file.js
```

## CI/CD連携

GitHub Actionsなどのワークフローに以下のようなステップを追加できます：

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'

- name: Install dependencies
  run: npm ci

- name: Lint and format check
  run: npx biome ci .
```

`biome ci`コマンドは、フォーマットとリントのチェックを行い、問題がある場合は非ゼロの終了コードを返します。

## 参考リンク

- [Biome 公式ドキュメント](https://biomejs.dev/docs/)
- [Biome GitHub リポジトリ](https://github.com/biomejs/biome)
