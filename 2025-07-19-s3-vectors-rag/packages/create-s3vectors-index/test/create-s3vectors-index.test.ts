import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIndex,
  createS3VectorsIndex,
  createVectorBucket,
  parseCommandLineOptions,
  validateOptions,
} from '../src/index';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  CreateVectorBucketCommand: vi.fn(),
  CreateIndexCommand: vi.fn(),
}));

describe('create-s3vectors-index', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    vi.clearAllMocks();
    // 元の環境変数を保存
    originalEnv = {
      VECTOR_BUCKET_NAME: process.env.VECTOR_BUCKET_NAME,
      VECTOR_INDEX_NAME: process.env.VECTOR_INDEX_NAME,
      VECTOR_DIMENSION: process.env.VECTOR_DIMENSION,
      DISTANCE_METRIC: process.env.DISTANCE_METRIC,
      DATA_TYPE: process.env.DATA_TYPE,
    };
    // テスト用の値を設定
    process.env.VECTOR_BUCKET_NAME = 'test-bucket';
    process.env.VECTOR_INDEX_NAME = 'test-index';
    process.env.VECTOR_DIMENSION = '1024';
    process.env.DISTANCE_METRIC = 'euclidean';
    process.env.DATA_TYPE = 'float32';
  });

  afterEach(() => {
    // 元の環境変数を復元
    process.env.VECTOR_BUCKET_NAME = originalEnv.VECTOR_BUCKET_NAME;
    process.env.VECTOR_INDEX_NAME = originalEnv.VECTOR_INDEX_NAME;
    process.env.VECTOR_DIMENSION = originalEnv.VECTOR_DIMENSION;
    process.env.DISTANCE_METRIC = originalEnv.DISTANCE_METRIC;
    process.env.DATA_TYPE = originalEnv.DATA_TYPE;
  });

  describe('createVectorBucket', () => {
    it('should create vector bucket successfully', async () => {
      const { S3VectorsClient, CreateVectorBucketCommand } = await import(
        '@aws-sdk/client-s3vectors'
      );
      const mockClient = vi.mocked(S3VectorsClient);
      const mockCommand = vi.mocked(CreateVectorBucketCommand);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({
        send: mockSend,
        config: {} as never,
        destroy: vi.fn(),
        middlewareStack: {} as never,
      }));
      mockSend.mockResolvedValue({});

      await createVectorBucket('test-bucket');

      expect(mockCommand).toHaveBeenCalledWith({
        vectorBucketName: 'test-bucket',
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when bucket creation fails', async () => {
      const { S3VectorsClient } = await import('@aws-sdk/client-s3vectors');
      const mockClient = vi.mocked(S3VectorsClient);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({
        send: mockSend,
        config: {} as never,
        destroy: vi.fn(),
        middlewareStack: {} as never,
      }));
      mockSend.mockRejectedValue(new Error('Bucket creation failed'));

      await expect(createVectorBucket('test-bucket')).rejects.toThrow('Bucket creation failed');
    });
  });

  describe('createIndex', () => {
    it('should create index successfully', async () => {
      const { S3VectorsClient, CreateIndexCommand } = await import('@aws-sdk/client-s3vectors');
      const mockClient = vi.mocked(S3VectorsClient);
      const mockCommand = vi.mocked(CreateIndexCommand);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({
        send: mockSend,
        config: {} as never,
        destroy: vi.fn(),
        middlewareStack: {} as never,
      }));
      mockSend.mockResolvedValue({});

      const config = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 1024,
        distanceMetric: 'euclidean' as const,
        dataType: 'float32' as const,
      };

      await createIndex(config);

      expect(mockCommand).toHaveBeenCalledWith({
        vectorBucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 1024,
        distanceMetric: 'euclidean',
        dataType: 'float32',
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when index creation fails', async () => {
      const { S3VectorsClient } = await import('@aws-sdk/client-s3vectors');
      const mockClient = vi.mocked(S3VectorsClient);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({
        send: mockSend,
        config: {} as never,
        destroy: vi.fn(),
        middlewareStack: {} as never,
      }));
      mockSend.mockRejectedValue(new Error('Index creation failed'));

      const config = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 1024,
        distanceMetric: 'euclidean' as const,
        dataType: 'float32' as const,
      };

      await expect(createIndex(config)).rejects.toThrow('Index creation failed');
    });
  });

  describe('parseCommandLineOptions', () => {
    it('should parse command line options with all required arguments', () => {
      const argv = [
        'node',
        'index.js',
        '--bucket-name',
        'my-bucket',
        '--index-name',
        'my-index',
        '--dimension',
        '1024',
        '--distance-metric',
        'cosine',
      ];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        bucketName: 'my-bucket',
        indexName: 'my-index',
        dimension: 1024,
        distanceMetric: 'cosine',
        dataType: 'float32',
      });
    });

    it('should use default values for optional arguments', () => {
      const argv = ['node', 'index.js', '--bucket-name', 'my-bucket'];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        bucketName: 'my-bucket',
        indexName: 'madeinabyss-s3vectors-search-index',
        dimension: 1024,
        distanceMetric: 'euclidean',
        dataType: 'float32',
      });
    });

    it('should throw error when required bucket-name is missing', () => {
      const argv = ['node', 'index.js'];

      expect(() => parseCommandLineOptions(argv)).toThrow(
        'Required argument --bucket-name is missing'
      );
    });

    it('should throw error when dimension is not a number', () => {
      const argv = ['node', 'index.js', '--bucket-name', 'my-bucket', '--dimension', 'invalid'];

      expect(() => parseCommandLineOptions(argv)).toThrow('Dimension must be a valid number');
    });

    it('should handle cosine distance metric', () => {
      const argv = [
        'node',
        'index.js',
        '--bucket-name',
        'my-bucket',
        '--distance-metric',
        'cosine',
      ];

      const result = parseCommandLineOptions(argv);

      expect(result.distanceMetric).toBe('cosine');
    });

    it('should handle commander exitOverride errors', () => {
      const argv = ['node', 'index.js', '--help'];

      expect(() => parseCommandLineOptions(argv)).toThrow();
    });

    it('should throw specific error for missing required option', () => {
      const argv = ['node', 'index.js', '--dimension', '1024'];

      expect(() => parseCommandLineOptions(argv)).toThrow('Required argument --bucket-name is missing');
    });
  });

  describe('createS3VectorsIndex', () => {
    it('should create index with provided options', async () => {
      const { S3VectorsClient } = await import('@aws-sdk/client-s3vectors');
      const mockClient = vi.mocked(S3VectorsClient);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({
        send: mockSend,
        config: {} as never,
        destroy: vi.fn(),
        middlewareStack: {} as never,
      }));
      mockSend.mockResolvedValue({});

      const options = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 512,
        distanceMetric: 'cosine' as const,
        dataType: 'float32' as const,
      };

      await createS3VectorsIndex(options);

      expect(mockSend).toHaveBeenCalledTimes(2); // bucket creation + index creation
    });

    it('should throw error when options are invalid', async () => {
      const options = {
        bucketName: '',
        indexName: 'test-index',
        dimension: 512,
        distanceMetric: 'cosine' as const,
        dataType: 'float32' as const,
      };

      await expect(createS3VectorsIndex(options)).rejects.toThrow('Bucket name cannot be empty');
    });

    it('should handle errors during bucket or index creation', async () => {
      const { S3VectorsClient } = await import('@aws-sdk/client-s3vectors');
      const mockClient = vi.mocked(S3VectorsClient);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({
        send: mockSend,
        config: {} as never,
        destroy: vi.fn(),
        middlewareStack: {} as never,
      }));
      mockSend.mockRejectedValue(new Error('AWS Error'));

      const options = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 512,
        distanceMetric: 'cosine' as const,
        dataType: 'float32' as const,
      };

      await expect(createS3VectorsIndex(options)).rejects.toThrow('AWS Error');
    });
  });

  describe('validateOptions', () => {
    it('should throw error when index name is empty', () => {
      const options = {
        bucketName: 'test-bucket',
        indexName: '',
        dimension: 1024,
        distanceMetric: 'euclidean' as const,
        dataType: 'float32' as const,
      };

      expect(() => validateOptions(options)).toThrow('Index name cannot be empty');
    });

    it('should throw error when dimension is zero or negative', () => {
      const options = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 0,
        distanceMetric: 'euclidean' as const,
        dataType: 'float32' as const,
      };

      expect(() => validateOptions(options)).toThrow('Dimension must be a positive number');
    });

    it('should throw error when distance metric is invalid', () => {
      const options = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 1024,
        distanceMetric: 'invalid' as never,
        dataType: 'float32' as const,
      };

      expect(() => validateOptions(options)).toThrow(
        'Distance metric must be "euclidean" or "cosine"'
      );
    });

    it('should throw error when data type is invalid', () => {
      const options = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 1024,
        distanceMetric: 'euclidean' as const,
        dataType: 'invalid' as never,
      };

      expect(() => validateOptions(options)).toThrow('Data type must be "float32"');
    });

    it('should not throw error for valid options', () => {
      const options = {
        bucketName: 'test-bucket',
        indexName: 'test-index',
        dimension: 1024,
        distanceMetric: 'euclidean' as const,
        dataType: 'float32' as const,
      };

      expect(() => validateOptions(options)).not.toThrow();
    });
  });
});
