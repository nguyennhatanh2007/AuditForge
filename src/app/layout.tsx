import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Suspense, type ReactNode } from 'react';
import { RouteLoadingOverlay } from '@/components/layout/route-loading-overlay';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Audit Forge',
  description: 'Nền tảng kiểm tra sai lệch CMDB và quản lý ngoại lệ',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Suspense fallback={null}>
            <RouteLoadingOverlay />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
