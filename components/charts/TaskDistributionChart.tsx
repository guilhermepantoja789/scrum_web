// Local: components/charts/TaskDistributionChart.tsx

"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

type ChartData = {
    name: string;
    value: number;
}

type Props = {
    statusData: ChartData[];
    priorityData: ChartData[];
}

// Cores para os gráficos
const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']; // Azul, Laranja, Verde, Vermelho
const PRIORITY_COLORS = ['#64748b', '#a855f7', '#f43f5e', '#facc15']; // Cinza, Roxo, Rosa, Amarelo

export function TaskDistributionChart({ statusData, priorityData }: Props) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                {/* Gráfico de Status (externo) */}
                <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                            <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                >
                    {statusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                </Pie>

                {/* Gráfico de Prioridade (interno) */}
                <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    fill="#82ca9d"
                >
                    {priorityData.map((entry, index) => (
                        <Cell key={`cell-priority-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                    ))}
                </Pie>

                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}