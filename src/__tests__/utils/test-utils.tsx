/**
 * Test Utilities
 * Helper functions and utilities for testing
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react-native';
import React, { ReactElement, ReactNode } from 'react';

// Custom render wrapper with providers
interface WrapperProps {
  children: ReactNode;
}

// Basic wrapper (no providers needed for now)
const AllTheProviders: React.FC<WrapperProps> = ({ children }) => {
  return <>{children}</>;
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Override render with custom version
export { customRender as render };

// Async utilities
export const waitForAsync = (ms: number = 0): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

// Event simulation helpers
export const simulateTextInput = async (
  element: any,
  text: string,
  options: { delay?: number } = {},
): Promise<void> => {
  const { delay = 0 } = options;
  
  for (const char of text) {
    element.props.onChangeText?.(element.props.value + char);
    if (delay > 0) {
      await waitForAsync(delay);
    }
  }
};

// Accessibility helpers
export const getAccessibleElements = (container: any): any[] => {
  const elements: any[] = [];
  
  const traverse = (node: any) => {
    if (node.props?.accessible !== false && node.props?.accessibilityLabel) {
      elements.push(node);
    }
    React.Children.forEach(node.props?.children, traverse);
  };
  
  traverse(container);
  return elements;
};

// Snapshot test helper with date normalization
export const normalizeSnapshot = (snapshot: any): any => {
  const dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g;
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
  
  const json = JSON.stringify(snapshot);
  return JSON.parse(
    json
      .replace(dateRegex, '2024-01-01T00:00:00.000Z')
      .replace(uuidRegex, 'mock-uuid-placeholder'),
  );
};

// Component state inspection
export function inspectComponentState<T>(hook: () => T): T {
  let state: T;
  
  const TestComponent: React.FC = () => {
    state = hook();
    return null;
  };
  
  render(<TestComponent />);
  return state!;
}

// Mock timers helper
export const withFakeTimers = async (
  callback: () => Promise<void> | void,
): Promise<void> => {
  jest.useFakeTimers();
  try {
    await callback();
  } finally {
    jest.useRealTimers();
  }
};

// Animation test helpers
export const advanceAnimations = (ms: number): void => {
  jest.advanceTimersByTime(ms);
};

// Form testing helpers
export const fillForm = async (
  getByTestId: (testId: string) => any,
  formData: Record<string, string>,
): Promise<void> => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const input = getByTestId(`input-${fieldName}`);
    input.props.onChangeText?.(value);
    await flushPromises();
  }
};

// Error boundary testing
export const catchError = async (
  callback: () => Promise<void> | void,
): Promise<Error | null> => {
  try {
    await callback();
    return null;
  } catch (error) {
    return error as Error;
  }
};

// Performance testing helper
export const measureRenderTime = async (
  renderFn: () => void,
  iterations: number = 10,
): Promise<{ average: number; min: number; max: number }> => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
  };
};

// Network condition simulation
export const simulateNetworkConditions = {
  offline: () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'));
  },
  slow: (delayMs: number = 3000) => {
    const originalFetch = global.fetch;
    jest.spyOn(global, 'fetch').mockImplementation(async (...args) => {
      await waitForAsync(delayMs);
      return originalFetch(...args);
    });
  },
  restore: () => {
    jest.restoreAllMocks();
  },
};

// Test data generators
export const generateTestData = {
  string: (length: number = 10): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
  
  email: (): string => `test.${Date.now()}@example.com`,
  
  phone: (): string => `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
  
  date: (daysFromNow: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },
  
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

// Assert helpers
export const assertAccessibility = (container: any): void => {
  const interactiveElements = container.findAll((node: any) =>
    node.props?.onPress || node.props?.onLongPress,
  );
  
  interactiveElements.forEach((element: any) => {
    expect(element.props.accessible).not.toBe(false);
    expect(
      element.props.accessibilityLabel || element.props.accessibilityHint,
    ).toBeTruthy();
  });
};

export const assertNoConsoleErrors = (): void => {
  expect(console.error).not.toHaveBeenCalled();
};
