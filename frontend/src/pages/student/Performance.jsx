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
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-performance'],
    queryFn: getPerformanceHistory,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const records = data?.data?.performance_history ?? []
  if (isError) return <div className="p-6" style={{ color: 'var(--risk-high)' }}>Failed to load performance data.</div>

  return (
    <div className="student-page">
      <div className="flex justify-end"><button className="btn-secondary" onClick={() => refetch()}>Refresh</button></div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="student-shell h-56" /><div className="student-shell h-56" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="student-shell">
              <div className="student-shell-accent" />
              <div className="student-shell-head"><div className="student-shell-title">GPA Trend</div></div>
              <div className="p-5"><GpaTrendChart data={records} /></div>
            </div>
            <div className="student-shell">
              <div className="student-shell-accent" />
              <div className="student-shell-head"><div className="student-shell-title">Attendance Trend</div></div>
              <div className="p-5"><AttendanceChart data={records} /></div>
            </div>
          </div>

          <div className="student-shell">
            <div className="student-shell-accent" />
            <div className="student-shell-head"><div className="student-shell-title">Detailed Records</div></div>
            <div className="p-4"><DataTable columns={COLUMNS} data={records} pageSize={10} /></div>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentPerformance
