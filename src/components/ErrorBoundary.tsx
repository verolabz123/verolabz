import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to error tracking service
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // In production, send to error tracking
        if (import.meta.env.PROD) {
            // TODO: Send to Sentry or similar service
        }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>

                        <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
                            Oops! Something went wrong
                        </h1>

                        <p className="mt-2 text-sm text-center text-gray-600">
                            We encountered an unexpected error. Please try again.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono overflow-auto max-h-32">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
