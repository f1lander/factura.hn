'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import {
  FileText,
  Users,
  Package,
  Settings,
  Home,
  Receipt,
} from 'lucide-react';

const items = [
  {
    title: 'Dashboard',
    href: '/home',
    icon: Home,
  },
  {
    title: 'Facturas',
    href: '/home/invoices',
    icon: Receipt,
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
  // {
  //   title: "Reportes",
  //   href: "/home/reports",
  //   icon: FileText,
  // },
  {
    title: 'Configuración',
    href: '/home/settings',
    icon: Settings,
  },
];

export function NavMain() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <nav className='space-y-1 px-2'>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-facturaBlue text-white'
                : 'hover:bg-muted',
              state === 'collapsed' && 'justify-center'
            )}
          >
            <Icon className='h-4 w-4' />
            {state !== 'collapsed' && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
