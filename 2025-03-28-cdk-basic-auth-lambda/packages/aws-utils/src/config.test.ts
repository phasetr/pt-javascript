import { describe, it, expect } from 'vitest';
import { getEnvironment, type Environment } from './config';

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
});
