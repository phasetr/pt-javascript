import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAuthCredentials } from './secrets';
import { getEnvironment } from './config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// getEnvironmentは純粋関数なのでモックは不要

// console関数のモック
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('@aws-sdk/client-secrets-manager', () => {
  const mockSend = vi.fn();
  
  return {
    SecretsManagerClient: vi.fn().mockImplementation(() => ({
      send: mockSend
    })),
    GetSecretValueCommand: vi.fn().mockImplementation((params) => ({
      ...params
    }))
  };
});

describe('secrets', () => {
  describe('getAuthCredentials', () => {
    const mockSecretsManagerClient = {
      send: vi.fn()
    };
    
    beforeEach(() => {
      // モックをリセット
      vi.clearAllMocks();
      
      // SecretsManagerClientのモックを設定
      vi.mocked(SecretsManagerClient).mockImplementation(() => mockSecretsManagerClient as unknown as SecretsManagerClient);
    });
    
    afterEach(() => {
      vi.resetAllMocks();
    });
    
    it('should use the provided secret name', async () => {
      // モックの応答を設定
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"test-user","password":"test-pass"}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret', 'development', 'ap-northeast-1');
      
      // GetSecretValueCommandが正しいパラメータで呼び出されたことを確認
      expect(vi.mocked(GetSecretValueCommand)).toHaveBeenCalledWith({
        SecretId: 'test-secret'
      });
      
      // 結果が正しいことを確認
      expect(result).toEqual({
        username: 'test-user',
        password: 'test-pass'
      });
    });
    
    it('should generate default secret name based on environment', async () => {
      // モックの応答を設定
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"dev-user","password":"dev-pass"}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials(undefined, 'development', 'ap-northeast-1');
      
      // GetSecretValueCommandが正しいパラメータで呼び出されたことを確認
      // development は getEnvironment によって dev に変換される
      expect(vi.mocked(GetSecretValueCommand)).toHaveBeenCalledWith({
        SecretId: 'CBAL-dev/BasicAuth'
      });
      
      // 結果が正しいことを確認
      expect(result).toEqual({
        username: 'dev-user',
        password: 'dev-pass'
      });
    });
    
    it('should use the provided region', async () => {
      // モックの応答を設定
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"user","password":"pass"}'
      });
      
      // 関数を実行
      await getAuthCredentials('test-secret', 'development', 'us-west-2');
      
      // SecretsManagerClientが正しいパラメータで呼び出されたことを確認
      expect(SecretsManagerClient).toHaveBeenCalledWith({
        region: 'us-west-2'
      });
    });
    
    it('should use default region if not provided', async () => {
      // モックの応答を設定
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"user","password":"pass"}'
      });
      
      // 関数を実行
      await getAuthCredentials('test-secret', 'development');
      
      // SecretsManagerClientが正しいパラメータで呼び出されたことを確認
      expect(SecretsManagerClient).toHaveBeenCalledWith({
        region: 'ap-northeast-1'
      });
    });
    
    it('should parse secret string correctly', async () => {
      // モックの応答を設定
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"custom-user","password":"custom-pass"}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果が正しいことを確認
      expect(result).toEqual({
        username: 'custom-user',
        password: 'custom-pass'
      });
      
      // ログが出力されたことを確認
      expect(console.log).toHaveBeenCalledWith(
        'Using credentials from Secrets Manager: custom-user:custom-pass'
      );
    });
    
    it('should handle malformed JSON in secret string', async () => {
      // モックの応答を設定 - 引用符のないキー
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{username:"malformed-user",password:"malformed-pass"}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果が正しいことを確認 - 修正されたJSONが解析される
      expect(result).toEqual({
        username: 'malformed-user',
        password: 'malformed-pass'
      });
    });
    
    it('should handle trailing commas in secret string', async () => {
      // モックの応答を設定 - 余分なカンマ
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"comma-user","password":"comma-pass",}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果が正しいことを確認 - 余分なカンマが削除される
      expect(result).toEqual({
        username: 'comma-user',
        password: 'comma-pass'
      });
    });
    
    it('should handle unescaped backslashes in secret string', async () => {
      // モックの応答を設定 - エスケープされていないバックスラッシュ
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"username":"backslash\\user","password":"backslash\\pass"}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果が正しいことを確認 - バックスラッシュがエスケープされる
      expect(result).toEqual({
        username: 'backslash\\user',
        password: 'backslash\\pass'
      });
    });
    
    it('should return default credentials if secret does not contain username and password', async () => {
      // モックの応答を設定 - usernameとpasswordが含まれていない
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: '{"key1":"value1","key2":"value2"}'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果がデフォルト値であることを確認
      expect(result).toEqual({
        username: 'admin',
        password: 'password'
      });
      
      // 警告が出力されたことを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Secret does not contain username and password: {"key1":"value1","key2":"value2"}'
      );
    });
    
    it('should return default credentials if JSON parsing fails', async () => {
      // モックの応答を設定 - 無効なJSON
      mockSecretsManagerClient.send.mockResolvedValueOnce({
        SecretString: 'invalid-json'
      });
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果がデフォルト値であることを確認
      expect(result).toEqual({
        username: 'admin',
        password: 'password'
      });
      
      // エラーが出力されたことを確認
      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse secret: invalid-json',
        expect.any(Error)
      );
    });
    
    it('should return default credentials if SecretString is not present', async () => {
      // モックの応答を設定 - SecretStringが含まれていない
      mockSecretsManagerClient.send.mockResolvedValueOnce({});
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret');
      
      // 結果がデフォルト値であることを確認
      expect(result).toEqual({
        username: 'admin',
        password: 'password'
      });
      
      // 警告が出力されたことを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Secret does not contain SecretString: test-secret'
      );
    });
    
    it('should return default credentials if Secrets Manager API call fails', async () => {
      // モックの応答を設定 - エラーをスロー
      const testError = new Error('Test API error');
      mockSecretsManagerClient.send.mockRejectedValueOnce(testError);
      
      // 関数を実行
      const result = await getAuthCredentials('test-secret', 'development');
      
      // 結果がデフォルト値であることを確認
      expect(result).toEqual({
        username: 'admin',
        password: 'password'
      });
      
      // 警告が出力されたことを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to get auth credentials from Secrets Manager for dev environment:',
        testError
      );
    });
  });
});
