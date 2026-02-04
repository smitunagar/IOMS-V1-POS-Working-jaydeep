
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/shared/components/ui/toaster";
import { AuthProvider } from '@/features/auth/AuthContext';
import { WasteWatchDogProvider } from '@/features/waste-watchdog/WasteWatchDogContext';
import { SupplySyncProvider } from '@/features/supply-sync/SupplySyncContext';

export const metadata: Metadata = {
  title: 'IOMS',
  description: 'A POS system for restaurants with AI-powered ingredient management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400&family=Open+Sans:wght@300;400;500;600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent ethereum object redefinition errors from browser extensions
              (function() {
                if (typeof window !== 'undefined') {
                  // Store the original defineProperty method
                  const originalDefineProperty = Object.defineProperty;
                  
                  // Override defineProperty to handle ethereum object conflicts
                  Object.defineProperty = function(obj, prop, descriptor) {
                    if (prop === 'ethereum' && obj === window && window.ethereum) {
                      // If ethereum already exists, merge the new properties instead of redefining
                      if (descriptor.value && typeof descriptor.value === 'object') {
                        try {
                          Object.assign(window.ethereum, descriptor.value);
                          return window.ethereum;
                        } catch (e) {
                          console.warn('Could not merge ethereum properties:', e);
                        }
                      }
                      return window.ethereum;
                    }
                    return originalDefineProperty.call(this, obj, prop, descriptor);
                  };
                  
                  // Add global error handler to catch extension-related errors
                  window.addEventListener('error', function(event) {
                    if (event.error && event.error.message && 
                        event.error.message.includes('Cannot redefine property: ethereum')) {
                      console.warn('Blocked ethereum redefinition error from browser extension');
                      event.preventDefault();
                      event.stopPropagation();
                      return false;
                    }
                  }, true);
                  
                  // Handle unhandled promise rejections from extensions
                  window.addEventListener('unhandledrejection', function(event) {
                    if (event.reason && event.reason.message && 
                        event.reason.message.includes('Cannot redefine property: ethereum')) {
                      console.warn('Blocked ethereum redefinition promise rejection from browser extension');
                      event.preventDefault();
                      return false;
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <WasteWatchDogProvider>
            <SupplySyncProvider>
              {children}
              <Toaster />
            </SupplySyncProvider>
          </WasteWatchDogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
