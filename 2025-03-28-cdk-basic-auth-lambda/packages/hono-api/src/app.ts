import { Hono } from "hono";
import { logger } from "hono/logger";
import { basicAuth } from "hono/basic-auth";
import { todos } from "./todos.js";
import { getAppConfig, getBasicAuthCredentials, isLocalEnvironment } from "./utils/secrets.js";
import type { AppConfig } from "./utils/secrets.js";

// アプリケーション設定
let appConfig: AppConfig = {
  environment: 'local',
  region: 'ap-northeast-1',
  stage: 'development'
};

// 初期認証情報（起動時に使用）
let authCredentials = {
  username: 'dummy',
  password: 'dummy'
};

// アプリケーション設定を非同期で更新
async function updateAppConfig() {
  try {
    appConfig = await getAppConfig();
    console.log(`App config updated: environment=${appConfig.environment}, stage=${appConfig.stage}`);
  } catch (error) {
    console.error("Failed to update app config:", error);
  }
}

// 認証情報を非同期で更新
async function updateAuthCredentials() {
  try {
    authCredentials = await getBasicAuthCredentials();
    console.log("Basic auth credentials updated");
  } catch (error) {
    console.error("Failed to update auth credentials:", error);
  }
}

// 起動時に一度設定を取得
async function initializeConfig() {
  await updateAppConfig();
  await updateAuthCredentials();
}

// 設定を初期化
initializeConfig();

// 定期的に設定を更新（AWS環境のみ）
if (!isLocalEnvironment()) {
  // 1時間ごとに更新
  setInterval(async () => {
    await updateAppConfig();
    await updateAuthCredentials();
  }, 60 * 60 * 1000);
}

const app = new Hono();

// ログの設定
app.use("*", logger());
// Basic認証の設定
app.use(
  "*",
  async (c, next) => {
    // リクエストごとに現在の認証情報を使用
    const auth = basicAuth({
      username: authCredentials.username,
      password: authCredentials.password,
    });
    return auth(c, next);
  }
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.route("/api/todos", todos);

export default app;
