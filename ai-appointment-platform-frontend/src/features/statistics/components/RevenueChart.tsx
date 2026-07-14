import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign } from 'lucide-react';

interface RevenueChartProps {
  data: Array<{ mes: string; mesLabel: string; total: number }>;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-card-hover)',
  fontSize: '0.75rem',
};

const SUCCESS_COLOR = 'var(--color-success)';

export const RevenueChart = ({ data }: RevenueChartProps) => {
  return (
    <div className="card-modern p-5 md:p-6">
      <h2 className="text-lg font-bold text-txt mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-success" />
        Ingresos por Mes
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SUCCESS_COLOR} stopOpacity={0.3} />
              <stop offset="100%" stopColor={SUCCESS_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="mesLabel" stroke="var(--color-text-muted)" fontSize={12} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(v) => `Bs.${v}`} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`Bs. ${Number(value) || 0}`, 'Ingresos']}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={SUCCESS_COLOR}
            strokeWidth={2.5}
            dot={{ r: 5, fill: SUCCESS_COLOR, strokeWidth: 2, stroke: 'var(--color-surface)' }}
            activeDot={{ r: 7, stroke: SUCCESS_COLOR, strokeWidth: 2 }}
            name="Ingresos (Bs.)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
