import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatIfSimulation } from '../api/student'
import { predictSingle, simulatePrediction } from '../api/ml'
import { toast } from '../store/toastStore'

export const useWhatIf = () =>
  useMutation({ mutationFn: (data) => whatIfSimulation(data).then((r) => r.data) })

export const useSimulate = () =>
  useMutation({ mutationFn: (data) => simulatePrediction(data).then((r) => r.data) })

export const usePredictStudent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId }) => predictSingle({ student_id: studentId }).then((r) => r.data),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] })
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast.success('Prediction recalculated')
    },
  })
}
