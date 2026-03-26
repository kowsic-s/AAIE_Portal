import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInterventions, createIntervention, updateIntervention } from '../api/staff'
import { toast } from '../store/toastStore'

export const useInterventions = (params) => {
  const query = useQuery({
    queryKey: ['interventions', params],
    queryFn: () => getInterventions(params).then((r) => r.data),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
  return {
    interventions: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export const useCreateIntervention = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, payload }) => createIntervention(studentId, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] })
      toast.success('Intervention created')
    },
  })
}

export const useUpdateIntervention = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ interventionId, id, payload, data }) =>
      updateIntervention(interventionId ?? id, payload ?? data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] })
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student-detail'] })
      toast.success('Intervention updated')
    },
  })
}
