'use client';

import { useEffect, useState } from 'react';
import '../globals.css';
import { AppSidebar } from '@/components/app-sidebar/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Receipt,
  Users,
  Package,
  Settings,
  BarChart4,
  FilePlus,
  FileEdit,
  PlusIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { NavUser } from '@/components/app-sidebar/nav-user';
import { Button } from '@/components/ui/button';

// Enhanced function to get page title and corresponding icon
const getPageInfo = (pathname: string) => {
  switch (pathname) {
    case '/home':
      return { title: 'Dashboard', icon: Home };
    case '/home/invoices':
      return { title: 'Facturas', icon: Receipt };
    case '/home/invoices/create-invoice':
      return { title: 'Nueva Factura', icon: FilePlus };
    case '/home/invoices/edit-invoice':
      return { title: 'Editar Factura', icon: FileEdit };
    case '/home/customers':
      return { title: 'Clientes', icon: Users };
    case '/home/products-v2':
      return { title: 'Productos', icon: Package };
    case '/home/reports':
      return { title: 'Reportes', icon: BarChart4 };
    case '/home/settings':
      return { title: 'Configuración', icon: Settings };
    default:
      return { title: 'Dashboard', icon: Home };
  }
};

// Navigation items used in both sidebar and bottom bar
const navItems = [
  {
    title: 'Dashboard',
    href: '/home',
    icon: Home,
  },
  {
    title: 'Facturas',
    href: '/home/invoices',
    icon: FilePlus,
  },
  {
    title: 'Clientes',
    href: '/home/customers',
    icon: Users,
  },
  {
    title: 'Productos',
    href: '/home/products-v2',
    icon: Package,
  },
  {
    title: 'Configuración',
    href: '/home/settings',
    icon: Settings,
  },
];

// Mobile bottom navigation items (first 2 items, then plus button, then last 2 items)
const mobileNavItems = [
  ...navItems.slice(0, 2), // First 2 items
  {
    title: 'Crear',
    href: '/home/invoices/create-invoice',
    icon: () => <span></span>,
  }, // Empty icon component
  ...navItems.slice(2, 4), // Last 2 items (excluding Settings)
];

// Mobile bottom navigation component
function MobileBottomNav() {
  const pathname = usePathname();
  const isCreateInvoicePage = pathname === '/home/invoices/create-invoice';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For form validation
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  // Effect to poll the form state when on the create invoice page
  useEffect(() => {
    if (!isCreateInvoicePage) return;

    // Function to check the submit button state
    const checkButtonState = () => {
      try {
        const submitButton = document.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement;
        if (submitButton) {
          setIsButtonDisabled(submitButton.disabled);
        }
      } catch (error) {
        console.error('Error checking button state:', error);
      }
    };

    // Initial check
    checkButtonState();

    // Set up interval to poll the button state (necessary since we can't directly access React state)
    const intervalId = setInterval(checkButtonState, 500);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [isCreateInvoicePage]);

  return (
    <div className='fixed bottom-0 left-0 z-40 w-full h-16 bg-background border-t md:hidden'>
      <div className='grid h-full grid-cols-5 mx-auto relative'>
        {mobileNavItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Center button (plus for creating, check for saving)
          if (index === 2) {
            // If on the create invoice page, show a check button that submits the form
            if (isCreateInvoicePage) {
              return (
                <button
                  key='save-invoice'
                  onClick={() => {
                    if (isButtonDisabled) return;

                    try {
                      setIsSubmitting(true);
                      // Find and click the save button in the form
                      const saveButton = document.querySelector(
                        'button[type="submit"]'
                      ) as HTMLButtonElement;
                      if (saveButton) {
                        saveButton.click();

                        // Start watching for either a success indication (dialog appears) or error
                        const checkForDialogOrError = () => {
                          const dialog =
                            document.querySelector('[role="dialog"]');
                          const errorAlert =
                            document.querySelector('[data-error-alert]');

                          if (dialog) {
                            // Success - dialog appeared
                            setIsSubmitting(false);
                            return true;
                          } else if (errorAlert) {
                            // Error appeared
                            setIsSubmitting(false);
                            return true;
                          }

                          return false;
                        };

                        // Check every 300ms for dialog or error
                        const checkInterval = setInterval(() => {
                          if (checkForDialogOrError()) {
                            clearInterval(checkInterval);
                          }
                        }, 300);

                        // Safety timeout after 8 seconds
                        setTimeout(() => {
                          clearInterval(checkInterval);
                          setIsSubmitting(false);
                        }, 8000);
                      } else {
                        // Button not found
                        setIsSubmitting(false);
                      }
                    } catch (error) {
                      console.error('Error submitting form:', error);
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isButtonDisabled || isSubmitting}
                  className='flex flex-col items-center justify-center'
                >
                  <div
                    className={`absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg ${isButtonDisabled || isSubmitting
                      ? 'bg-gray-400'
                      : 'bg-green-600'
                      } text-white`}
                  >
                    {isSubmitting ? (
                      <svg
                        className='animate-spin h-5 w-5'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='3'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='lucide lucide-check'
                      >
                        <polyline points='20 6 9 17 4 12'></polyline>
                      </svg>
                    )}
                  </div>
                  <span className='text-xs mt-6 text-muted-foreground'>
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </span>
                </button>
              );
            }

            // Otherwise, show the create button as normal
            return (
              <Link
                key={item.href}
                href={item.href}
                className='flex flex-col items-center justify-center'
              >
                <div className='absolute -top-6 flex items-center justify-center w-14 h-14 bg-facturaBlue text-primary-foreground rounded-full shadow-lg'>
                  <span className='text-2xl font-bold'>+</span>
                </div>
                <span className='text-xs mt-6 text-muted-foreground'>
                  {item.title}
                </span>
              </Link>
            );
          }

          // Regular navigation items
          return (
            <Link
              key={item.href}
              href={item.href}
              className='flex flex-col items-center justify-center px-1'
            >
              <Icon
                className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              />
              <span
                className={`text-xs ${isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
                  }`}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper component to handle mobile logic
function MainContent({
  children,
  pageTitle,
  pageIcon: PageIcon,
}: {
  children: React.ReactNode;
  pageTitle: string;
  pageIcon: React.ElementType;
}) {
  const pathname = usePathname();
  const { isMobile, setOpen, toggleSidebar } = useSidebar();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  return (
    <>
      {/* Only show sidebar on desktop */}
      <div className='hidden md:block'>
        <AppSidebar />
      </div>

      <SidebarInset className='flex w-full flex-col overflow-hidden'>
        <header className='flex h-[56px] shrink-0 items-center justify-between gap-4 border-b px-4'>
          {/* Only show sidebar trigger on desktop */}
          <div className='flex flex-row gap-4 w-full items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div id='left-items' className='hidden md:block'>
                <SidebarTrigger
                  className='-ml-1'
                  onClick={() => toggleSidebar()}
                />
              </div>
              <div className='flex items-center gap-2'>
                <PageIcon className='block md:hidden h-5 w-5 text-primary' aria-hidden='true' />
                <h1 className='text-lg font-semibold'>{pageTitle}</h1>
              </div>
            </div>
            {pathname !== '/home/invoices/create-invoice' && (
              <Link
                key='/home/invoices/create-invoice'
                href='/home/invoices/create-invoice'
                className='hidden md:flex items-center gap-2 px-4 py-2 border-2 border-facturaBlue text-foreground rounded-md shadow-lg'
              >
                <PlusIcon className="h-4 w-4" />
                <span className='text-sm'>Crear Factura</span>
              </Link>
            )}
          </div>
          <div className='flex items-center md:hidden'>
            <Button onClick={() => window.open('https://app.storylane.io/share/envmjzgsqlgi', '_blank')} size='sm' className='w-full rounded-ld border bg-transparent border-purple-400 hover:bg-purple-600 text-foreground hover:text-white font-semibold'>
              Ayuda
              <ExternalLinkIcon className='w-4 h-4 ml-2' />
            </Button>
          </div>
          <div id='right-items' className='md:hidden'>
            <NavUser className='p-0' triggerClassName='pr-0' />
          </div>
        </header>

        {/* Adjust padding bottom on mobile to accommodate the bottom nav */}
        <div
          className={`flex-1 w-full overflow-y-auto ${isMobile ? 'pb-24 p-1' : ''
            }`}
        >
          {children}
        </div>

        {/* Mobile bottom navigation */}
        {isMobile && <MobileBottomNav />}
      </SidebarInset>
    </>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { title, icon } = getPageInfo(pathname);

  return (
    <SidebarProvider defaultOpen>
      <div className='flex h-screen w-full overflow-hidden'>
        <MainContent pageTitle={title} pageIcon={icon}>
          {children}
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
