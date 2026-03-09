import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const GpaTrendChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No performance data available
      </div>
    )
  }

  const chartData = data.map((r) => ({
    semester: r.semester,
    gpa: parseFloat(r.gpa?.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [value, 'GPA']}
          contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          cursor={{ stroke: 'rgba(59,130,246,0.3)' }}
        />
        <ReferenceLine y={6} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Floor', position: 'right', fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="gpa"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default GpaTrendChart
