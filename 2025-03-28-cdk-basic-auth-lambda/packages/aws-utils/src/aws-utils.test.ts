import { describe, it, expect, beforeAll, vi } from 'vitest';
import { getEnvironment, getApiUrl, getAuthCredentials, getApiUrlFromCloudFormation, getStackInfo } from './index.js';

// モックの設定
vi.mock('./config.js', async () => {
  const actual = await vi.importActual('./config.js');
  return {
    ...actual,
    getEnvironment: vi.fn().mockImplementation((nodeEnv?: string) => 'dev')
  };
});

vi.mock('@aws-sdk/client-cloudformation', () => {
  const mockSend = vi.fn().mockResolvedValue({
    Stacks: [
      {
        StackName: 'CbalStack-dev',
        StackStatus: 'CREATE_COMPLETE',
        CreationTime: new Date(),
        LastUpdatedTime: new Date(),
        Outputs: [
          {
            OutputKey: 'CBALdevApiEndpoint',
            OutputValue: 'https://api-dev.example.com/dev/',
            Description: 'API Gateway endpoint URL'
          }
        ]
      }
    ]
  });

  return {
    CloudFormationClient: vi.fn().mockImplementation(() => ({
      send: mockSend
    })),
    DescribeStacksCommand: vi.fn().mockImplementation((params) => ({
      ...params
    }))
  };
});

vi.mock('@aws-sdk/client-lambda', () => {
  const mockSend = vi.fn().mockResolvedValue({
    Configuration: {
      FunctionName: 'CBAL-dev-HonoDockerImageFunction',
      FunctionArn: 'arn:aws:lambda:ap-northeast-1:123456789012:function:CBAL-dev-HonoDockerImageFunction'
    }
  });

  return {
    LambdaClient: vi.fn().mockImplementation(() => ({
      send: mockSend
    })),
    GetFunctionCommand: vi.fn().mockImplementation((params) => ({
      ...params
    }))
  };
});

vi.mock('@aws-sdk/client-secrets-manager', () => {
  const mockSend = vi.fn().mockResolvedValue({
    SecretString: '{"username":"admin","password":"password123"}'
  });

  return {
    SecretsManagerClient: vi.fn().mockImplementation(() => ({
      send: mockSend
    })),
    GetSecretValueCommand: vi.fn().mockImplementation((params) => ({
      ...params
    }))
  };
});

describe('AWS Utils', () => {
  beforeAll(() => {
    // 環境変数のモック
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.NODE_ENV = 'development';
  });

  describe('getEnvironment', () => {
    it('should return the current environment based on NODE_ENV', () => {
      const env = getEnvironment(process.env.NODE_ENV);
      expect(env).toBe('dev');
    });

    it('should return the environment from provided parameter', () => {
      const env = getEnvironment('production');
      expect(env).toBe('prod');
    });

    it('should return default environment when invalid value is provided', () => {
      // @ts-ignore - 意図的に無効な値を渡す
      const env = getEnvironment('invalid');
      expect(env).toBe('local');
    });

    it('should use NODE_ENV to determine environment', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      // NODE_ENVを設定
      process.env.NODE_ENV = 'production';
      
      // モックを一時的に元の実装に戻す
      vi.mocked(getEnvironment).mockRestore();
      
      // 実際の関数をインポート
      const { getEnvironment: actualGetEnvironment } = require('./config.js');
      
      const env = actualGetEnvironment('production');
      expect(env).toBe('prod');
      
      // 環境変数を元に戻す
      process.env.NODE_ENV = originalNodeEnv;
      
      // モックを再設定
      vi.mocked(getEnvironment).mockImplementation((nodeEnv?: string) => 'dev');
    });
  });

  describe('getApiUrlFromCloudFormation', () => {
    it('should get API URL from CloudFormation stack outputs', async () => {
      const apiUrl = await getApiUrlFromCloudFormation('CbalStack-dev');
      expect(apiUrl).toBe('https://api-dev.example.com/dev/');
    });
  });

  describe('getStackInfo', () => {
    it('should get stack information', async () => {
      const stack = await getStackInfo('CbalStack-dev');
      expect(stack).toBeDefined();
      expect(stack?.StackName).toBe('CbalStack-dev');
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
      expect(stack?.Outputs).toHaveLength(1);
    });
  });

  describe('getAuthCredentials', () => {
    it('should get auth credentials from Secrets Manager', async () => {
      const credentials = await getAuthCredentials('CBAL-dev/BasicAuth');
      expect(credentials).toEqual({
        username: 'admin',
        password: 'password123'
      });
    });
  });

  describe('getApiUrl', () => {
    it('should get API URL for the current environment', async () => {
      const apiUrl = await getApiUrl('http://localhost:3000');
      expect(apiUrl).toBe('https://api-dev.example.com/dev/');
    });

    it('should return default URL for local environment', async () => {
      // 一時的にgetEnvironmentの戻り値を変更
      const originalMock = vi.mocked(getEnvironment);
      originalMock.mockReturnValueOnce('local');
      
      const apiUrl = await getApiUrl('http://localhost:3000');
      expect(apiUrl).toBe('http://localhost:3000');
    });
  });
});
