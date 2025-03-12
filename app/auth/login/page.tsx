'use client';

import React from 'react';
import { LoginForm } from '@/components/login-form';
import { InvoiceQuote } from '@/components/invoice-quote';
import Image from 'next/image';
import { FacturaLogo } from '@/components/molecules/Navigation';
const LoginPage: React.FC = () => {
  return (
    <div className="flex h-screen">
      {/* Left Pane - Illustration (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-white text-black relative">
        {/* Logo positioned at the top */}

        {/* Full-size image that covers the entire left pane */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/factura-login.png"
            alt="Login illustration"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Overlay with the quote */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-black/30 backdrop-blur-sm">
          <InvoiceQuote />
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full p-6">
          <div className="flex items-center justify-center space-x-2 p-8 w-full">
            <FacturaLogo />
          </div>
          <LoginForm className="login-form" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
