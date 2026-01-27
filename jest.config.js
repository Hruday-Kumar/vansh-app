/**
 * Jest Configuration for Vansh Family Heritage App
 * Simplified configuration for standalone unit tests
 */

module.exports = {
  // Use ts-jest for TypeScript
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test patterns - only run our standalone tests
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{ts,tsx}',
  ],

  // Don't transform node_modules
  transformIgnorePatterns: [
    'node_modules/',
  ],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock asset files
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__tests__/mocks/fileMock.ts',
    '\\.(ttf|otf|woff|woff2)$': '<rootDir>/src/__tests__/mocks/fileMock.ts',
  },

  // Ignore files - these import React Native / Expo which we can't use in node
  testPathIgnorePatterns: [
    '/node_modules/',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage configuration (disabled for now)
  collectCoverage: false,

  // Timeouts
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Reporters
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Vansh App Test Report',
      outputPath: 'coverage/test-report.html',
    }],
  ],

  // Global setup/teardown
  globalSetup: '<rootDir>/src/__tests__/setup/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/global-teardown.ts',

  // Force exit after tests complete
  forceExit: true,
};
