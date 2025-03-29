import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DynamoDBClient, ListTablesCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = vi.fn();
  return {
    DynamoDBClient: vi.fn(() => ({
      send: mockSend
    })),
    ListTablesCommand: vi.fn(),
    CreateTableCommand: vi.fn(),
    KeyType: {
      HASH: 'HASH'
    },
    ScalarAttributeType: {
      S: 'S'
    },
    ProjectionType: {
      ALL: 'ALL'
    }
  };
});

vi.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: vi.fn(() => 'mockedDocClient')
    }
  };
});

describe('DynamoDB Client', () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetModules();
    vi.resetAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe('Client initialization', () => {
    it('should create client with dev config when ENV is local', async () => {
      // Set environment to local
      process.env.ENV = 'local';
      
      // Import the module (after setting ENV)
      const { docClient } = await import('../src/client');
      
      // Check if DynamoDBClient was called with dev config
      expect(DynamoDBClient).toHaveBeenCalledWith({
        endpoint: 'http://localhost:8000',
        region: 'ap-northeast-1',
        credentials: {
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
        },
      });
      
      // Check if DynamoDBDocumentClient.from was called with the client
      expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
      expect(docClient).toBe('mockedDocClient');
    });

    it('should create client with empty config when ENV is not local', async () => {
      // Set environment to something other than local
      process.env.ENV = 'dev';
      
      // Import the module (after setting ENV)
      const { docClient } = await import('../src/client');
      
      // Check if DynamoDBClient was called with empty config
      expect(DynamoDBClient).toHaveBeenCalledWith({});
      
      // Check if DynamoDBDocumentClient.from was called with the client
      expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
      expect(docClient).toBe('mockedDocClient');
    });
  });

  describe('getTableName', () => {
    it('should return table name with local environment by default', async () => {
      // Clear ENV
      process.env.ENV = undefined;
      
      // Import the module
      const { getTableName } = await import('../src/client');
      
      // Check if table name is correct
      expect(getTableName()).toBe('CBAL-localTodos');
    });

    it('should return table name with specified environment', async () => {
      // Set environment
      process.env.ENV = 'dev';
      
      // Import the module
      const { getTableName } = await import('../src/client');
      
      // Check if table name is correct
      expect(getTableName()).toBe('CBAL-devTodos');
    });
  });

  describe('getIndexName', () => {
    it('should return index name with local environment by default', async () => {
      // Clear ENV
      process.env.ENV = undefined;
      
      // Import the module
      const { getIndexName } = await import('../src/client');
      
      // Check if index name is correct
      expect(getIndexName()).toBe('CBAL-localUserIdIndex');
    });

    it('should return index name with specified environment', async () => {
      // Set environment
      process.env.ENV = 'prod';
      
      // Import the module
      const { getIndexName } = await import('../src/client');
      
      // Check if index name is correct
      expect(getIndexName()).toBe('CBAL-prodUserIdIndex');
    });
  });

  describe('initializeDynamoDB', () => {
    it('should create table if it does not exist in local environment', async () => {
      // Set environment to local
      process.env.ENV = 'local';
      
      // Mock ListTablesCommand to return no tables
      const mockSend = vi.fn().mockResolvedValueOnce({ TableNames: [] });
      vi.mocked(DynamoDBClient).mockImplementation(() => ({
        send: mockSend
      } as unknown as DynamoDBClient));
      
      // Import the module (which will trigger initializeDynamoDB)
      await import('../src/client');
      
      // Check if ListTablesCommand was called
      expect(ListTablesCommand).toHaveBeenCalledWith({});
      
      // Check if CreateTableCommand was called
      expect(CreateTableCommand).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(2); // Once for list, once for create
    });

    it('should not create table if it already exists in local environment', async () => {
      // Set environment to local
      process.env.ENV = 'local';
      
      // Mock ListTablesCommand to return the table
      const mockSend = vi.fn().mockResolvedValueOnce({ 
        TableNames: ['CBAL-localTodos'] 
      });
      vi.mocked(DynamoDBClient).mockImplementation(() => ({
        send: mockSend
      } as unknown as DynamoDBClient));
      
      // Import the module (which will trigger initializeDynamoDB)
      await import('../src/client');
      
      // Check if ListTablesCommand was called
      expect(ListTablesCommand).toHaveBeenCalledWith({});
      
      // Check if CreateTableCommand was not called
      expect(CreateTableCommand).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(1); // Only for list
    });

    it('should not initialize DynamoDB in non-local environments', async () => {
      // Set environment to something other than local
      process.env.ENV = 'dev';
      
      const mockSend = vi.fn();
      vi.mocked(DynamoDBClient).mockImplementation(() => ({
        send: mockSend
      } as unknown as DynamoDBClient));
      
      // Import the module (which will trigger initializeDynamoDB)
      await import('../src/client');
      
      // Check that no DynamoDB operations were performed
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle errors during initialization', async () => {
      // Set environment to local
      process.env.ENV = 'local';
      
      // Mock console.error to verify it's called
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock ListTablesCommand to throw an error
      const mockSend = vi.fn().mockRejectedValueOnce(new Error('Connection error'));
      vi.mocked(DynamoDBClient).mockImplementation(() => ({
        send: mockSend
      } as unknown as DynamoDBClient));
      
      // Import the module (which will trigger initializeDynamoDB)
      await import('../src/client');
      
      // Check if error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error initializing DynamoDB:',
        expect.any(Error)
      );
    });
  });
});
