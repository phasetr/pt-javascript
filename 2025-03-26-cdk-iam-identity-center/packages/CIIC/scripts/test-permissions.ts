#!/usr/bin/env node
import { 
  DynamoDBClient, 
  ListTablesCommand, 
  DescribeTableCommand, 
  ScanCommand 
} from '@aws-sdk/client-dynamodb';
import { 
  LambdaClient, 
  ListFunctionsCommand, 
  GetFunctionCommand, 
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

/**
 * This script tests the permissions for the CIIC project.
 * It attempts to perform operations with different permission levels to verify
 * that the IAM Identity Center permission sets are working correctly.
 * 
 * Usage:
 *   ts-node test-permissions.ts [--environment dev|prod]
 */

// Parse command line arguments
const args = process.argv.slice(2);
const environment = getArgValue(args, '--environment') || 'dev';

// Validate environment
if (environment !== 'dev' && environment !== 'prod') {
  console.error(`Invalid environment: ${environment}. Must be 'dev' or 'prod'`);
  process.exit(1);
}

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const lambdaClient = new LambdaClient({});
const logsClient = new CloudWatchLogsClient({});

// Project prefix
const prefix = 'CIIC';

// Main function
async function main() {
  console.log(`Testing permissions for CIIC ${environment} environment...`);
  
  try {
    // 1. Test DynamoDB permissions
    console.log('\n1. Testing DynamoDB permissions...');
    await testDynamoDBPermissions();
    
    // 2. Test Lambda permissions
    console.log('\n2. Testing Lambda permissions...');
    await testLambdaPermissions();
    
    // 3. Test CloudWatch Logs permissions
    console.log('\n3. Testing CloudWatch Logs permissions...');
    await testCloudWatchLogsPermissions();
    
    console.log('\nPermission tests complete!');
  } catch (error) {
    console.error('Error during permission tests:', error);
    process.exit(1);
  }
}

// Helper functions
async function testDynamoDBPermissions() {
  try {
    // 1. List tables (should work with ReadOnly permission)
    console.log('  Testing ListTables (ReadOnly permission)...');
    const listTablesCommand = new ListTablesCommand({});
    const listTablesResponse = await dynamoClient.send(listTablesCommand);
    console.log(`  ✅ Successfully listed ${listTablesResponse.TableNames?.length || 0} tables`);
    
    // Find the project table
    const tableName = `${prefix}-${environment}-DDB`;
    const tableExists = listTablesResponse.TableNames?.includes(tableName);
    
    if (!tableExists) {
      console.warn(`  ⚠️ Project table ${tableName} not found`);
      return;
    }
    
    // 2. Describe table (should work with ReadOnly permission)
    console.log(`  Testing DescribeTable for ${tableName} (ReadOnly permission)...`);
    const describeTableCommand = new DescribeTableCommand({
      TableName: tableName,
    });
    await dynamoClient.send(describeTableCommand);
    console.log('  ✅ Successfully described table');
    
    // 3. Scan table (should work with Developer permission)
    console.log(`  Testing Scan for ${tableName} (Developer permission)...`);
    const scanCommand = new ScanCommand({
      TableName: tableName,
      Limit: 10, // Limit to 10 items for brevity
    });
    
    try {
      const scanResponse = await dynamoClient.send(scanCommand);
      console.log(`  ✅ Successfully scanned table, found ${scanResponse.Items?.length || 0} items`);
    } catch (error) {
      console.error(`  ❌ Failed to scan table: ${error}`);
      console.log('  This operation requires Developer permission');
    }
  } catch (error) {
    console.error('  ❌ Error testing DynamoDB permissions:', error);
    throw error;
  }
}

async function testLambdaPermissions() {
  try {
    // 1. List functions (should work with ReadOnly permission)
    console.log('  Testing ListFunctions (ReadOnly permission)...');
    const listFunctionsCommand = new ListFunctionsCommand({});
    const listFunctionsResponse = await lambdaClient.send(listFunctionsCommand);
    console.log(`  ✅ Successfully listed ${listFunctionsResponse.Functions?.length || 0} functions`);
    
    // Find the project function
    const functionName = `${prefix}-${environment}-api`;
    const projectFunction = listFunctionsResponse.Functions?.find(
      (fn: { FunctionName?: string }) => fn.FunctionName === functionName
    );
    
    if (!projectFunction) {
      console.warn(`  ⚠️ Project function ${functionName} not found`);
      return;
    }
    
    // 2. Get function (should work with Developer permission)
    console.log(`  Testing GetFunction for ${functionName} (Developer permission)...`);
    const getFunctionCommand = new GetFunctionCommand({
      FunctionName: functionName,
    });
    
    try {
      await lambdaClient.send(getFunctionCommand);
      console.log('  ✅ Successfully got function details');
    } catch (error) {
      console.error(`  ❌ Failed to get function details: ${error}`);
      console.log('  This operation requires Developer permission');
    }
    
    // 3. Invoke function (should work with Developer permission)
    console.log(`  Testing Invoke for ${functionName} (Developer permission)...`);
    const invokeCommand = new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify({
        path: '/health',
        httpMethod: 'GET',
      })),
    });
    
    try {
      const invokeResponse = await lambdaClient.send(invokeCommand);
      const payload = invokeResponse.Payload 
        ? Buffer.from(invokeResponse.Payload).toString('utf-8') 
        : '';
      console.log(`  ✅ Successfully invoked function, status code: ${invokeResponse.StatusCode}`);
      console.log(`  Response payload: ${payload}`);
    } catch (error) {
      console.error(`  ❌ Failed to invoke function: ${error}`);
      console.log('  This operation requires Developer permission');
    }
  } catch (error) {
    console.error('  ❌ Error testing Lambda permissions:', error);
    throw error;
  }
}

async function testCloudWatchLogsPermissions() {
  try {
    // List log groups (should work with ReadOnly permission)
    console.log('  Testing DescribeLogGroups (ReadOnly permission)...');
    const describeLogGroupsCommand = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/lambda/${prefix}-${environment}`,
    });
    
    try {
      const describeLogGroupsResponse = await logsClient.send(describeLogGroupsCommand);
      console.log(`  ✅ Successfully listed ${describeLogGroupsResponse.logGroups?.length || 0} log groups`);
      
      // List log groups found
      if (describeLogGroupsResponse.logGroups) {
        for (const logGroup of describeLogGroupsResponse.logGroups) {
          console.log(`    - ${logGroup.logGroupName}`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to list log groups: ${error}`);
      console.log('  This operation requires ReadOnly permission');
    }
  } catch (error) {
    console.error('  ❌ Error testing CloudWatch Logs permissions:', error);
    throw error;
  }
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

// Run the script
main().catch(console.error);
