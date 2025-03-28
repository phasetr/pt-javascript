#!/usr/bin/env node
import { apiClient } from './api-client.js';
import { getEnvironment } from './config.js';

async function checkApiConnection() {
  try {
    console.log(`Testing API connection in ${getEnvironment()} environment...`);
    
    // Create a test todo
    const createResponse = await apiClient.createTodo({
      userId: 'test-user',
      title: 'Test Todo',
      completed: false,
      dueDate: '2025-12-31'
    });
    
    console.log('✅ Create Todo API is working!');
    console.log('Created Todo:', createResponse.todo);
    
    // Get todos by user ID
    const todos = await apiClient.getTodosByUserId('test-user');
    console.log('✅ Get Todos by User ID API is working!');
    console.log('Found Todos:', todos.length);
    
    // Get todo by ID
    const todo = await apiClient.getTodoById(createResponse.todo.id);
    console.log('✅ Get Todo by ID API is working!');
    console.log('Retrieved Todo:', todo);
    
    // Update todo
    const updatedTodo = await apiClient.updateTodo(createResponse.todo.id, {
      title: 'Updated Test Todo',
      completed: true
    });
    console.log('✅ Update Todo API is working!');
    console.log('Updated Todo:', updatedTodo);
    
    // Delete todo
    const deleteResponse = await apiClient.deleteTodo(createResponse.todo.id);
    console.log('✅ Delete Todo API is working!');
    console.log('Delete Response:', deleteResponse);
    
    console.log('All API endpoints are working correctly!');
  } catch (error) {
    console.error('❌ API test failed:', error);
    console.error(error);
  }
}

// Run the test
checkApiConnection();
