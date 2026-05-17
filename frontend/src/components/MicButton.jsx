import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

// Animated mic button with pulse rings
export default function MicButton({ onClick }) {
  const { isRecording, isLoading } = useAppStore()

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-red-500/40"
              initial={{ width: 60, height: 60, opacity: 0.8 }}
              animate={{ width: 60 + i * 30, height: 60 + i * 30, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      {/* Idle glow rings */}
      {!isRecording && !isLoading && (
        <motion.div
          className="absolute w-24 h-24 rounded-full"
          animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.2)', '0 0 40px rgba(0,212,255,0.5)', '0 0 20px rgba(0,212,255,0.2)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <motion.button
        onClick={onClick}
        disabled={isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl font-bold z-10 transition-all duration-300 shadow-2xl
          ${isRecording
            ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40'
            : isLoading
            ? 'bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed'
            : 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-cyan-500/40 hover:shadow-cyan-500/60'
          }`}
      >
        {isLoading ? (
          <motion.div
            className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : isRecording ? (
          <span className="w-6 h-6 bg-white rounded-sm" />
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 9a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V23h-2v-2.06A9 9 0 0 1 3 12h2z"/>
          </svg>
        )}
      </motion.button>
    </div>
  )
}
