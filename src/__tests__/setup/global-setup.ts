/**
 * Global Setup
 * Runs once before all test suites
 */

export default async function globalSetup(): Promise<void> {
  console.log('\n🧪 Starting Vansh App Test Suite...\n');
  
  // Set test environment variables using Object.assign to work around readonly
  Object.assign(process.env, {
    NODE_ENV: 'test',
    TZ: 'UTC',
  });
  
  // Any one-time global setup (database connections, etc.)
  // In a real scenario, you might set up test databases here
}
