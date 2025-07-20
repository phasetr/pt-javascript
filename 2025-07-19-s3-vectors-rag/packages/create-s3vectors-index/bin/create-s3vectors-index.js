#!/usr/bin/env node

import { parseCommandLineOptions, createS3VectorsIndex } from '../dist/index.js';

try {
  // コマンドライン引数をパース
  const options = parseCommandLineOptions(process.argv);
  
  // 引数ベースでインデックス作成を実行
  createS3VectorsIndex(options).catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ Argument Error:', error.message);
  } else {
    console.error('❌ Unexpected Error:', error);
  }
  process.exit(1);
}
