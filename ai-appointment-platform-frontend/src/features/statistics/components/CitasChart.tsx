import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Clock } from 'lucide-react';

interface CitasChartProps {
  horarios: Array<{ horario: string; totalReservas: number }>;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-card-hover)',
  fontSize: '0.75rem',
};

const PRIMARY_COLOR = 'var(--color-primary)';

export const CitasChart = ({ horarios }: CitasChartProps) => {
  return (
    <div className="card-modern p-5 md:p-6">
      <h2 className="text-lg font-bold text-txt mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-warning" />
        Horarios Mas Reservados
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={horarios} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="horario" stroke="var(--color-text-muted)" fontSize={12} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="totalReservas" fill={PRIMARY_COLOR} radius={[8, 8, 0, 0]} name="Reservas">
            {horarios.map((_, index) => (
              <Cell key={index} fill={index === 0 ? PRIMARY_COLOR : `${PRIMARY_COLOR}99`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
