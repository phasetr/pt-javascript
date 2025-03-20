#!/bin/bash

# プロンプトファイルを結合して .clinerules を生成するスクリプト

RULES_DIR="./.cline/rules"
ROOMODES_DIR="./.cline/roomodes"
OUTPUT_FILE=".clinerules"
# ROOMODES_FILE=".roomodes"

# ディレクトリが存在するか確認
if [ ! -d "$RULES_DIR" ]; then
  echo "Error: $RULES_DIR ディレクトリが見つかりません"
  exit 1
fi

# 結果を保存する変数
result=""

# ルールファイルを読み込んで結合
echo "ルールファイルを処理中..."
for file in $(find "$RULES_DIR" -name "*.md" -not -name "_*" | sort); do
  if [ -f "$file" ]; then
    content=$(cat "$file")
    if [ -n "$result" ]; then
      result="${result}\n\n${content}"
    else
      result="${content}"
    fi
  fi
done

# カスタムモードを処理
if [ -d "$ROOMODES_DIR" ]; then
  echo "カスタムモードを処理中..."
  
  # JSONファイルの開始
  # echo '{' > "$ROOMODES_FILE"
  # echo '  "customModes": [' >> "$ROOMODES_FILE"
  
  first_mode=true
  mode_count=0
  
  # カスタムモードの情報を追加
  result="${result}\nこのプロジェクトには以下のモードが定義されています:"
  
  for file in "$ROOMODES_DIR"/*.md; do
    if [ -f "$file" ]; then
      mode_count=$((mode_count + 1))
      filename=$(basename "$file")
      slug="${filename%.md}"
      content=$(cat "$file")
      
      # フロントマターを処理
      if [[ "$content" =~ ^---\n([\s\S]*?)\n---\n([\s\S]*) ]]; then
        frontmatter="${BASH_REMATCH[1]}"
        body="${BASH_REMATCH[2]}"
        
        # フロントマターから名前を抽出
        name=$(echo "$frontmatter" | grep "name:" | sed 's/name: *//')
        
        # JSON出力
        if [ "$first_mode" = false ]; then
          : # echo "," >> "$ROOMODES_FILE"
        else
          first_mode=false
        fi
        
        # JSONに追加
        # echo "    {" >> "$ROOMODES_FILE"
        # echo "      \"slug\": \"$slug\"," >> "$ROOMODES_FILE"
        # echo "      \"name\": \"$name\"," >> "$ROOMODES_FILE"
        # echo "      \"roleDefinition\": $(echo "$body" | sed 's/"/\\"/g' | tr '\n' ' ')," >> "$ROOMODES_FILE"
        # echo "      \"__filename\": \"$file\"" >> "$ROOMODES_FILE"
        # echo -n "    }" >> "$ROOMODES_FILE"
        
        # 結果にモード情報を追加
        result="${result}\n- ${slug} ${name} at ${file#./}"
      fi
    fi
  done
  
  # JSONファイルを閉じる
  # echo "" >> "$ROOMODES_FILE"
  # echo "  ]" >> "$ROOMODES_FILE"
  # echo "}" >> "$ROOMODES_FILE"
  
  # echo "生成: $ROOMODES_FILE ($mode_count モードファイル)"
fi

# 最終出力ファイルに書き込み
echo "$result" > "$OUTPUT_FILE"
echo "生成: $OUTPUT_FILE"