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
            <header className="flex justify-end items-center p-4 gap-4 h-16">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <Link href="/">Home</Link>
                <UserButton />
              </SignedIn>
            </header>
            {children}
          </body>
        </html>
      </TRPCProvider>
    </ClerkProvider>
  );
}
