import { promises as fs } from 'node:fs';
import { PutVectorsCommand, S3VectorsClient } from '@aws-sdk/client-s3vectors';
import { BedrockEmbeddings } from '@langchain/aws';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import {
  addVectors,
  createEmbeddings,
  createVectorDocuments,
  parseCommandLineOptions,
  readSourceFile,
  splitTextIntoChunks,
  storeVectors,
  validateOptions,
} from '../src/index';

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('@langchain/textsplitters', () => ({
  MarkdownTextSplitter: vi.fn().mockImplementation(() => ({
    splitText: vi.fn(),
  })),
}));

vi.mock('@langchain/aws', () => ({
  BedrockEmbeddings: vi.fn().mockImplementation(() => ({
    embedQuery: vi.fn(),
  })),
}));

vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutVectorsCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(),
}));

describe('add-vectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readSourceFile', () => {
    it('should read source file successfully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue('Test content');

      const result = await readSourceFile('メイドインアビス');

      expect(mockReadFile).toHaveBeenCalledWith('../../assets/メイドインアビス.txt', 'utf-8');
      expect(result).toBe('Test content');
    });

    it('should throw error when file reading fails', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect(readSourceFile('invalid')).rejects.toThrow('File not found');
    });
  });

  describe('splitTextIntoChunks', () => {
    it('should split text into chunks and limit to 35', async () => {
      const mockSplitter = vi.mocked(MarkdownTextSplitter);
      const mockSplitText = vi.fn();

      const chunks = Array.from({ length: 50 }, (_, i) => `chunk ${i}`);
      mockSplitText.mockReturnValue(chunks);
      mockSplitter.mockImplementation(() => ({ splitText: mockSplitText }) as never);

      const result = await splitTextIntoChunks('long text content');

      expect(mockSplitter).toHaveBeenCalledWith({
        chunkSize: 1024,
        chunkOverlap: 256,
      });
      expect(mockSplitText).toHaveBeenCalledWith('long text content');
      expect(result).toHaveLength(35);
      expect(result[0]).toBe('chunk 0');
    });
  });

  describe('createEmbeddings', () => {
    it('should create embeddings for chunks', async () => {
      const mockEmbeddings = vi.mocked(BedrockEmbeddings);
      const mockEmbedQuery = vi.fn();

      mockEmbedQuery.mockResolvedValue([0.1, 0.2, 0.3]);
      mockEmbeddings.mockImplementation(() => ({ embedQuery: mockEmbedQuery }) as never);

      const chunks = ['chunk1', 'chunk2'];
      const result = await createEmbeddings(chunks);

      expect(mockEmbeddings).toHaveBeenCalledWith({
        client: expect.any(Object),
        model: 'amazon.titan-embed-text-v2:0',
      });
      expect(mockEmbedQuery).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        [0.1, 0.2, 0.3],
        [0.1, 0.2, 0.3],
      ]);
    });
  });

  describe('createVectorDocuments', () => {
    it('should create vector documents with metadata', async () => {
      const mockUuid = vi.mocked(uuidv4);
      (mockUuid as unknown as MockedFunction<() => string>)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      const chunks = ['chunk1', 'chunk2'];
      const embeddings = [
        [0.1, 0.2],
        [0.3, 0.4],
      ];
      const title = 'test';

      const result = await createVectorDocuments(chunks, embeddings, title);

      expect(result).toEqual([
        {
          key: 'uuid-1',
          data: { float32: [0.1, 0.2] },
          metadata: {
            text: 'chunk1',
            title: 'test',
          },
        },
        {
          key: 'uuid-2',
          data: { float32: [0.3, 0.4] },
          metadata: {
            text: 'chunk2',
            title: 'test',
          },
        },
      ]);
    });

    it('should truncate text metadata to 500 bytes', async () => {
      const mockUuid = vi.mocked(uuidv4);
      (mockUuid as unknown as MockedFunction<() => string>).mockReturnValue('uuid-1');

      const longText = 'あ'.repeat(200); // 600 bytes in UTF-8
      const chunks = [longText];
      const embeddings = [[0.1, 0.2]];
      const title = 'test';

      const result = await createVectorDocuments(chunks, embeddings, title);

      expect(Buffer.byteLength(result[0].metadata.text, 'utf-8')).toBeLessThanOrEqual(500);
    });
  });

  describe('storeVectors', () => {
    it('should store vectors in S3Vectors', async () => {
      const mockClient = vi.mocked(S3VectorsClient);
      const mockPutVectorsCommand = vi.mocked(PutVectorsCommand);
      const mockSend = vi.fn();

      mockClient.mockImplementation(() => ({ send: mockSend }) as never);
      mockSend.mockResolvedValue({});

      const vectors = [
        { key: 'uuid-1', data: { float32: [0.1] }, metadata: { text: 'chunk1', title: 'test' } },
      ];

      await storeVectors(vectors, 'bucket', 'index');

      expect(mockPutVectorsCommand).toHaveBeenCalledWith({
        vectorBucketName: 'bucket',
        indexName: 'index',
        vectors,
      });
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('parseCommandLineOptions', () => {
    it('should parse command line options with all arguments', () => {
      const argv = [
        'node',
        'index.js',
        '--title',
        'メイドインアビス',
        '--bucket-name',
        'my-bucket',
        '--index-name',
        'my-index',
        '--source-dir',
        './assets',
      ];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        title: 'メイドインアビス',
        bucketName: 'my-bucket',
        indexName: 'my-index',
        sourceDir: './assets',
      });
    });

    it('should use default values for optional arguments', () => {
      const argv = [
        'node',
        'index.js',
        '--title',
        'メイドインアビス',
        '--bucket-name',
        'my-bucket',
      ];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        title: 'メイドインアビス',
        bucketName: 'my-bucket',
        indexName: 'madeinabyss-s3vectors-search-index',
        sourceDir: '../../assets',
      });
    });

    it('should use default title when title is not specified', () => {
      const argv = ['node', 'index.js', '--bucket-name', 'my-bucket'];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        title: 'メイドインアビス',
        bucketName: 'my-bucket',
        indexName: 'madeinabyss-s3vectors-search-index',
        sourceDir: '../../assets',
      });
    });

    it('should throw error when required bucket-name is missing', () => {
      const argv = ['node', 'index.js'];

      expect(() => parseCommandLineOptions(argv)).toThrow(
        'Required argument --bucket-name is missing'
      );
    });
  });

  describe('addVectors', () => {
    it('should add vectors with provided options', async () => {
      // Setup all mocks
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue('Source content');

      const mockSplitter = vi.mocked(MarkdownTextSplitter);
      const mockSplitText = vi.fn();
      mockSplitText.mockReturnValue(['chunk1', 'chunk2']);
      mockSplitter.mockImplementation(() => ({ splitText: mockSplitText }) as never);

      const mockEmbeddings = vi.mocked(BedrockEmbeddings);
      const mockEmbedQuery = vi.fn();
      mockEmbedQuery.mockResolvedValue([0.1, 0.2]);
      mockEmbeddings.mockImplementation(() => ({ embedQuery: mockEmbedQuery }) as never);

      const mockUuid = vi.mocked(uuidv4);
      (mockUuid as unknown as MockedFunction<() => string>).mockReturnValue('uuid-1');

      const mockClient = vi.mocked(S3VectorsClient);
      const mockSend = vi.fn();
      mockClient.mockImplementation(() => ({ send: mockSend }) as never);

      const options = {
        title: 'テスト記事',
        bucketName: 'test-bucket',
        indexName: 'test-index',
        sourceDir: './assets',
      };

      await addVectors(options);

      expect(mockReadFile).toHaveBeenCalledWith('./assets/テスト記事.txt', 'utf-8');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when title is empty', async () => {
      const options = {
        title: '',
        bucketName: 'test-bucket',
        indexName: 'test-index',
        sourceDir: './assets',
      };

      await expect(addVectors(options)).rejects.toThrow('Title cannot be empty');
    });

    it('should throw error when bucket name is empty', async () => {
      const options = {
        title: 'テスト記事',
        bucketName: '',
        indexName: 'test-index',
        sourceDir: './assets',
      };

      await expect(addVectors(options)).rejects.toThrow('Bucket name cannot be empty');
    });

    it('should throw error when index name is empty', async () => {
      const options = {
        title: 'テスト記事',
        bucketName: 'test-bucket',
        indexName: '',
        sourceDir: './assets',
      };

      await expect(addVectors(options)).rejects.toThrow('Index name cannot be empty');
    });

    it('should handle errors during processing', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const options = {
        title: 'テスト記事',
        bucketName: 'test-bucket',
        indexName: 'test-index',
        sourceDir: './assets',
      };

      await expect(addVectors(options)).rejects.toThrow('File not found');
    });
  });

  describe('validateOptions', () => {
    it('should throw error when source directory is empty', () => {
      const options = {
        title: 'テスト記事',
        bucketName: 'test-bucket',
        indexName: 'test-index',
        sourceDir: '',
      };

      expect(() => validateOptions(options)).toThrow('Source directory cannot be empty');
    });

    it('should not throw error for valid options', () => {
      const options = {
        title: 'テスト記事',
        bucketName: 'test-bucket',
        indexName: 'test-index',
        sourceDir: './assets',
      };

      expect(() => validateOptions(options)).not.toThrow();
    });
  });
});
