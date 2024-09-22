import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, LabelList, XAxis, YAxis } from 'recharts';
import { Invoice } from '@/lib/supabase/services/invoice';

interface MonthlyGoalProgressWidgetProps {
  invoices: Invoice[];
  monthlyGoal: number;
}

const MonthlyGoalProgressWidget: React.FC<MonthlyGoalProgressWidgetProps> = ({ invoices, monthlyGoal }) => {
  const { currentTotal, lastYearTotal } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let currentYearTotal = 0;
    let lastYearTotal = 0;

    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      if (invoiceDate.getFullYear() === currentYear && invoiceDate.getMonth() === currentMonth) {
        currentYearTotal += invoice.total;
      } else if (invoiceDate.getFullYear() === currentYear - 1 && invoiceDate.getMonth() === currentMonth) {
        lastYearTotal += invoice.total;
      }
    });

    return { currentTotal: currentYearTotal, lastYearTotal };
  }, [invoices]);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const data = [
    {
      year: currentYear.toString(),
      total: currentTotal,
    },
    {
      year: lastYear.toString(),
      total: lastYearTotal,
    },
  ];

  const formatCurrency = (value: number) => 
    `L. ${value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const progressPercentage = (currentTotal / monthlyGoal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso Mensual</CardTitle>
        <CardDescription>
          {progressPercentage >= 100 
            ? "¡Felicidades! Has alcanzado tu meta mensual."
            : `Estás al ${progressPercentage.toFixed(1)}% de tu meta mensual.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid auto-rows-min gap-2">
          <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
            {formatCurrency(currentTotal)}
            <span className="text-sm font-normal text-muted-foreground">
              facturado
            </span>
          </div>
          <div className="aspect-auto h-[32px] w-full">
            <BarChart
              layout="vertical"
              width={300}
              height={32}
              data={[data[0]]}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Bar
                dataKey="total"
                fill="var(--color-steps)"
                radius={4}
                barSize={32}
              >
                <LabelList
                  position="insideLeft"
                  dataKey="year"
                  offset={8}
                  fontSize={12}
                  fill="white"
                />
              </Bar>
              <YAxis dataKey="year" type="category" hide />
              <XAxis type="number" hide domain={[0, Math.max(monthlyGoal, currentTotal)]} />
            </BarChart>
          </div>
        </div>
        <div className="grid auto-rows-min gap-2">
          <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
            {formatCurrency(monthlyGoal)}
            <span className="text-sm font-normal text-muted-foreground">
              meta
            </span>
          </div>
          <div className="aspect-auto h-[32px] w-full">
            <BarChart
              layout="vertical"
              width={300}
              height={32}
              data={[{ year: 'Meta', total: monthlyGoal }]}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Bar
                dataKey="total"
                fill="var(--color-steps)"
                radius={4}
                barSize={32}
                fillOpacity={0.3}
              >
                <LabelList
                  position="insideLeft"
                  dataKey="year"
                  offset={8}
                  fontSize={12}
                  fill="hsl(var(--muted-foreground))"
                />
              </Bar>
              <YAxis dataKey="year" type="category" hide />
              <XAxis type="number" hide domain={[0, Math.max(monthlyGoal, currentTotal)]} />
            </BarChart>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyGoalProgressWidget;