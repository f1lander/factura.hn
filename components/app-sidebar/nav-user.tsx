'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import supabaseClient from '@/lib/supabase/client';

export function NavUser({ className = '', triggerClassName = '' }) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [user, setUser] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const supabase = supabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  // Determine display name
  let displayName = 'Usuario';
  if (user) {
    if (user.user_metadata?.full_name) {
      displayName = user.user_metadata.full_name;
    } else if (user.email) {
      displayName = user.email;
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    const supabase = supabaseClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <div className={cn('p-4', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
              state === 'collapsed' && 'justify-center',
              triggerClassName
            )}
          >
            <Avatar className='h-8 w-8'>
              {user?.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} alt='User' />
              ) : (
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            {state !== 'collapsed' && (
              <span className='truncate max-w-[140px]'>
                {isLoading ? 'Cargando...' : displayName}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-56'>
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href='/home/settings' className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              <span>Configuración</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className='flex items-center gap-2 text-red-600'
          >
            <LogOut className='h-4 w-4' />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
