/**
 * 🪷 DATABASE CONNECTION - Production-Ready MySQL2 Pool
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Production-ready pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'vansh_db',
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: isProduction ? 25 : 10,
  maxIdle: isProduction ? 10 : 5,
  idleTimeout: 60000, // 60 seconds
  queueLimit: 0,
  
  // Keep connections alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  
  // Connection settings
  connectTimeout: 10000, // 10 seconds
  
  // Query settings
  namedPlaceholders: true,
  dateStrings: false,
  
  // SSL for production (uncomment and configure for production)
  // ssl: isProduction ? {
  //   rejectUnauthorized: true,
  //   ca: process.env.DB_SSL_CA,
  // } : undefined,
});

// Connection health check
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Database pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

// Execute query with automatic retry for transient errors
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection errors
      const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'];
      if (!retryableCodes.includes(error.code)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`Database retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export default pool;
