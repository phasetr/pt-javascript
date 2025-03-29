#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Paths
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'packages', 'db');
const awsUtilsDir = path.join(rootDir, 'packages', 'aws-utils');
const honoApiDir = path.join(rootDir, 'packages', 'hono-api');

// Create node_modules directories if they don't exist
const honoApiNodeModulesCbalDir = path.join(honoApiDir, 'node_modules', '@cbal');
const honoApiNodeModulesDir = path.join(honoApiDir, 'node_modules');

if (!fs.existsSync(honoApiNodeModulesCbalDir)) {
  fs.mkdirSync(honoApiNodeModulesCbalDir, { recursive: true });
}

// Build packages
console.log('Building packages...');
execSync('pnpm --filter db build', { stdio: 'inherit' });
execSync('pnpm --filter aws-utils build', { stdio: 'inherit' });

// Copy db to hono-api
console.log('Copying db to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesCbalDir}/db`)) {
  execSync(`rm -rf ${honoApiNodeModulesCbalDir}/db`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesCbalDir}/db/dist`, { stdio: 'inherit' });
execSync(`cp -r ${dbDir}/dist/* ${honoApiNodeModulesCbalDir}/db/dist/`, { stdio: 'inherit' });
execSync(`cp ${dbDir}/package.json ${honoApiNodeModulesCbalDir}/db/`, { stdio: 'inherit' });

// Copy aws-utils to hono-api
console.log('Copying aws-utils to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesDir}/aws-utils`)) {
  execSync(`rm -rf ${honoApiNodeModulesDir}/aws-utils`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesDir}/aws-utils/dist`, { stdio: 'inherit' });
execSync(`cp -r ${awsUtilsDir}/dist/* ${honoApiNodeModulesDir}/aws-utils/dist/`, { stdio: 'inherit' });
execSync(`cp ${awsUtilsDir}/package.json ${honoApiNodeModulesDir}/aws-utils/`, { stdio: 'inherit' });

console.log('Done!');
