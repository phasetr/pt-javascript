import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApiUrlFromCloudFormation, getStackInfo } from './cloudformation';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

// getEnvironmentは純粋関数なのでモックは不要

// console関数のモック
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

vi.mock('@aws-sdk/client-cloudformation', () => {
  const mockSend = vi.fn();
  
  return {
    CloudFormationClient: vi.fn().mockImplementation(() => ({
      send: mockSend
    })),
    DescribeStacksCommand: vi.fn().mockImplementation((params) => ({
      ...params
    }))
  };
});

describe('cloudformation', () => {
  const mockCloudFormationClient = {
    send: vi.fn()
  };
  
  const mockStackResponse = {
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
  };
  
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    
    // CloudFormationClientのモックを設定
    vi.mocked(CloudFormationClient).mockImplementation(() => mockCloudFormationClient as unknown as CloudFormationClient);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('getApiUrlFromCloudFormation', () => {
    it('should get API URL from CloudFormation stack outputs', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      const apiUrl = await getApiUrlFromCloudFormation('CbalStack-dev', 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(apiUrl).toBe('https://api-dev.example.com/dev/');
      
      // DescribeStacksCommandが正しいパラメータで呼び出されたことを確認
      expect(vi.mocked(DescribeStacksCommand)).toHaveBeenCalledWith({
        StackName: 'CbalStack-dev'
      });
    });
    
    it('should generate default stack name based on environment', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      const apiUrl = await getApiUrlFromCloudFormation(undefined, 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(apiUrl).toBe('https://api-dev.example.com/dev/');
      
      // DescribeStacksCommandが正しいパラメータで呼び出されたことを確認
      // development は getEnvironment によって dev に変換される
      expect(vi.mocked(DescribeStacksCommand)).toHaveBeenCalledWith({
        StackName: 'CbalStack-dev'
      });
    });
    
    it('should use the provided region', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      await getApiUrlFromCloudFormation('CbalStack-dev', 'development', 'us-west-2');
      
      // CloudFormationClientが正しいパラメータで呼び出されたことを確認
      expect(CloudFormationClient).toHaveBeenCalledWith({
        region: 'us-west-2'
      });
    });
    
    it('should use default region if not provided', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      await getApiUrlFromCloudFormation('CbalStack-dev', 'development');
      
      // CloudFormationClientが正しいパラメータで呼び出されたことを確認
      expect(CloudFormationClient).toHaveBeenCalledWith({
        region: 'ap-northeast-1'
      });
    });
    
    it('should throw an error if API endpoint is not found in stack outputs', async () => {
      // モックの応答を設定 - API endpointが含まれていない
      mockCloudFormationClient.send.mockResolvedValueOnce({
        Stacks: [
          {
            StackName: 'CbalStack-dev',
            StackStatus: 'CREATE_COMPLETE',
            Outputs: [
              {
                OutputKey: 'OtherOutput',
                OutputValue: 'other-value'
              }
            ]
          }
        ]
      });
      
      // 関数を実行して例外をキャッチ
      await expect(getApiUrlFromCloudFormation('CbalStack-dev')).rejects.toThrow(
        'Failed to get API Gateway URL from CloudFormation stack'
      );
    });
    
    it('should throw an error if stack is not found', async () => {
      // モックの応答を設定 - スタックが含まれていない
      mockCloudFormationClient.send.mockResolvedValueOnce({});
      
      // 関数を実行して例外をキャッチ
      await expect(getApiUrlFromCloudFormation('CbalStack-dev')).rejects.toThrow(
        'Failed to get API Gateway URL from CloudFormation stack'
      );
    });
    
    it('should throw an error if CloudFormation API call fails', async () => {
      // モックの応答を設定 - エラーをスロー
      const testError = new Error('CloudFormation API error');
      mockCloudFormationClient.send.mockRejectedValueOnce(testError);
      
      // 関数を実行して例外をキャッチ
      await expect(getApiUrlFromCloudFormation('CbalStack-dev')).rejects.toThrow(testError);
    });
  });
  
  describe('getStackInfo', () => {
    it('should get stack information', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      const stack = await getStackInfo('CbalStack-dev', 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(stack).toBeDefined();
      expect(stack?.StackName).toBe('CbalStack-dev');
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
      expect(stack?.Outputs).toHaveLength(1);
      
      // DescribeStacksCommandが正しいパラメータで呼び出されたことを確認
      expect(vi.mocked(DescribeStacksCommand)).toHaveBeenCalledWith({
        StackName: 'CbalStack-dev'
      });
    });
    
    it('should generate default stack name based on environment', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      const stack = await getStackInfo(undefined, 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(stack).toBeDefined();
      expect(stack?.StackName).toBe('CbalStack-dev');
      
      // DescribeStacksCommandが正しいパラメータで呼び出されたことを確認
      // development は getEnvironment によって dev に変換される
      expect(vi.mocked(DescribeStacksCommand)).toHaveBeenCalledWith({
        StackName: 'CbalStack-dev'
      });
    });
    
    it('should use the provided region', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      await getStackInfo('CbalStack-dev', 'development', 'us-west-2');
      
      // CloudFormationClientが正しいパラメータで呼び出されたことを確認
      expect(CloudFormationClient).toHaveBeenCalledWith({
        region: 'us-west-2'
      });
    });
    
    it('should use default region if not provided', async () => {
      // モックの応答を設定
      mockCloudFormationClient.send.mockResolvedValueOnce(mockStackResponse);
      
      // 関数を実行
      await getStackInfo('CbalStack-dev', 'development');
      
      // CloudFormationClientが正しいパラメータで呼び出されたことを確認
      expect(CloudFormationClient).toHaveBeenCalledWith({
        region: 'ap-northeast-1'
      });
    });
    
    it('should return undefined if stack is not found', async () => {
      // モックの応答を設定 - スタックが含まれていない
      mockCloudFormationClient.send.mockResolvedValueOnce({});
      
      // 関数を実行
      const stack = await getStackInfo('CbalStack-dev');
      
      // 結果が正しいことを確認
      expect(stack).toBeUndefined();
    });
    
    it('should throw an error if CloudFormation API call fails', async () => {
      // モックの応答を設定 - エラーをスロー
      const testError = new Error('CloudFormation API error');
      mockCloudFormationClient.send.mockRejectedValueOnce(testError);
      
      // 関数を実行して例外をキャッチ
      await expect(getStackInfo('CbalStack-dev')).rejects.toThrow(testError);
    });
  });
});
