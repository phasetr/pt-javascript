import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'

// Initialize DynamoDB clients
const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

// Get environment variables
const TABLE_NAME = process.env.TABLE_NAME || ''
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev'

// Create Hono app
const app = new Hono()

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString()
  })
})

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'CIIC API',
    environment: ENVIRONMENT,
    endpoints: [
      '/health - Health check',
      '/items - Create and list items',
      '/items/:id - Get item by ID'
    ]
  })
})

// Create item endpoint
app.post('/items', async (c) => {
  try {
    const body = await c.req.json()
    
    // Generate a simple ID (in production, use ULID or similar)
    const id = `item-${Date.now()}`
    
    // Create item in DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `ITEM#${id}`,
        SK: `ITEM#${id}`,
        id: id,
        entity: 'item',
        name: body.name || 'Unnamed Item',
        description: body.description || '',
        createdAt: new Date().toISOString(),
        environment: ENVIRONMENT
      }
    }))
    
    return c.json({ id, success: true }, 201)
  } catch (error) {
    console.error('Error creating item:', error)
    return c.json({ error: 'Failed to create item' }, 500)
  }
})

// Get item by ID endpoint
app.get('/items/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get item from DynamoDB
    const response = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ITEM#${id}`,
        SK: `ITEM#${id}`
      }
    }))
    
    if (!response.Item) {
      return c.json({ error: 'Item not found' }, 404)
    }
    
    return c.json(response.Item)
  } catch (error) {
    console.error('Error getting item:', error)
    return c.json({ error: 'Failed to get item' }, 500)
  }
})

// List items endpoint
app.get('/items', async (c) => {
  try {
    // Query items from DynamoDB using GSI
    const response = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'EntityIndex',
      KeyConditionExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':entity': 'item'
      }
    }))
    
    return c.json({ items: response.Items || [] })
  } catch (error) {
    console.error('Error listing items:', error)
    return c.json({ error: 'Failed to list items' }, 500)
  }
})

// Export Lambda handler
export const handler = handle(app)
