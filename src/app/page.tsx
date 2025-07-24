"use client";
import React from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import all client components with SSR disabled
const Home = dynamic(() => import('./home'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" /> 
    </div>
  ),
});

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    }>
      <Home />
    </Suspense>
  );
}
