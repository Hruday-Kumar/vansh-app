/**
 * 🪷 ERROR BOUNDARY
 * Catches JavaScript errors in child components
 * Displays a fallback UI instead of crashing
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Store error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Report to Sentry or other error tracking service
    // captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.container}
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>🪷</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We apologize for the inconvenience. The app encountered an unexpected error.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════
// HOOK VERSION (for functional components)
// ═══════════════════════════════════════════════════════════

interface UseErrorBoundaryState {
  error: Error | null;
  resetError: () => void;
}

export function useErrorBoundary(): UseErrorBoundaryState {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  // Effect to catch promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    // Note: This works in web but not in React Native
    // For RN, you'd use react-native-exception-handler
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  return { error, resetError };
}

// ═══════════════════════════════════════════════════════════
// SCREEN ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({ children, screenName }: ScreenErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`Error in ${screenName || 'screen'}:`, error.message);
        // TODO: Report to analytics
      }}
      fallback={
        <View style={styles.screenError}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.screenErrorText}>
            Unable to load {screenName || 'this screen'}
          </Text>
          <Text style={styles.screenErrorHint}>
            Pull down to refresh or try again later
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: VanshSpacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: VanshColors.masi[800],
    marginBottom: VanshSpacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: VanshColors.masi[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: VanshSpacing.xl,
  },
  errorDetails: {
    backgroundColor: VanshColors.sindoor[50],
    padding: VanshSpacing.md,
    borderRadius: VanshRadius.md,
    marginBottom: VanshSpacing.xl,
    width: '100%',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: VanshColors.sindoor[700],
    marginBottom: VanshSpacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: VanshColors.sindoor[600],
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: VanshColors.suvarna[500],
    paddingHorizontal: VanshSpacing.xl,
    paddingVertical: VanshSpacing.md,
    borderRadius: VanshRadius.full,
    shadowColor: VanshColors.suvarna[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  screenError: {
    flex: 1,
    backgroundColor: VanshColors.khadi[100],
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
  },
  screenErrorText: {
    fontSize: 18,
    fontWeight: '500',
    color: VanshColors.masi[700],
    marginTop: VanshSpacing.md,
    textAlign: 'center',
  },
  screenErrorHint: {
    fontSize: 14,
    color: VanshColors.masi[500],
    marginTop: VanshSpacing.sm,
    textAlign: 'center',
  },
});
