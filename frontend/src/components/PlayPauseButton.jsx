import { motion } from 'framer-motion'
import { RiPlayFill, RiPauseFill } from 'react-icons/ri'

export default function PlayPauseButton({ isPlaying, onClick, disabled }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect when playing */}
      {isPlaying && (
        <motion.div
          className="absolute w-16 h-16 rounded-full bg-purple-500/20 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        disabled={disabled}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl z-10 transition-all duration-300 border-2
          ${isPlaying 
            ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-white/80 shadow-lg shadow-purple-500/30' 
            : 'bg-gradient-to-br from-gray-700/80 to-gray-900/80 border-white/40 hover:border-white/60 shadow-md'
          }
          ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isPlaying ? (
          <RiPauseFill className="text-white" />
        ) : (
          <RiPlayFill className="text-white translate-x-0.5" />
        )}
      </motion.button>
    </div>
  )
}
