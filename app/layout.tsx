"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Header from "../components/header";

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [supabaseClient] = useState(() =>
  createPagesBrowserClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options: {
      // You can add valid options here if needed
    },
  })
);

  return (
    <html lang="en" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionContextProvider supabaseClient={supabaseClient}>
          <AuthProvider>
            <Header />
            {/* HIER DIE ÄNDERUNG:
                pt-16 (64px) = Exakte Höhe des Headers
                min-h-screen = Damit der Footer (falls später einer kommt) unten bleibt
            */}
            <main className="pt-16 min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}