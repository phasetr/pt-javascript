#!/usr/bin/env node
import { execSync } from 'node:child_process';

// Get environment from command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'local';

// Validate environment
if (!['local', 'dev', 'prod'].includes(env)) {
  console.error(`Invalid environment: ${env}. Must be one of: local, dev, prod`);
  process.exit(1);
}

console.log(`Running integration tests in ${env} environment...`);

try {
  // Run tests with the specified environment
  // NODE_ENVを設定してテストを実行
  const nodeEnv = env === 'prod' ? 'production' : (env === 'dev' ? 'development' : 'test');
  execSync(`NODE_ENV=${nodeEnv} npx vitest run --env=${env}`, { stdio: 'inherit' });
  console.log(`Integration tests completed successfully in ${env} environment.`);
} catch (error) {
  console.error(`Integration tests failed in ${env} environment.`);
  process.exit(1);
}
