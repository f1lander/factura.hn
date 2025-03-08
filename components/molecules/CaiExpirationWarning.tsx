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
    daysUntilExpiration <= 7
      ? 'destructive'
      : daysUntilExpiration <= 15
      ? 'warning'
      : 'default';

  return (
    <Alert variant={severity}>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>CAI próximo a vencer</AlertTitle>
      <AlertDescription>
        Su CAI actual vencerá en {daysUntilExpiration} días.
        {daysUntilExpiration <= 7
          ? ' ¡Actualice su CAI inmediatamente!'
          : ' Por favor, gestione un nuevo CAI pronto.'}
      </AlertDescription>
    </Alert>
  );
}
