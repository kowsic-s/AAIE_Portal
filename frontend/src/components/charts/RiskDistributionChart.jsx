import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RECHARTS_RISK_COLORS } from '../../utils/riskColors'

const RiskDistributionChart = ({ data = {} }) => {
  const chartData = [
    { name: 'Low', value: data.Low || 0 },
    { name: 'Medium', value: data.Medium || 0 },
    { name: 'High', value: data.High || 0 },
  ].filter((d) => d.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No prediction data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={RECHARTS_RISK_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [value, 'Students']}
          contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default RiskDistributionChart
