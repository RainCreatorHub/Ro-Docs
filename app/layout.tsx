import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider';
import { DocsLayout } from 'fumadocs-ui/layout';
import './globals.css';
import { pageTree } from './source';

export const metadata: Metadata = {
  title: 'Ro Docs',
  description: 'A modern documentation site for Roblox development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootProvider>
          <DocsLayout tree={pageTree}>{children}</DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
