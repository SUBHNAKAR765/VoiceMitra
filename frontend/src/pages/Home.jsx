import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { RiMicLine, RiCloudLine, RiNewspaperLine, RiGlobalLine, RiTimeLine } from 'react-icons/ri'

const features = [
  { icon: RiCloudLine, label: 'Weather', desc: 'Real-time weather for any city', color: 'from-cyan-500 to-blue-500', query: "What's the weather?" },
  { icon: RiNewspaperLine, label: 'News', desc: 'Top headlines summarized', color: 'from-purple-500 to-pink-500', query: 'Tell me the latest news' },
  { icon: RiGlobalLine, label: 'Wikipedia', desc: 'Instant knowledge lookup', color: 'from-emerald-500 to-teal-500', query: 'Search Wikipedia for ' },
  { icon: RiTimeLine, label: 'Time & Date', desc: 'Current time and date', color: 'from-orange-500 to-amber-500', query: 'What time is it?' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Home() {
  const navigate = useNavigate()

  const handleFeatureClick = (query) => {
    navigate(`/assistant?q=${encodeURIComponent(query)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Hero section stays same ... */}
      <div className="text-center py-12 md:py-20">
        <div className="relative inline-flex items-center justify-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-2xl"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center relative"
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border border-purple-500/40 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <img src="/logo.png" className="w-full h-full object-cover" alt="VoiceMitra Logo" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold mb-4"
        >
          Meet{' '}
          <span className="neon-text">VoiceMitra</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-8"
        >
          Your AI-powered voice assistant. Ask about weather, news, facts, and more — just speak.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/assistant" className="btn-primary inline-flex items-center gap-2 text-white">
            <RiMicLine />
            Launch Assistant
          </Link>
        </motion.div>
      </div>

      {/* Feature cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12"
      >
        {features.map(({ icon: Icon, label, desc, color, query }) => (
          <motion.div
            key={label}
            variants={item}
            whileHover={{ y: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFeatureClick(query)}
            className="glass p-5 text-center cursor-pointer hover:border-cyan-500/40 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-cyan-500/20 transition-all`}>
              <Icon className="text-white text-lg" />
            </div>
            <p className="font-semibold text-sm text-white mb-1 group-hover:text-cyan-400 transition-colors">{label}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
