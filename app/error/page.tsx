import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center text-red-600 mb-4">
            <AlertCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-red-700">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center text-red-600">
            An error occurred during authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-4">
            We apologize for the inconvenience. Please try again or contact support if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth" passHref>
            <Button variant="outline" className="w-full sm:w-auto">
              Return to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
