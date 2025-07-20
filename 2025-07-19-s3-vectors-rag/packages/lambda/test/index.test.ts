import type { APIGatewayProxyEvent } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'xmlbuilder2';
import {
  convertDocumentsToXml,
  extractDocumentsFromResponse,
  extractQuestion,
  handler,
  processRagRequest,
} from '../src/index';

describe('XML Document Generation', () => {
  it('should create valid XML from document array', () => {
    // テストデータ
    const documents = [{ text: 'メイドインアビスの概要' }, { text: '主人公リコの冒険' }];

    // 正しいXML生成方法をテスト
    const xmlDoc = create({ version: '1.0' }).ele('documents');

    for (const doc of documents) {
      xmlDoc.ele('document').txt(doc.text);
    }

    const result = xmlDoc.end({ prettyPrint: true });

    // XMLが正しく生成されることを確認
    expect(result).toContain('<documents>');
    expect(result).toContain('<document>メイドインアビスの概要</document>');
    expect(result).toContain('<document>主人公リコの冒険</document>');
    expect(result).toContain('</documents>');
  });

  it('should handle empty documents array', () => {
    const documents: Array<{ text: string }> = [];

    const xmlDoc = create({ version: '1.0' }).ele('documents');

    for (const doc of documents) {
      xmlDoc.ele('document').txt(doc.text);
    }

    const result = xmlDoc.end({ prettyPrint: true });

    expect(result).toContain('<documents/>');
  });

  it('should handle special characters in text', () => {
    const documents = [{ text: '特殊文字 & < > " \' を含むテキスト' }];

    const xmlDoc = create({ version: '1.0' }).ele('documents');

    for (const doc of documents) {
      xmlDoc.ele('document').txt(doc.text);
    }

    const result = xmlDoc.end({ prettyPrint: true });

    // XMLエスケープされていることを確認
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });
});

describe('handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return error when environment variables are not configured', async () => {
    delete process.env.VECTOR_BUCKET_NAME;
    delete process.env.VECTOR_INDEX_NAME;

    const event = {
      body: JSON.stringify({ question: 'テスト質問' }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Environment variables not configured',
    });
  });

  it('should handle only bucket name missing', async () => {
    delete process.env.VECTOR_BUCKET_NAME;
    process.env.VECTOR_INDEX_NAME = 'test-index';

    const event = {
      body: JSON.stringify({ question: 'テスト質問' }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Environment variables not configured',
    });
  });

  it('should handle only index name missing', async () => {
    process.env.VECTOR_BUCKET_NAME = 'test-bucket';
    delete process.env.VECTOR_INDEX_NAME;

    const event = {
      body: JSON.stringify({ question: 'テスト質問' }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Environment variables not configured',
    });
  });
});

describe('processRagRequest', () => {
  it('should return error when question is missing', async () => {
    const event = {
      body: JSON.stringify({}),
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should return error when body is invalid JSON', async () => {
    const event = {
      body: 'invalid json',
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle empty body', async () => {
    const event = {
      body: null,
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle question with empty string', async () => {
    const event = {
      body: JSON.stringify({ question: '' }),
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle question with whitespace only', async () => {
    const event = {
      body: JSON.stringify({ question: '   ' }),
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle question with undefined', async () => {
    const event = {
      body: JSON.stringify({ question: undefined }),
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle question with null', async () => {
    const event = {
      body: JSON.stringify({ question: null }),
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle body with no question property', async () => {
    const event = {
      body: JSON.stringify({ other: 'value' }),
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });

  it('should handle empty JSON object', async () => {
    const event = {
      body: '{}',
    } as APIGatewayProxyEvent;

    const options = {
      bucketName: 'test-bucket',
      indexName: 'test-index',
    };

    const result = await processRagRequest(event, options);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Question is required',
    });
  });
});

describe('extractQuestion', () => {
  it('should return null for null body', () => {
    const result = extractQuestion(null);
    expect(result).toBeNull();
  });

  it('should return null for empty string body', () => {
    const result = extractQuestion('');
    expect(result).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    const result = extractQuestion('invalid json');
    expect(result).toBeNull();
  });

  it('should return null for empty question', () => {
    const result = extractQuestion(JSON.stringify({ question: '' }));
    expect(result).toBeNull();
  });

  it('should return null for whitespace only question', () => {
    const result = extractQuestion(JSON.stringify({ question: '   ' }));
    expect(result).toBeNull();
  });

  it('should return null for null question', () => {
    const result = extractQuestion(JSON.stringify({ question: null }));
    expect(result).toBeNull();
  });

  it('should return null for undefined question', () => {
    const result = extractQuestion(JSON.stringify({ question: undefined }));
    expect(result).toBeNull();
  });

  it('should return null for missing question property', () => {
    const result = extractQuestion(JSON.stringify({ other: 'value' }));
    expect(result).toBeNull();
  });

  it('should return trimmed question for valid input', () => {
    const result = extractQuestion(JSON.stringify({ question: '  Valid question  ' }));
    expect(result).toBe('Valid question');
  });

  it('should return question for valid JSON with question', () => {
    const result = extractQuestion(JSON.stringify({ question: 'メイドインアビスとは何ですか？' }));
    expect(result).toBe('メイドインアビスとは何ですか？');
  });
});

describe('convertDocumentsToXml', () => {
  it('should convert empty documents array to empty XML', () => {
    const result = convertDocumentsToXml([]);
    expect(result).toContain('<documents/>');
  });

  it('should convert single document to XML', () => {
    const documents = [{ text: 'Test document' }];
    const result = convertDocumentsToXml(documents);
    expect(result).toContain('<documents>');
    expect(result).toContain('<document>Test document</document>');
    expect(result).toContain('</documents>');
  });

  it('should convert multiple documents to XML', () => {
    const documents = [{ text: 'First document' }, { text: 'Second document' }];
    const result = convertDocumentsToXml(documents);
    expect(result).toContain('<document>First document</document>');
    expect(result).toContain('<document>Second document</document>');
  });

  it('should handle special characters in documents', () => {
    const documents = [{ text: 'Text with & < > " \' characters' }];
    const result = convertDocumentsToXml(documents);
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('should handle empty text in documents', () => {
    const documents = [{ text: '' }];
    const result = convertDocumentsToXml(documents);
    expect(result).toContain('<document/>');
  });
});

describe('extractDocumentsFromResponse', () => {
  it('should return empty array for undefined response', () => {
    const result = extractDocumentsFromResponse(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for null response', () => {
    const result = extractDocumentsFromResponse(null);
    expect(result).toEqual([]);
  });

  it('should return empty array for response without vectors', () => {
    const result = extractDocumentsFromResponse({});
    expect(result).toEqual([]);
  });

  it('should return empty array for null vectors', () => {
    const result = extractDocumentsFromResponse({ vectors: null });
    expect(result).toEqual([]);
  });

  it('should extract text from single vector', () => {
    const response = {
      vectors: [
        {
          metadata: { text: 'Test document' },
        },
      ],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: 'Test document' }]);
  });

  it('should extract text from multiple vectors', () => {
    const response = {
      vectors: [
        { metadata: { text: 'First document' } },
        { metadata: { text: 'Second document' } },
      ],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: 'First document' }, { text: 'Second document' }]);
  });

  it('should handle vector without metadata', () => {
    const response = {
      vectors: [{}, { metadata: { text: 'Valid document' } }],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: '' }, { text: 'Valid document' }]);
  });

  it('should handle vector with null metadata', () => {
    const response = {
      vectors: [{ metadata: null }, { metadata: { text: 'Valid document' } }],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: '' }, { text: 'Valid document' }]);
  });

  it('should handle vector with metadata without text', () => {
    const response = {
      vectors: [{ metadata: { other: 'value' } }, { metadata: { text: 'Valid document' } }],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: '' }, { text: 'Valid document' }]);
  });

  it('should handle vector with null text', () => {
    const response = {
      vectors: [{ metadata: { text: null } }, { metadata: { text: 'Valid document' } }],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: '' }, { text: 'Valid document' }]);
  });

  it('should handle vector with non-string text', () => {
    const response = {
      vectors: [{ metadata: { text: 123 } }, { metadata: { text: 'Valid document' } }],
    };
    const result = extractDocumentsFromResponse(response);
    expect(result).toEqual([{ text: '' }, { text: 'Valid document' }]);
  });
});
