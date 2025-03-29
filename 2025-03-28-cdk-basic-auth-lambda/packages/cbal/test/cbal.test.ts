import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { CbalStack } from '../lib/cbal-stack';
import type { Construct } from 'constructs';
import type { StackProps } from 'aws-cdk-lib';

// Mock the CbalStack class
vi.mock('../lib/cbal-stack', () => ({
  CbalStack: vi.fn(),
}));

// Mock process.env to avoid side effects
const originalEnv = process.env;

describe('cbal CDK app', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetModules();
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    
    // Mock the CbalStack constructor
    (CbalStack as unknown as vi.Mock).mockImplementation((scope: Construct, id: string, props: StackProps) => {
      return { scope, id, props };
    });
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  it('creates a stack with default environment (dev)', async () => {
    // Mock App.node.tryGetContext to return undefined for environment
    const mockTryGetContext = vi.fn().mockReturnValue(undefined);
    const mockApp = {
      node: {
        tryGetContext: mockTryGetContext,
      },
    };
    
    // Mock cdk.App to return our mock app
    vi.spyOn(cdk, 'App').mockImplementation(() => mockApp as unknown as cdk.App);
    
    // Import the bin file which should create the stack
    await import('../bin/cbal');
    
    // Verify CbalStack was called with the correct parameters
    expect(CbalStack).toHaveBeenCalledWith(
      mockApp,
      'CbalStack-dev',
      expect.objectContaining({
        env: {
          region: 'ap-northeast-1',
        },
        tags: {
          Environment: 'dev',
        },
      })
    );
  });

  it('creates a stack with specified environment (prod)', async () => {
    // Mock App.node.tryGetContext to return 'prod' for environment
    const mockTryGetContext = vi.fn().mockImplementation((key: string) => {
      if (key === 'environment') return 'prod';
      return undefined;
    });
    
    const mockApp = {
      node: {
        tryGetContext: mockTryGetContext,
      },
    };
    
    // Mock cdk.App to return our mock app
    vi.spyOn(cdk, 'App').mockImplementation(() => mockApp as unknown as cdk.App);
    
    // Import the bin file which should create the stack
    await import('../bin/cbal');
    
    // Verify CbalStack was called with the correct parameters
    expect(CbalStack).toHaveBeenCalledWith(
      mockApp,
      'CbalStack-prod',
      expect.objectContaining({
        env: {
          region: 'ap-northeast-1',
        },
        tags: {
          Environment: 'prod',
        },
      })
    );
  });
});
