import { describe, it, expect } from 'vitest';
import { getEnvironment, isLocalEnvironment, getAppConfig, type Environment } from './config';

describe('config', () => {
  describe('getEnvironment', () => {
    it('should return "local" when nodeEnv is "local"', () => {
      const result = getEnvironment('local');
      expect(result).toBe('local');
    });

    it('should return "dev" when nodeEnv is "development"', () => {
      const result = getEnvironment('development');
      expect(result).toBe('dev');
    });

    it('should return "prod" when nodeEnv is "production"', () => {
      const result = getEnvironment('production');
      expect(result).toBe('prod');
    });

    it('should return "prod" when nodeEnv is undefined', () => {
      const result = getEnvironment(undefined);
      expect(result).toBe('prod');
    });

    it('should return "prod" when nodeEnv is any other value', () => {
      const result = getEnvironment('invalid-value');
      expect(result).toBe('prod');
    });

    it('should return a valid Environment type', () => {
      const validEnvironments: Environment[] = ['local', 'dev', 'prod'];
      
      const result1 = getEnvironment('local');
      const result2 = getEnvironment('development');
      const result3 = getEnvironment('production');
      
      expect(validEnvironments).toContain(result1);
      expect(validEnvironments).toContain(result2);
      expect(validEnvironments).toContain(result3);
    });
  });

  describe('isLocalEnvironment', () => {
    it('should return true when nodeEnv is not "production"', () => {
      expect(isLocalEnvironment('local')).toBe(true);
      expect(isLocalEnvironment('development')).toBe(true);
      expect(isLocalEnvironment('test')).toBe(true);
      expect(isLocalEnvironment(undefined)).toBe(true);
    });

    it('should return false when nodeEnv is "production"', () => {
      expect(isLocalEnvironment('production')).toBe(false);
    });
  });

  describe('getAppConfig', () => {
    it('should return local config when environment is local', () => {
      const config = getAppConfig('local');
      expect(config).toEqual({
        environment: 'local',
        region: 'ap-northeast-1',
        stage: 'local',
      });
    });

    it('should return dev config when environment is development', () => {
      const config = getAppConfig('development');
      expect(config).toEqual({
        environment: 'dev',
        region: 'ap-northeast-1',
        stage: 'development',
      });
    });

    it('should return prod config when environment is production', () => {
      const config = getAppConfig('production');
      expect(config).toEqual({
        environment: 'prod',
        region: 'ap-northeast-1',
        stage: 'production',
      });
    });

    it('should use custom region when provided', () => {
      const config = getAppConfig('production', 'us-west-2');
      expect(config).toEqual({
        environment: 'prod',
        region: 'us-west-2',
        stage: 'production',
      });
    });
  });
});
