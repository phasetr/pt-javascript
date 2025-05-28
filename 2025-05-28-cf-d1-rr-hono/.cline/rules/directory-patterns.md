## ディレクトリ配置規則

```txt
.cline           # プロンプト
docs/            # ドキュメント置き場
apps/*           # アプリケーション：`packages`にする場合もある.
modules/<name>   # モジュール(Deno Module)
packages/*       # アプリケーション：`apps`にする場合もある
poc/*.ts   # 単体実行可能なスクリプト
  tools/   # poc のユーティリティ
```

具体的なアプリケーション作成時は`package by feature`でディレクトリを構成する.
つまり`packages/p1/src`にソースコードを置くときは次のような構成にする.

```txt
src
 ├── contexts                      # 本当にglobalなcontextだけを残す
 ├── features
 │      └── [feature]              # feature単位でディレクトリを切る
 │             ├── index.ts        # Public APIとしてfeatureの中でインターフェースとして定義する対象を外部にre-export
 │             └── ...etc          # featureとして切り出せるコンポーネント,hook,型定義などを移動 (<-`components/common`,`components/views`,...)
 ├── hooks                         # 本当にglobalなhookだけを残す
 ├── layouts                       # アプリケーションレイアウトを扱うコンポーネント (<-`components/base`)
 ├── pages
 │      └── [page]                 # ページ単位でディレクトリを切る
 │             ├── index.ts        # ルーティングと1：1で紐づくページコンポーネント
 │             └── views
 │                    └── ...etc   # ページ固有のコンポーネントを移動 (<- `components/views`)
 ├── ui                            # アプリケーション全体で使用できる純粋なUIコンポーネント (<-`components/common`)
...etc
```

特に小規模アプリでは`pages`に関してもページコンポーネントは`features/[feature]`に格納してもよい.
