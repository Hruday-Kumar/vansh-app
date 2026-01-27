/**
 * Navigation Mocks
 * Mock expo-router and navigation for testing
 */

import React from 'react';

// Mock navigation state
const mockNavigationState = {
  routes: [{ name: 'index', key: 'index-1' }],
  index: 0,
  stale: false,
  type: 'stack' as const,
  key: 'stack-1',
  routeNames: ['index'],
};

// Mock router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
  navigate: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
};

// Mock local search params
export const mockLocalSearchParams = <T extends Record<string, string>>(): T => {
  return {} as T;
};

// Mock navigation hook
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => () => {}),
  removeListener: jest.fn(),
  dispatch: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(() => mockNavigationState),
  setParams: jest.fn(),
};

// Mock segment  
export const mockSegments = ['(tabs)', 'index'];

// Mock pathname
export const mockPathname = '/';

// Create expo-router mock module
export const createExpoRouterMock = () => ({
  router: mockRouter,
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => mockSegments),
  usePathname: jest.fn(() => mockPathname),
  useNavigation: jest.fn(() => mockNavigation),
  useNavigationContainerRef: jest.fn(() => ({ current: null })),
  useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
    React.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, []);
  }),
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => 
    React.createElement('a', { href, ...props }, children),
  Stack: {
    Screen: ({ children }: { children?: React.ReactNode }) => children || null,
  },
  Tabs: {
    Screen: ({ children }: { children?: React.ReactNode }) => children || null,
  },
  Redirect: () => null,
  Slot: ({ children }: { children?: React.ReactNode }) => children || null,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
});

// Reset all navigation mocks
export const resetNavigationMocks = (): void => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.canGoBack.mockClear();
  mockRouter.setParams.mockClear();
  mockRouter.navigate.mockClear();
  mockNavigation.navigate.mockClear();
  mockNavigation.goBack.mockClear();
  mockNavigation.reset.mockClear();
};

// Helper to simulate navigation
export const simulateNavigation = {
  toMember: (memberId: string) => {
    mockRouter.push.mockImplementationOnce(() => {});
    mockRouter.push(`/member/${memberId}`);
  },
  toMemory: (memoryId: string) => {
    mockRouter.push.mockImplementationOnce(() => {});
    mockRouter.push(`/memory/${memoryId}`);
  },
  toTab: (tabName: 'vriksha' | 'smriti' | 'parampara' | 'katha' | 'vasiyat') => {
    mockRouter.replace.mockImplementationOnce(() => {});
    mockRouter.replace(`/(tabs)/${tabName}`);
  },
  goBack: () => {
    mockRouter.back.mockImplementationOnce(() => {});
    mockRouter.back();
  },
};
