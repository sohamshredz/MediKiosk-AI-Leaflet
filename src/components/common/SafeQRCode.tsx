import React, { Component, ErrorInfo, ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ExternalLink } from 'lucide-react';

interface SafeQRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
  fallbackLabel?: string;
}

interface ErrorBoundaryProps {
  fallbackUrl: string;
  fallbackLabel?: string;
  size?: number;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class InnerQRErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('SafeQRCode prevented QR rendering error:', error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ width: this.props.size || 120, height: this.props.size || 120 }}
          className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-600 space-y-1.5"
        >
          <QrCode className="w-8 h-8 text-teal-600" />
          <span className="text-[10px] font-bold text-slate-700 leading-tight">
            {this.props.fallbackLabel || 'Mobile Token Link'}
          </span>
          {this.props.fallbackUrl && (
            <a
              href={this.props.fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-teal-700 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Open Link</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Trims oversized URLs to prevent QRCode capacity errors ("Data too long").
 */
function sanitizeQRValue(raw: string): { safeValue: string; effectiveLevel: 'L' | 'M' | 'Q' | 'H' } {
  if (!raw) return { safeValue: 'https://hospital.gov.in', effectiveLevel: 'L' };

  let trimmed = raw;

  // If URL has heavy payload query params that exceed QR capacity, strip them down to basic IDs
  if (trimmed.length > 600 && trimmed.startsWith('http')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.searchParams.has('data')) {
        parsed.searchParams.delete('data');
      }
      trimmed = parsed.toString();
    } catch {
      // If parsing fails, hard truncate safely
      trimmed = trimmed.substring(0, 500);
    }
  }

  // Choose appropriate error correction level based on length
  // Level L has maximum data capacity; Level M is default
  const effectiveLevel: 'L' | 'M' | 'Q' | 'H' = trimmed.length > 300 ? 'L' : 'M';

  return { safeValue: trimmed, effectiveLevel };
}

export const SafeQRCode: React.FC<SafeQRCodeProps> = ({
  value,
  size = 120,
  level,
  includeMargin = false,
  className = '',
  fallbackLabel
}) => {
  const { safeValue, effectiveLevel } = sanitizeQRValue(value);

  return (
    <InnerQRErrorBoundary fallbackUrl={safeValue} fallbackLabel={fallbackLabel} size={size}>
      <QRCodeSVG
        value={safeValue}
        size={size}
        level={level || effectiveLevel}
        includeMargin={includeMargin}
        className={className}
      />
    </InnerQRErrorBoundary>
  );
};
