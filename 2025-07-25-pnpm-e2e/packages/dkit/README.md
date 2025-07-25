# README

`drizzle-kit`を実行するためだけのパッケージ。
coreパッケージから`@libsql/client`の余計な依存を切るための対処。
他から利用するわけでもないため、drizzle.config.ts内でも相対パスで参照させている。
