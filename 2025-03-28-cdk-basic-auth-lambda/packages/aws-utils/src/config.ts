// Environment type
export type Environment = "local" | "dev" | "prod";

// Get current environment from TEST_ENV variable, default to 'local'
export const getEnvironment = (): Environment => {
  // TEST_ENV環境変数から環境を取得
  const testEnv = process.env.TEST_ENV as Environment;
  if (testEnv && ['local', 'dev', 'prod'].includes(testEnv)) {
    return testEnv;
  }
  
  // NODE_ENVから環境を判定
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    // 本番環境の場合はprod
    return 'prod';
  }
  
  if (nodeEnv === 'development') {
    // 開発環境の場合はdev
    return 'dev';
  }
  
  // デフォルトはlocal
  return 'local';
};
