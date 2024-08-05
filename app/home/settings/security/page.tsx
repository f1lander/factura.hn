// app/security/page.tsx
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import SecurityContent from '@/components/molecules/SecurityContent';

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(searchParams)
  const isResettingPassword =
    searchParams.access_token &&
    searchParams.type === 'recovery';

  return (
    <SecurityContent
      user={user}
      isResettingPassword={!!isResettingPassword}
    />
  );
}
