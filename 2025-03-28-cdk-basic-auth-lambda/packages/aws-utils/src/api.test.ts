import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApiUrl } from './api';
import { getEnvironment } from './config';
import { getApiUrlFromCloudFormation } from './cloudformation';
import { getLambdaUrl } from './lambda';

// getEnvironmentは純粋関数なのでモックは不要

// console関数のモック
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// 依存関数のモック
vi.mock('./cloudformation.js', () => ({
  getApiUrlFromCloudFormation: vi.fn()
}));

vi.mock('./lambda.js', () => ({
  getLambdaUrl: vi.fn()
}));

describe('api', () => {
  describe('getApiUrl', () => {
    beforeEach(() => {
      // モックをリセット
      vi.clearAllMocks();
    });
    
    afterEach(() => {
      vi.resetAllMocks();
    });
    
    it('should return baseUrl for local environment', async () => {
      // 関数を実行
      const result = await getApiUrl('http://localhost:4000', 'local');
      
      // 結果が正しいことを確認
      expect(result).toBe('http://localhost:4000');
      
      // CloudFormationとLambdaの関数が呼び出されていないことを確認
      expect(getApiUrlFromCloudFormation).not.toHaveBeenCalled();
      expect(getLambdaUrl).not.toHaveBeenCalled();
    });
    
    it('should return default baseUrl for local environment if not provided', async () => {
      // 関数を実行
      const result = await getApiUrl(undefined, 'local');
      
      // 結果が正しいことを確認
      expect(result).toBe('http://localhost:3000');
      
      // CloudFormationとLambdaの関数が呼び出されていないことを確認
      expect(getApiUrlFromCloudFormation).not.toHaveBeenCalled();
      expect(getLambdaUrl).not.toHaveBeenCalled();
    });
    
    it('should return URL from CloudFormation for non-local environment', async () => {
      // CloudFormationからのURL取得が成功するようにモック
      vi.mocked(getApiUrlFromCloudFormation).mockResolvedValueOnce('https://api-dev.example.com/');
      
      // 関数を実行
      const result = await getApiUrl('http://localhost:3000', 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(result).toBe('https://api-dev.example.com/');
      
      // CloudFormationの関数が正しいパラメータで呼び出されたことを確認
      expect(getApiUrlFromCloudFormation).toHaveBeenCalledWith(undefined, 'development', 'ap-northeast-1');
      
      // Lambdaの関数が呼び出されていないことを確認
      expect(getLambdaUrl).not.toHaveBeenCalled();
    });
    
    it('should fall back to Lambda URL if CloudFormation fails', async () => {
      // CloudFormationからのURL取得が失敗するようにモック
      vi.mocked(getApiUrlFromCloudFormation).mockRejectedValueOnce(new Error('CloudFormation error'));
      
      // LambdaからのURL取得が成功するようにモック
      vi.mocked(getLambdaUrl).mockResolvedValueOnce('https://lambda-dev.example.com/');
      
      // 関数を実行
      const result = await getApiUrl('http://localhost:3000', 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(result).toBe('https://lambda-dev.example.com/');
      
      // CloudFormationの関数が呼び出されたことを確認
      expect(getApiUrlFromCloudFormation).toHaveBeenCalledWith(undefined, 'development', 'ap-northeast-1');
      
      // Lambdaの関数が正しいパラメータで呼び出されたことを確認
      expect(getLambdaUrl).toHaveBeenCalledWith(undefined, 'development', 'ap-northeast-1');
      
      // 警告が出力されたことを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to get API URL from CloudFormation, falling back to Lambda function:',
        expect.any(Error)
      );
    });
    
    it('should return baseUrl if both CloudFormation and Lambda fail', async () => {
      // CloudFormationからのURL取得が失敗するようにモック
      vi.mocked(getApiUrlFromCloudFormation).mockRejectedValueOnce(new Error('CloudFormation error'));
      
      // LambdaからのURL取得も失敗するようにモック
      vi.mocked(getLambdaUrl).mockRejectedValueOnce(new Error('Lambda error'));
      
      // 関数を実行
      const result = await getApiUrl('http://localhost:3000', 'development', 'ap-northeast-1');
      
      // 結果が正しいことを確認
      expect(result).toBe('http://localhost:3000');
      
      // CloudFormationとLambdaの関数が呼び出されたことを確認
      expect(getApiUrlFromCloudFormation).toHaveBeenCalledWith(undefined, 'development', 'ap-northeast-1');
      expect(getLambdaUrl).toHaveBeenCalledWith(undefined, 'development', 'ap-northeast-1');
      
      // 警告とエラーが出力されたことを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to get API URL from CloudFormation, falling back to Lambda function:',
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error getting API URL:',
        expect.any(Error)
      );
    });
    
    it('should pass nodeEnv and awsRegion to CloudFormation and Lambda functions', async () => {
      // CloudFormationからのURL取得が失敗するようにモック
      vi.mocked(getApiUrlFromCloudFormation).mockRejectedValueOnce(new Error('CloudFormation error'));
      
      // LambdaからのURL取得が成功するようにモック
      vi.mocked(getLambdaUrl).mockResolvedValueOnce('https://lambda-prod.example.com/');
      
      // 関数を実行
      const result = await getApiUrl('http://localhost:3000', 'production', 'us-west-2');
      
      // 結果が正しいことを確認
      expect(result).toBe('https://lambda-prod.example.com/');
      
      // CloudFormationとLambdaの関数が正しいパラメータで呼び出されたことを確認
      expect(getApiUrlFromCloudFormation).toHaveBeenCalledWith(undefined, 'production', 'us-west-2');
      expect(getLambdaUrl).toHaveBeenCalledWith(undefined, 'production', 'us-west-2');
    });
  });
});
