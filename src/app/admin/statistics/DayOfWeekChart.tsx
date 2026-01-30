'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, TooltipProps } from 'recharts';

interface DayOfWeekData {
  day: string;
  count: number;
}

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  // Filter to only weekdays and sort by day order
  const chartData = DAY_ORDER.map(day => {
    const dayData = data.find(d => d.day === day);
    return {
      day: day.substring(0, 3), // Short form: Mon, Tue, etc.
      fullDay: day,
      count: dayData?.count || 0
    };
  });

  return (
    <div style={{ height: '250px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }}
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
                    minWidth: '150px'
                  }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                      {data.fullDay}
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
            fill="#32A5DC"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
