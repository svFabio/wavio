import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe, MapPin } from 'lucide-react';

interface OriginsChartProps {
  data: Array<{ name: string; value: number }>;
  total: number;
}

const ORIGEN_COLORS = ['var(--color-primary)', 'var(--color-warning)'];

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-card-hover)',
  fontSize: '0.75rem',
};

export const OriginsChart = ({ data, total }: OriginsChartProps) => {
  return (
    <div className="card-modern p-5 md:p-6">
      <h2 className="text-lg font-bold text-txt mb-2 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        Origen de Citas
      </h2>
      <p className="text-xs text-txt-muted mb-4">Este mes</p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-48 text-txt-muted text-sm">
          Sin datos este mes
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={ORIGEN_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {data.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ORIGEN_COLORS[i] }}
                />
                <span className="text-sm text-txt-secondary">
                  {entry.name === 'Virtual' ? (
                    <Globe className="w-3.5 h-3.5 inline mr-1" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  )}
                  {entry.name} <span className="font-bold text-txt">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
