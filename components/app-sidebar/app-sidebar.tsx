'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { FacturaLogo, CollapsedLogo } from '@/components/atoms/FacturaLogo';
import { useRouter } from 'next/navigation';

import { NavMain } from '@/components/app-sidebar/nav-main';
import { NavUser } from '@/components/app-sidebar/nav-user';
import { CircleHelpIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function AppSidebar() {
  const { state } = useSidebar();
  return (
    <aside
      className={cn(
        'h-screen w-60 border-r bg-background transition-all duration-300',
        state === 'collapsed' && 'w-[60px]'
      )}
    >
      <div className='flex h-full flex-col'>
        <div className='flex h-14 items-center border-b px-4'>
          <div className='flex items-center gap-2'>
            {state === 'collapsed' ? <CollapsedLogo /> : <FacturaLogo />}
          </div>
        </div>
        <div className='flex-1 overflow-y-auto py-2'>
          <NavMain />
        </div>
        <div className='flex items-center p-2'>
          <Button onClick={() => window.open('https://app.storylane.io/share/envmjzgsqlgi', '_blank')} size='sm' className='w-full rounded-ld border bg-transparent border-purple-400 hover:bg-purple-600 text-foreground hover:text-white font-semibold'>

            ¿Como funciona?
            <ExternalLinkIcon className='w-4 h-4 ml-2' />
          </Button>
        </div>
        <div className='border-t py-4'>

          <NavUser />
        </div>
      </div>
    </aside>
  );
}
