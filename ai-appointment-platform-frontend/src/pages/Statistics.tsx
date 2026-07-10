import { useEffect, useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, Clock, DollarSign, Globe, MapPin } from 'lucide-react';

interface OverviewData {
    citasMes: number;
    ingresosMes: number;
    topClientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
    horariosPopulares: Array<{ horario: string; totalReservas: number }>;
    citasVirtuales: number;
    citasPresenciales: number;
    ratingPromedio?: number;
}

interface RevenueData {
    revenue: Array<{ mes: string; total: number }>;
}

const MONTH_NAMES: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

const Statistics = () => {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [overviewRes, revenueRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/statistics/overview`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/statistics/revenue?months=6`, { headers })
            ]);

            const overviewData = await overviewRes.json();
            const revenueData = await revenueRes.json();

            setOverview(overviewData);
            setRevenue(revenueData);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="skeleton h-10 w-48 rounded-theme-md" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-theme-lg" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="skeleton h-80 rounded-theme-lg" />
                    <div className="skeleton h-80 rounded-theme-lg" />
                </div>
                <div className="skeleton h-64 rounded-theme-lg" />
            </div>
        );
    }

    // Format revenue months
    const revenueFormatted = (revenue?.revenue || []).map(item => ({
        ...item,
        mesLabel: MONTH_NAMES[item.mes.split('-')[1]] || item.mes
    }));

    // Pie data for virtual vs presencial
    const origenData = [
        { name: 'Virtual', value: overview?.citasVirtuales || 0 },
        { name: 'Presencial', value: overview?.citasPresenciales || 0 }
    ];
    const totalOrigen = origenData.reduce((s, d) => s + d.value, 0);
    const ORIGEN_COLORS = ['#6366f1', '#f59e0b'];

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6366f1';
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#10b981';

    const statCards = [
        { label: 'Citas Este Mes', value: overview?.citasMes || 0, icon: TrendingUp, gradient: 'from-primary to-secondary' },
        { label: 'Ingresos del Mes', value: `Bs. ${overview?.ingresosMes || 0}`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500' },
        { label: 'Clientes Frecuentes', value: overview?.topClientes.length || 0, icon: Users, gradient: 'from-violet-500 to-purple-500' },
        { label: 'Horarios Activos', value: overview?.horariosPopulares.length || 0, icon: Clock, gradient: 'from-amber-500 to-orange-500' },
    ];

    const tooltipStyle = {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card-hover)',
        fontSize: 13,
    };

    // Medal styling for top clients
    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-txt">Estadísticas</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-txt-secondary">{stat.label}</p>
                                <p className="text-2xl font-bold text-txt mt-2">{stat.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Chart + Virtual/Presencial Pie — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart (2/3 width) */}
                <div className="card-modern p-5 md:p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-txt mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Ingresos por Mes
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={revenueFormatted}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={successColor} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={successColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="mesLabel" stroke="var(--color-text-muted)" fontSize={12} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(v) => `Bs.${v}`} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [`Bs. ${value ?? 0}`, 'Ingresos']} />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke={successColor}
                                strokeWidth={2.5}
                                dot={{ r: 5, fill: successColor, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 7, stroke: successColor, strokeWidth: 2 }}
                                name="Ingresos (Bs.)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Virtual vs Presencial Pie (1/3 width) */}
                <div className="card-modern p-5 md:p-6">
                    <h2 className="text-lg font-bold text-txt mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Origen de Citas
                    </h2>
                    <p className="text-xs text-txt-muted mb-4">Este mes</p>

                    {totalOrigen === 0 ? (
                        <div className="flex items-center justify-center h-48 text-txt-muted text-sm">
                            Sin datos este mes
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={origenData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {origenData.map((_, index) => (
                                            <Cell key={index} fill={ORIGEN_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="flex justify-center gap-6 mt-2">
                                {origenData.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ORIGEN_COLORS[i] }} />
                                        <span className="text-sm text-txt-secondary">
                                            {entry.name === 'Virtual' ? <Globe className="w-3.5 h-3.5 inline mr-1" /> : <MapPin className="w-3.5 h-3.5 inline mr-1" />}
                                            {entry.name} <span className="font-bold text-txt">{entry.value}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Horarios + Clientes Frecuentes — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Hours Chart */}
                <div className="card-modern p-5 md:p-6">
                    <h2 className="text-lg font-bold text-txt mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Horarios Más Reservados
                    </h2>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={overview?.horariosPopulares || []} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="horario" stroke="var(--color-text-muted)" fontSize={12} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="totalReservas" fill={primaryColor} radius={[8, 8, 0, 0]} name="Reservas">
                                {(overview?.horariosPopulares || []).map((_, index) => (
                                    <Cell key={index} fill={index === 0 ? primaryColor : `${primaryColor}99`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Clients — card style instead of table */}
                <div className="card-modern p-5 md:p-6">
                    <h2 className="text-lg font-bold text-txt mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-500" />
                        Clientes Más Frecuentes
                    </h2>
                    <div className="space-y-3">
                        {(overview?.topClientes || []).length === 0 ? (
                            <p className="text-txt-muted text-sm text-center py-8">Sin datos aún</p>
                        ) : (
                            overview?.topClientes.map((cliente, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50 hover:bg-surface-alt/50 transition-colors">
                                    <span className="text-xl w-8 text-center">{getMedal(index)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-txt truncate capitalize">{cliente.nombre}</p>
                                        <p className="text-xs text-txt-muted truncate">{cliente.telefono}</p>
                                    </div>
                                    <span className="badge badge-primary font-bold text-sm px-3">{cliente.totalCitas} citas</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
