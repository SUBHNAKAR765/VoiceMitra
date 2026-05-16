import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { RiCheckLine, RiErrorWarningLine, RiInformationLine, RiCloseLine } from 'react-icons/ri'

const icons = {
  success: <RiCheckLine className="text-emerald-400 text-lg" />,
  error: <RiErrorWarningLine className="text-red-400 text-lg" />,
  info: <RiInformationLine className="text-cyan-400 text-lg" />,
}

const borders = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-cyan-500/30',
}

export default function Toast() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`glass flex items-start gap-3 p-4 border ${borders[t.type] || borders.info}`}
          >
            {icons[t.type] || icons.info}
            <p className="text-sm text-gray-200 flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-white transition-colors">
              <RiCloseLine />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
