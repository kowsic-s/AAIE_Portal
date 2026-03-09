import { useQuery } from '@tanstack/react-query'
import { getPerformanceHistory } from '../../api/student'
import GpaTrendChart from '../../components/charts/GpaTrendChart'
import AttendanceChart from '../../components/charts/AttendanceChart'
import DataTable from '../../components/DataTable'
import { formatDate } from '../../utils/formatters'

const COLUMNS = [
  { key: 'semester', label: 'Semester' },
  { key: 'gpa', label: 'GPA', render: (v) => Number(v).toFixed(2) },
  { key: 'attendance_pct', label: 'Attendance %', render: (v) => `${Number(v).toFixed(1)}%` },
  { key: 'reward_points', label: 'Reward Pts' },
  { key: 'activity_points', label: 'Activity Pts' },
  { key: 'recorded_at', label: 'Recorded', render: (v) => formatDate(v) },
]

const StudentPerformance = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-performance'],
    queryFn: getPerformanceHistory,
    staleTime: 5 * 60 * 1000,
  })

  const records = data?.data?.records ?? []

  if (isError) return <div className="text-[#ef4444] p-6">Failed to load performance data.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Performance History</h1>
        <p className="text-[#94a3b8] mt-1">Your academic performance across semesters</p>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 gap-6">
            <div className="h-56 bg-white/[0.08] rounded-xl" />
            <div className="h-56 bg-white/[0.08] rounded-xl" />
          </div>
          <div className="h-64 bg-white/[0.08] rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-[#f0f4ff] mb-4">GPA Trend</h2>
              <GpaTrendChart data={records} />
            </div>
            <div className="card">
              <h2 className="font-semibold text-[#f0f4ff] mb-4">Attendance Trend</h2>
              <AttendanceChart data={records} />
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-[#f0f4ff] mb-4">Detailed Records</h2>
            <DataTable columns={COLUMNS} data={records} pageSize={10} />
          </div>
        </>
      )}
    </div>
  )
}

export default StudentPerformance
