#!/usr/bin/env node
import { SSOClient } from '@aws-sdk/client-sso';
import { 
  SSOAdminClient, 
  ListPermissionSetsCommand, 
  DescribePermissionSetCommand 
} from '@aws-sdk/client-sso-admin';
import { 
  IdentitystoreClient, 
  ListGroupsCommand, 
  ListUsersCommand,
  type User,
  type Group
} from '@aws-sdk/client-identitystore';

/**
 * This script verifies the IAM Identity Center configuration for the CIIC project.
 * It checks:
 * 1. If IAM Identity Center is set up
 * 2. Lists available permission sets
 * 3. Verifies that users/groups have the correct permissions
 * 
 * Usage:
 *   ts-node verify-iam-identity-center.ts [--environment dev|prod] [--identity-store-id ID] [--sso-instance-arn ARN]
 */

// Parse command line arguments
const args = process.argv.slice(2);
const environment = getArgValue(args, '--environment') || 'dev';
const identityStoreId = getArgValue(args, '--identity-store-id');
const ssoInstanceArn = getArgValue(args, '--sso-instance-arn');

// Validate environment
if (environment !== 'dev' && environment !== 'prod') {
  console.error(`Invalid environment: ${environment}. Must be 'dev' or 'prod'`);
  process.exit(1);
}

// Validate required parameters
if (!identityStoreId) {
  console.error('Missing required parameter: --identity-store-id');
  showUsage();
  process.exit(1);
}

if (!ssoInstanceArn) {
  console.error('Missing required parameter: --sso-instance-arn');
  showUsage();
  process.exit(1);
}

// Initialize clients
const ssoClient = new SSOClient({});
const ssoAdminClient = new SSOAdminClient({});
const identityStoreClient = new IdentitystoreClient({});

// Main function
async function main() {
  console.log(`Verifying IAM Identity Center configuration for CIIC ${environment} environment...`);
  
  try {
    // 1. Check if IAM Identity Center is set up
    console.log('\n1. Checking IAM Identity Center setup...');
    await verifyIdentityCenter();
    
    // 2. List available permission sets
    console.log('\n2. Listing available permission sets...');
    const permissionSets = await listPermissionSets();
    
    // 3. Check for CIIC-specific permission sets
    console.log('\n3. Checking for CIIC-specific permission sets...');
    await checkCiicPermissionSets(permissionSets);
    
    // 4. List users and groups in the Identity Store
    console.log('\n4. Listing users and groups in the Identity Store...');
    await listUsersAndGroups();
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

// Helper functions
async function verifyIdentityCenter() {
  try {
    // Try to list permission sets to verify SSO is set up
    const command = new ListPermissionSetsCommand({
      InstanceArn: ssoInstanceArn,
    });
    
    await ssoAdminClient.send(command);
    console.log('✅ IAM Identity Center is properly configured');
  } catch (error) {
    console.error('❌ Error accessing IAM Identity Center:', error);
    throw error;
  }
}

async function listPermissionSets() {
  try {
    const command = new ListPermissionSetsCommand({
      InstanceArn: ssoInstanceArn,
    });
    
    const response = await ssoAdminClient.send(command);
    const permissionSets = response.PermissionSets || [];
    
    console.log(`Found ${permissionSets.length} permission sets:`);
    
    // Get details for each permission set
    for (const permissionSetArn of permissionSets) {
      const detailsCommand = new DescribePermissionSetCommand({
        InstanceArn: ssoInstanceArn,
        PermissionSetArn: permissionSetArn,
      });
      
      const details = await ssoAdminClient.send(detailsCommand);
      console.log(`- ${details.PermissionSet?.Name} (${permissionSetArn})`);
    }
    
    return permissionSets;
  } catch (error) {
    console.error('❌ Error listing permission sets:', error);
    throw error;
  }
}

async function checkCiicPermissionSets(permissionSets: string[]) {
  const prefix = 'CIIC';
  const expectedSets = [
    `${prefix}-${environment}-ReadOnly`,
    `${prefix}-${environment}-Developer`,
    `${prefix}-${environment}-Admin`,
  ];
  
  try {
    let foundCount = 0;
    
    for (const permissionSetArn of permissionSets) {
      const detailsCommand = new DescribePermissionSetCommand({
        InstanceArn: ssoInstanceArn,
        PermissionSetArn: permissionSetArn,
      });
      
      const details = await ssoAdminClient.send(detailsCommand);
      const name = details.PermissionSet?.Name || '';
      
      if (expectedSets.includes(name)) {
        console.log(`✅ Found permission set: ${name}`);
        foundCount++;
      }
    }
    
    if (foundCount === expectedSets.length) {
      console.log(`✅ All expected CIIC permission sets found (${foundCount}/${expectedSets.length})`);
    } else {
      console.warn(`⚠️ Only ${foundCount}/${expectedSets.length} expected CIIC permission sets found`);
    }
  } catch (error) {
    console.error('❌ Error checking CIIC permission sets:', error);
    throw error;
  }
}

async function listUsersAndGroups() {
  try {
    // List users
    const usersCommand = new ListUsersCommand({
      IdentityStoreId: identityStoreId,
      MaxResults: 10, // Limit to 10 users for brevity
    });
    
    const usersResponse = await identityStoreClient.send(usersCommand);
    console.log(`Found ${usersResponse.Users?.length || 0} users in the Identity Store:`);
    
    usersResponse.Users?.forEach((user: User, index: number) => {
      console.log(`${index + 1}. ${user.UserName || 'Unknown'} (${user.UserId || 'Unknown ID'})`);
    });
    
    // List groups
    const groupsCommand = new ListGroupsCommand({
      IdentityStoreId: identityStoreId,
      MaxResults: 10, // Limit to 10 groups for brevity
    });
    
    const groupsResponse = await identityStoreClient.send(groupsCommand);
    console.log(`\nFound ${groupsResponse.Groups?.length || 0} groups in the Identity Store:`);
    
    groupsResponse.Groups?.forEach((group: Group, index: number) => {
      console.log(`${index + 1}. ${group.DisplayName || 'Unknown'} (${group.GroupId || 'Unknown ID'})`);
    });
  } catch (error) {
    console.error('❌ Error listing users and groups:', error);
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

function showUsage() {
  console.log(`
Usage:
  ts-node verify-iam-identity-center.ts [--environment dev|prod] --identity-store-id ID --sso-instance-arn ARN

Parameters:
  --environment        The environment to verify (dev or prod, default: dev)
  --identity-store-id  The ID of your IAM Identity Center Identity Store (required)
  --sso-instance-arn   The ARN of your IAM Identity Center instance (required)

Example:
  ts-node verify-iam-identity-center.ts --environment dev --identity-store-id d-1234567890 --sso-instance-arn arn:aws:sso:::instance/ssoins-1234567890abcdef
`);
}

// Run the script
main().catch(console.error);
