import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestTable, deleteTestTable, createTestItem, request, createTestApp } from './setup'
import type { Hono } from 'hono'

describe('API Tests', () => {
  let testApp: any

  // Setup and teardown
  beforeAll(async () => {
    // Create test table
    await createTestTable()
    testApp = createTestApp()
  })

  afterAll(async () => {
    // Delete test table
    await deleteTestTable()
  })

  // Test health endpoint
  it('should return health status', async () => {
    const response = await request(testApp, 'GET', '/health', undefined)
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('environment', 'test')
    expect(response.body).toHaveProperty('timestamp')
  })

  // Test root endpoint
  it('should return API info', async () => {
    const response = await request(testApp, 'GET', '/', undefined)
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message', 'CIIC API')
    expect(response.body).toHaveProperty('environment', 'test')
    expect(response.body).toHaveProperty('endpoints')
    expect(response.body.endpoints).toBeInstanceOf(Array)
  })

  // Test item creation
  it('should create an item', async () => {
    const testItem = {
      name: 'Test Item',
      description: 'This is a test item'
    }
    
    const response = await request(testApp, 'POST', '/items', testItem)
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('success', true)
    
    // Store the item ID for the next test
    const itemId = response.body.id
    
    // Test getting the item
    const getResponse = await request(testApp, 'GET', `/items/${itemId}`, undefined)
    
    expect(getResponse.status).toBe(200)
    expect(getResponse.body).toHaveProperty('PK', `ITEM#${itemId}`)
    expect(getResponse.body).toHaveProperty('SK', `ITEM#${itemId}`)
    expect(getResponse.body).toHaveProperty('name', 'Test Item')
    expect(getResponse.body).toHaveProperty('description', 'This is a test item')
    expect(getResponse.body).toHaveProperty('entity', 'item')
    expect(getResponse.body).toHaveProperty('environment', 'test')
  })

  // Test item listing
  it('should list items', async () => {
    // Create a test item first
    await createTestItem('test-list-item', 'List Test Item', 'This is for testing list endpoint')
    
    const response = await request(testApp, 'GET', '/items', undefined)
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('items')
    expect(response.body.items).toBeInstanceOf(Array)
    expect(response.body.items.length).toBeGreaterThan(0)
    
    // Check if our test item is in the list
    const testItem = response.body.items.find((item: Record<string, unknown>) => item.id === 'test-list-item')
    expect(testItem).toBeDefined()
    expect(testItem).toHaveProperty('name', 'List Test Item')
    expect(testItem).toHaveProperty('description', 'This is for testing list endpoint')
  })

  // Test getting a non-existent item
  it('should return 404 for non-existent item', async () => {
    const response = await request(testApp, 'GET', '/items/non-existent-id', undefined)
    
    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'Item not found')
  })
})
