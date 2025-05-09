"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import React, { useState } from 'react';
import { Terminal } from '../components/Terminal';
import type { User as SupabaseUser } from '@supabase/auth-js'; // Import SupabaseUser

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout() {
  const [user, setUser] = useState<SupabaseUser | null>(null); // Ensure user state is correctly typed
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#18181b', minHeight: '100vh' }}>
        <Terminal user={user} onAuthChange={setUser} />
      </body>
    </html>
  );
}
