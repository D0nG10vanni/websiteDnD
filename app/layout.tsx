"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Header from "../components/header";

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata removed because it is not supported in client components

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionContextProvider supabaseClient={supabaseClient}>
          <AuthProvider>
            <Header />
            <main>
              {children}
            </main>
          </AuthProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}
