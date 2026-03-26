import { useQuery } from '@tanstack/react-query'
import { getStaffStudents, getStudentDetail } from '../api/staff.js'

export const useStudents = (params) => {
  const query = useQuery({
    queryKey: ['students', params],
    queryFn: () => getStaffStudents(params).then((r) => r.data),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
  return {
    students: query.data?.items ?? query.data?.students ?? (Array.isArray(query.data) ? query.data : []),
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export const useStudentDetail = (id) => {
  const query = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => getStudentDetail(id).then((r) => r.data),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  })
  return {
    student: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
