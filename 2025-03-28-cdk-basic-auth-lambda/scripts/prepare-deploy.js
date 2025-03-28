#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Paths
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'packages', 'db');
const honoApiDir = path.join(rootDir, 'packages', 'hono-api');

// Create node_modules/@cbal directory if it doesn't exist
const honoApiNodeModulesDir = path.join(honoApiDir, 'node_modules', '@cbal');

if (!fs.existsSync(honoApiNodeModulesDir)) {
  fs.mkdirSync(honoApiNodeModulesDir, { recursive: true });
}

// Build db
console.log('Building db...');
execSync('pnpm --filter db build', { stdio: 'inherit' });

// Copy db to apps
console.log('Copying db to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesDir}/db`)) {
  execSync(`rm -rf ${honoApiNodeModulesDir}/db`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesDir}/db/dist`, { stdio: 'inherit' });
execSync(`cp -r ${dbDir}/dist/* ${honoApiNodeModulesDir}/db/dist/`, { stdio: 'inherit' });
execSync(`cp ${dbDir}/package.json ${honoApiNodeModulesDir}/db/`, { stdio: 'inherit' });

console.log('Done!');
