import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const AttendanceChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No attendance data available
      </div>
    )
  }

  const chartData = data.map((r) => ({
    semester: r.semester,
    attendance: parseFloat(r.attendance_pct?.toFixed(1)),
  }))

  const getBarColor = (value) => {
    if (value >= 85) return '#16a34a'
    if (value >= 70) return '#d97706'
    return '#dc2626'
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Attendance']}
          contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          cursor={{ fill: 'rgba(59,130,246,0.06)' }}
        />
        <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '75% min', position: 'right', fontSize: 10 }} />
        <Bar
          dataKey="attendance"
          radius={[4, 4, 0, 0]}
          fill="#3b82f6"
          label={{ position: 'top', fontSize: 11, formatter: (v) => `${v}%` }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default AttendanceChart
