#!/bin/bash
set -e

# Lambda関数のパッケージング
cd src
npm run build
cd ..

# CDKのデプロイ
cdk deploy
