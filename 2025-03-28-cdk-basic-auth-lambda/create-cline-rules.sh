#!/bin/bash

# プロンプトファイルを結合して .clinerules を生成するスクリプト

RULES_DIR="./.cline/rules"
ROOMODES_DIR="./.cline/roomodes"
NODEMODES_DIR="./.cline/nodemodes"
OUTPUT_FILE_DENO=".clinerules-deno"
OUTPUT_FILE_NODE=".clinerules"

# ディレクトリが存在するか確認
if [ ! -d "$RULES_DIR" ]; then
  echo "Error: $RULES_DIR ディレクトリが見つかりません"
  exit 1
fi

# 出力ファイルを初期化
> "$OUTPUT_FILE_DENO"
> "$OUTPUT_FILE_NODE"

# ルールファイルを読み込んで結合
echo "ルールファイルを処理中..."
first_file=true
for file in $(find "$RULES_DIR" -name "*.md" -not -name "_*" | sort); do
  if [ -f "$file" ]; then
    if [ "$first_file" = true ]; then
      cat "$file" > "$OUTPUT_FILE_DENO"
      cat "$file" > "$OUTPUT_FILE_NODE"
      first_file=false
    else
      echo "\n\n" >> "$OUTPUT_FILE_DENO"
      cat "$file" >> "$OUTPUT_FILE_DENO"
      echo "\n\n" >> "$OUTPUT_FILE_NODE"
      cat "$file" >> "$OUTPUT_FILE_NODE"
    fi
  fi
done

# カスタムモードを処理
if [ -d "$ROOMODES_DIR" ]; then
  echo "カスタムモードを処理中..."

  # カスタムモードの情報を追加
  echo "\nこのプロジェクトには以下のモードが定義されています:" >> "$OUTPUT_FILE_DENO"

  for file in "$ROOMODES_DIR"/*.md; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      slug="${filename%.md}"
      content=$(cat "$file")

      # フロントマターを処理
      if [[ "$content" =~ ^---\n([\s\S]*?)\n---\n([\s\S]*) ]]; then
        frontmatter="${BASH_REMATCH[1]}"

        # フロントマターから名前を抽出
        name=$(echo "$frontmatter" | grep "name:" | sed 's/name: *//')

        # 結果にモード情報を追加
        echo -e "- ${slug} ${name} at ${file#./}" >> "$OUTPUT_FILE_DENO"
      fi
    fi
  done
fi

# カスタムモードを処理
if [ -d "$NODEMODES_DIR" ]; then
  echo "カスタムモードを処理中..."

  # カスタムモードの情報を追加
  echo "\nこのプロジェクトには以下のモードが定義されています:" >> "$OUTPUT_FILE_NODE"

  for file in "$NODEMODES_DIR"/*.md; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      slug="${filename%.md}"
      content=$(cat "$file")

      # フロントマターを処理
      if [[ "$content" =~ ^---\n([\s\S]*?)\n---\n([\s\S]*) ]]; then
        frontmatter="${BASH_REMATCH[1]}"

        # フロントマターから名前を抽出
        name=$(echo "$frontmatter" | grep "name:" | sed 's/name: *//')

        # 結果にモード情報を追加
        echo -e "- ${slug} ${name} at ${file#./}" >> "$OUTPUT_FILE_NODE"
      fi
    fi
  done
fi

echo "生成: $OUTPUT_FILE_DENO"
echo "生成: $OUTPUT_FILE_NODE"
