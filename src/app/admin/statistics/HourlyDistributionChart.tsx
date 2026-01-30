'use client';

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';

interface HalfHourData {
  hour: number;
  minute: number;
  count: number;
}

interface HourlyDistributionChartProps {
  data: HalfHourData[];
}

export default function HourlyDistributionChart({ data }: HourlyDistributionChartProps) {
  const chartData = data.map((item) => {
    const hour12 = item.hour === 0 ? 12 : item.hour > 12 ? item.hour - 12 : item.hour;
    const ampm = item.hour < 12 ? 'AM' : 'PM';
    const minuteStr = item.minute === 0 ? '00' : '30';
    return {
      time: item.minute === 0 ? `${hour12} ${ampm}` : '',
      fullTime: `${hour12}:${minuteStr} ${ampm}`,
      count: item.count,
    };
  });

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 40 }}
        >
          <XAxis
            dataKey="time"
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }}
            angle={-90}
            textAnchor="end"
            height={80}
            interval={0}
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
                      {data.fullTime}
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
