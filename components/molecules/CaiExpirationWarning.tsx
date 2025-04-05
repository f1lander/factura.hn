// 'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { sarCaiService } from '@/lib/supabase/services/sar_cai';
import { useCompanyStore } from '@/store/companyStore';
import { differenceInCalendarDays } from 'date-fns';

export default function CaiExpirationWarning() {
  const { company } = useCompanyStore();
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(
    null
  );

  const { data: sarCaiData } = useQuery({
    queryKey: ['sar_cai', company?.id],
    queryFn: () => sarCaiService.getActiveSarCaiByCompanyId(company?.id || ''),
    refetchOnMount: true,
    enabled: !!company?.id,
  });

  useEffect(() => {
    if (sarCaiData?.limit_date) {
      const limitDate = new Date(sarCaiData.limit_date);
      const today = new Date();
      const diffDays = differenceInCalendarDays(limitDate, today);
      setDaysUntilExpiration(diffDays);
    }
  }, [sarCaiData]);

  if (!daysUntilExpiration || daysUntilExpiration > 30) {
    return null;
  }

  const severity =
    daysUntilExpiration <= 1
      ? 'default'
      : daysUntilExpiration <= 7
      ? 'destructive'
      : daysUntilExpiration <= 15
      ? 'warning'
      : 'default';

  const title = daysUntilExpiration <= 1 ? 'CAI Vencido' : 'CAI Vence pronto';
  const message =
    daysUntilExpiration <= 1
      ? 'Su CAI está vencido. Por favor, actualice su CAI.'
      : daysUntilExpiration <= 30
      ? `Su CAI actual vencerá en ${daysUntilExpiration} días.`
      : '';

  return (
    <Alert
      variant={severity}
      className={daysUntilExpiration < 1 ? 'bg-destructive text-white' : ''}
    >
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {/* Su CAI actual vencerá en {daysUntilExpiration} días. */}
        {message}
        {daysUntilExpiration <= 7
          ? ' ¡Actualice su CAI inmediatamente!'
          : ' Por favor, gestione un nuevo CAI pronto.'}
      </AlertDescription>
    </Alert>
  );
}
