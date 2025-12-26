import { ReactNode } from 'react';

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Root Layout Component
 * Wraps all pages with common layout elements
 */
export function RootLayout({ children }: RootLayoutProps) {
  return <div className="font-sans antialiased">{children}</div>;
}

