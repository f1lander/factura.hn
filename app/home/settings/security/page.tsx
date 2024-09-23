import { createClient } from '@/lib/supabase/server';
import SecurityContent from '@/components/molecules/SecurityContent';
import { Suspense } from 'react';

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isResettingPassword =
    searchParams.access_token &&
    searchParams.type === 'recovery';

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecurityContent
        user={user}
        isResettingPassword={!!isResettingPassword}
      />
    </Suspense>
  );
}
