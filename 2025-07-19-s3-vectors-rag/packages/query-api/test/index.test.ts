import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApiEndpoint, main, queryApi } from '../src/index';

// Mock AWS SDK
vi.mock('@aws-sdk/client-cloudformation', () => ({
  CloudFormationClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  DescribeStacksCommand: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('query-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    process.env.AWS_REGION = undefined;
  });

  describe('getApiEndpoint', () => {
    it('should retrieve API Gateway endpoint from CloudFormation', async () => {
      const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
      const mockSend = vi.fn();
      const mockClient = vi.mocked(CloudFormationClient);

      mockClient.mockImplementation(() => ({ send: mockSend }) as never);

      mockSend.mockResolvedValue({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'ApiGatewayEndpoint',
                OutputValue: 'https://test-api.execute-api.us-east-1.amazonaws.com/v1/',
              },
            ],
          },
        ],
      });

      const result = await getApiEndpoint('TestStack');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('https://test-api.execute-api.us-east-1.amazonaws.com/v1/');
      }
    });

    it('should return error when stack not found', async () => {
      const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
      const mockSend = vi.fn();
      const mockClient = vi.mocked(CloudFormationClient);

      mockClient.mockImplementation(() => ({ send: mockSend }) as never);

      mockSend.mockRejectedValue(new Error('Stack not found'));

      const result = await getApiEndpoint('NonExistentStack');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Stack not found');
      }
    });

    it('should return error when endpoint not found in outputs', async () => {
      const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
      const mockSend = vi.fn();
      const mockClient = vi.mocked(CloudFormationClient);

      mockClient.mockImplementation(() => ({ send: mockSend }) as never);

      mockSend.mockResolvedValue({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'SomeOtherOutput',
                OutputValue: 'some-value',
              },
            ],
          },
        ],
      });

      const result = await getApiEndpoint('TestStack');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API Gateway endpoint not found in stack outputs');
      }
    });
  });

  describe('queryApi', () => {
    it('should query API successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ answer: 'Test answer' }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as never);

      const result = await queryApi('https://test-api.com/', 'What is this?');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({ answer: 'Test answer' });
      }

      expect(fetch).toHaveBeenCalledWith('https://test-api.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: 'What is this?' }),
      });
    });

    it('should return error when API request fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as never);

      const result = await queryApi('https://test-api.com/', 'What is this?');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('HTTP Error: 500 Internal Server Error');
      }
    });

    it('should return error when fetch throws', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await queryApi('https://test-api.com/', 'What is this?');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error');
      }
    });
  });

  describe('main', () => {
    it('should execute query successfully', async () => {
      const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
      const mockSend = vi.fn();
      const mockClient = vi.mocked(CloudFormationClient);

      mockClient.mockImplementation(() => ({ send: mockSend }) as never);

      mockSend.mockResolvedValue({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'ApiGatewayEndpoint',
                OutputValue: 'https://test-api.execute-api.us-east-1.amazonaws.com/v1/',
              },
            ],
          },
        ],
      });

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ answer: 'Test answer' }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as never);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await main('Test question');

      expect(consoleSpy).toHaveBeenCalledWith('{"answer":"Test answer"}');

      consoleSpy.mockRestore();
    });

    it('should log error when endpoint retrieval fails', async () => {
      const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
      const mockSend = vi.fn();
      const mockClient = vi.mocked(CloudFormationClient);

      mockClient.mockImplementation(() => ({ send: mockSend }) as never);

      mockSend.mockRejectedValue(new Error('Stack not found'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await main('Test question');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Stack not found');
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
