import { promises as fs } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  convertHtmlToMarkdown,
  createDirectory,
  fetchWikipediaContent,
  loadSource,
  parseCommandLineOptions,
  saveToFile,
  validateOptions,
} from '../src/index';

// Mock external dependencies
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('cheerio', () => ({
  load: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('load-source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDirectory', () => {
    it('should create assets directory', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);

      await createDirectory('assets');

      expect(mockMkdir).toHaveBeenCalledWith('assets', { recursive: true });
    });
  });

  describe('fetchWikipediaContent', () => {
    it('should fetch Wikipedia content successfully', async () => {
      const mockHtml = '<html><body><div class="mw-body-content">Test content</div></body></html>';
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await fetchWikipediaContent('メイドインアビス');

      expect(mockFetch).toHaveBeenCalledWith('https://ja.wikipedia.org/wiki/メイドインアビス');
      expect(result).toBe(mockHtml);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchWikipediaContent('invalid')).rejects.toThrow(
        'Failed to fetch Wikipedia content: 404'
      );
    });
  });

  describe('convertHtmlToMarkdown', () => {
    it('should extract mw-body-content and convert to markdown', async () => {
      const cheerio = await import('cheerio');
      const mockLoad = vi.mocked(cheerio.load);

      const mockElement = {
        length: 1,
        text: vi.fn().mockReturnValue('Test content'),
      };

      const mockCheerioInstance = vi.fn().mockReturnValue(mockElement) as never;
      mockLoad.mockReturnValue(mockCheerioInstance);

      const result = await convertHtmlToMarkdown(
        '<html><body><div class="mw-body-content">Test content</div></body></html>'
      );

      expect(mockLoad).toHaveBeenCalled();
      expect(mockCheerioInstance).toHaveBeenCalledWith('.mw-body-content');
      expect(result).toBe('Test content');
    });

    it('should return empty string when mw-body-content not found', async () => {
      const cheerio = await import('cheerio');
      const mockLoad = vi.mocked(cheerio.load);

      const mockElement = {
        length: 0,
        text: vi.fn(),
      };

      const mockCheerioInstance = vi.fn().mockReturnValue(mockElement) as never;
      mockLoad.mockReturnValue(mockCheerioInstance);

      const result = await convertHtmlToMarkdown('<html><body></body></html>');

      expect(result).toBe('');
    });
  });

  describe('saveToFile', () => {
    it('should save content to file', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue();

      await saveToFile('assets/test.txt', 'test content');

      expect(mockWriteFile).toHaveBeenCalledWith('assets/test.txt', 'test content', 'utf-8');
    });
  });

  describe('parseCommandLineOptions', () => {
    it('should parse command line options with title argument', () => {
      const argv = [
        'node',
        'index.js',
        '--title',
        'メイドインアビス',
        '--output-dir',
        './assets',
        '--output-filename',
        'test.txt',
      ];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        title: 'メイドインアビス',
        outputDir: './assets',
        outputFilename: 'test.txt',
      });
    });

    it('should use default values for optional arguments', () => {
      const argv = ['node', 'index.js', '--title', 'メイドインアビス'];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        title: 'メイドインアビス',
        outputDir: '../../assets',
        outputFilename: 'メイドインアビス.txt',
      });
    });

    it('should use default title when title is not specified', () => {
      const argv = ['node', 'index.js'];

      const result = parseCommandLineOptions(argv);

      expect(result).toEqual({
        title: 'メイドインアビス',
        outputDir: '../../assets',
        outputFilename: 'メイドインアビス.txt',
      });
    });
  });

  describe('loadSource', () => {
    it('should load source with provided options', async () => {
      const mockHtml = '<html><body><div class="mw-body-content">Test content</div></body></html>';

      // Setup mocks
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const cheerio = await import('cheerio');
      const mockLoad = vi.mocked(cheerio.load);

      const mockElement = {
        length: 1,
        text: vi.fn().mockReturnValue('Test content'),
      };

      const mockCheerioInstance = vi.fn().mockReturnValue(mockElement) as never;
      mockLoad.mockReturnValue(mockCheerioInstance);

      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const options = {
        title: 'テスト記事',
        outputDir: './assets',
        outputFilename: 'test.txt',
      };

      await loadSource(options);

      expect(mockMkdir).toHaveBeenCalledWith('./assets', { recursive: true });
      expect(mockFetch).toHaveBeenCalledWith('https://ja.wikipedia.org/wiki/テスト記事');
      expect(mockWriteFile).toHaveBeenCalledWith('./assets/test.txt', 'Test content', 'utf-8');
    });

    it('should throw error when title is empty', async () => {
      const options = {
        title: '',
        outputDir: './assets',
        outputFilename: 'test.txt',
      };

      await expect(loadSource(options)).rejects.toThrow('Title cannot be empty');
    });

    it('should throw error when output directory is empty', async () => {
      const options = {
        title: 'テスト記事',
        outputDir: '',
        outputFilename: 'test.txt',
      };

      await expect(loadSource(options)).rejects.toThrow('Output directory cannot be empty');
    });

    it('should handle errors during processing', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockRejectedValue(new Error('Network error'));

      const options = {
        title: 'テスト記事',
        outputDir: './assets',
        outputFilename: 'test.txt',
      };

      await expect(loadSource(options)).rejects.toThrow('Network error');
    });
  });

  describe('validateOptions', () => {
    it('should throw error when output filename is empty', () => {
      const options = {
        title: 'テスト記事',
        outputDir: './assets',
        outputFilename: '',
      };

      expect(() => validateOptions(options)).toThrow('Output filename cannot be empty');
    });

    it('should not throw error for valid options', () => {
      const options = {
        title: 'テスト記事',
        outputDir: './assets',
        outputFilename: 'test.txt',
      };

      expect(() => validateOptions(options)).not.toThrow();
    });
  });
});
