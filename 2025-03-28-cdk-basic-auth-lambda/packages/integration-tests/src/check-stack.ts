#!/usr/bin/env node
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { getEnvironment, getConfig } from './config.js';

/**
 * CloudFormationスタックの情報を取得して表示する
 */
async function checkStack() {
  // 環境設定を取得
  const config = await getConfig();
  try {
    // 環境に応じたスタック名を生成
    const environment = getEnvironment();
    const stackName = `CbalStack-${environment}`;
    
    console.log(`Checking CloudFormation stack: ${stackName}`);
    
    // AWS SDKクライアントを初期化
    const client = new CloudFormationClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
    
    // スタックの情報を取得
    const command = new DescribeStacksCommand({
      StackName: stackName,
    });
    
    const response = await client.send(command);
    
    // スタックの情報を表示
    const stack = response.Stacks?.[0];
    if (stack) {
      console.log('Stack found:');
      console.log(`  Name: ${stack.StackName}`);
      console.log(`  Status: ${stack.StackStatus}`);
      console.log(`  Creation Time: ${stack.CreationTime}`);
      console.log(`  Last Updated Time: ${stack.LastUpdatedTime}`);
      
      // スタックの出力を表示
      if (stack.Outputs && stack.Outputs.length > 0) {
        console.log('Stack Outputs:');
        for (const output of stack.Outputs) {
          console.log(`  ${output.OutputKey}: ${output.OutputValue}`);
          if (output.Description) {
            console.log(`    Description: ${output.Description}`);
          }
        }
        
        // API Endpointの出力を検索
        const apiEndpointOutput = stack.Outputs.find(output => 
          output.OutputKey?.includes('ApiEndpoint') || 
          output.Description?.includes('API Gateway endpoint URL')
        );
        
        if (apiEndpointOutput?.OutputValue) {
          console.log(`\nAPI Gateway URL: ${apiEndpointOutput.OutputValue}`);
        } else {
          console.log('\nAPI Gateway URL not found in stack outputs');
        }
      } else {
        console.log('No stack outputs found');
      }
    } else {
      console.log(`Stack ${stackName} not found`);
    }
  } catch (error) {
    console.error('Error checking CloudFormation stack:', error);
  }
}

// スクリプトを実行
checkStack();
