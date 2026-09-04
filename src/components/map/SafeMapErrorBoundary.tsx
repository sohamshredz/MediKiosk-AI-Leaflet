import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Layers } from 'lucide-react';

interface SafeMapErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onFallback?: (error: Error) => void;
}

interface SafeMapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SafeMapErrorBoundary extends Component<SafeMapErrorBoundaryProps, SafeMapErrorBoundaryState> {
  constructor(props: SafeMapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): SafeMapErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Map runtime notice caught by SafeMapErrorBoundary:', error?.message || error, errorInfo);
    if (this.props.onFallback) {
      this.props.onFallback(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full">
          {this.props.fallback}
        </div>
      );
    }

    return this.props.children;
  }
}
