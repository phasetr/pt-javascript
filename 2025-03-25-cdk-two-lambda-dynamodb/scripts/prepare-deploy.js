#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Paths
const rootDir = path.resolve(__dirname, '..');
const dbLibDir = path.join(rootDir, 'packages', 'db-lib');
const honoApiDir = path.join(rootDir, 'apps', 'hono-api');
const remixDir = path.join(rootDir, 'apps', 'remix');

// Create node_modules/@ctld directory if it doesn't exist
const honoApiNodeModulesDir = path.join(honoApiDir, 'node_modules', '@ctld');
const remixNodeModulesDir = path.join(remixDir, 'node_modules', '@ctld');

if (!fs.existsSync(honoApiNodeModulesDir)) {
  fs.mkdirSync(honoApiNodeModulesDir, { recursive: true });
}

if (!fs.existsSync(remixNodeModulesDir)) {
  fs.mkdirSync(remixNodeModulesDir, { recursive: true });
}

// Build db-lib
console.log('Building db-lib...');
execSync('pnpm --filter db-lib build', { stdio: 'inherit' });

// Copy db-lib to apps
console.log('Copying db-lib to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesDir}/db-lib`)) {
  execSync(`rm -rf ${honoApiNodeModulesDir}/db-lib`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesDir}/db-lib/dist`, { stdio: 'inherit' });
execSync(`cp -r ${dbLibDir}/dist/* ${honoApiNodeModulesDir}/db-lib/dist/`, { stdio: 'inherit' });
execSync(`cp ${dbLibDir}/package.json ${honoApiNodeModulesDir}/db-lib/`, { stdio: 'inherit' });

console.log('Copying db-lib to remix...');
// Clean up existing directories if they exist
if (fs.existsSync(`${remixNodeModulesDir}/db-lib`)) {
  execSync(`rm -rf ${remixNodeModulesDir}/db-lib`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${remixNodeModulesDir}/db-lib/dist`, { stdio: 'inherit' });
execSync(`cp -r ${dbLibDir}/dist/* ${remixNodeModulesDir}/db-lib/dist/`, { stdio: 'inherit' });
execSync(`cp ${dbLibDir}/package.json ${remixNodeModulesDir}/db-lib/`, { stdio: 'inherit' });

console.log('Done!');
