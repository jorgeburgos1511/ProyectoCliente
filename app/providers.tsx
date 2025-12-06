"use client";

import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import NavbarPublic from "@/components/layout/NavbarPublic";
import { Toaster } from "@/components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthProvider>
          <NavbarPublic />
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
