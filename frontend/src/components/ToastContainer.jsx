import { AnimatePresence, motion } from 'framer-motion'
import useToastStore from '../store/toastStore'

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()

  const colorMap = {
    error: 'bg-red-50 border-red-300 text-red-800',
    success: 'bg-green-50 border-green-300 text-green-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  }

  const iconMap = {
    error: '✕',
    success: '✓',
    info: 'ℹ',
  }

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto border rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 ${colorMap[t.type] || colorMap.info}`}
          >
            <span className="font-bold text-base leading-none mt-0.5">{iconMap[t.type]}</span>
            <p className="text-sm flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="opacity-50 hover:opacity-100 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer
