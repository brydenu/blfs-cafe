'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, TooltipProps } from 'recharts';

interface DailyData {
  date: string;
  count: number;
}

interface DailyDistributionChartProps {
  data: DailyData[];
  timeframe: string;
}

// Helper to get current date in Pacific Time (client-side)
function getPacificDateString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

export default function DailyDistributionChart({ data, timeframe }: DailyDistributionChartProps) {
  const pacificToday = getPacificDateString();
  
  const chartData = data.map((item) => {
    const date = new Date(item.date);
    const isToday = item.date === pacificToday;
    return {
      date: isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      count: item.count,
      isToday
    };
  });

  return (
    <div style={{ height: '250px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 5, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    minWidth: '200px'
                  }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                      {data.fullDate}
                    </div>
                    <div style={{ color: '#fff' }}>
                      {data.count} order{data.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ fill: 'transparent' }}
          />
          <Bar
            dataKey="count"
            fill="#4B5563"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isToday ? '#32A5DC' : '#4B5563'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
