'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { getDashboardStats } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', 30],
    queryFn: () => getDashboardStats(30),
  });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          Σφάλμα φόρτωσης: {error instanceof Error ? error.message : 'Άγνωστο'}
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Φόρτωση στατιστικών...</div>
      </div>
    );
  }

  const chartData = data.leadsPerDay.map((d) => ({
    date: new Date(d.date).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
    }),
    leads: d.count,
    fullDate: d.date,
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={data.totalLeads}
          icon={Users}
        />
        <StatCard
          title="Conversion Rate"
          value={`${data.conversionRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="AI Cost"
          value={`$${data.aiCost.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Active Builds"
          value={data.activeBuilds}
          icon={Zap}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Νέα Leads ανά ημέρα</h2>
        <div className="h-[320px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullDate
                      ? new Date(payload[0].payload.fullDate).toLocaleDateString('el-GR')
                      : ''
                  }
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Δεν υπάρχουν δεδομένα για τις τελευταίες 30 ημέρες
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
