import Link from 'next/link';
import { TRPCProvider } from '../trpc/Provider';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'

import './globals.css'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import ChatSidebar from './_components/chat-sidebar';
import { ThemeProvider } from './_components/theme-provider';
import { Header } from './_components/header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <TRPCProvider>
        <html lang="en">
          <body>
            <ThemeProvider>
              <SidebarProvider>
                <SidebarInset>
                  <Header />
                  <main className="flex flex-1">
                    {children}
                  </main>
                </SidebarInset>
                <ChatSidebar />
              </SidebarProvider>
            </ThemeProvider>
          </body>
        </html>

      </TRPCProvider>
    </ClerkProvider>
  );
}
