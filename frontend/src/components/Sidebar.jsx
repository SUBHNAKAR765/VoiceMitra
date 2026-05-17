import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RiHome4Line, RiMicLine, RiSettings4Line, RiLogoutBoxRLine, RiUserLine } from 'react-icons/ri'
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const links = [
  { to: '/', icon: RiHome4Line, label: 'Home' },
  { to: '/assistant', icon: RiMicLine, label: 'Assistant' },
  { to: '/settings', icon: RiSettings4Line, label: 'Settings' },
  { to: '/profile', icon: RiUserLine, label: 'Profile' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { setUser } = useAppStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleSignOut = () => {
    setUser(null)
    navigate('/login')
  }

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isCollapsed ? '80px' : '256px',
        transition: { duration: 0.3, ease: 'easeInOut' }
      }}
      className="flex flex-col glass border-t md:border-t-0 md:border-r border-white/10 rounded-none z-20 shrink-0 fixed bottom-0 md:relative h-16 md:h-full overflow-hidden"
    >
      {/* Header - Interactive Logo Toggle */}
      <div className={`hidden md:flex flex-col items-center gap-4 py-8 border-b border-white/10 overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center w-full gap-3 cursor-pointer group"
        >
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              scale: isCollapsed ? 1.2 : 1,
            }}
            className={`rounded-xl overflow-hidden shrink-0 animate-glow border border-white/10 transition-all duration-300 ${isCollapsed ? 'w-10 h-10 mx-auto' : 'w-10 h-10'}`}
          >
            <img src="/logo.png" className="w-full h-full object-cover" alt="VoiceMitra Logo" />
          </motion.div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-lg neon-text whitespace-nowrap group-hover:text-cyan-300 transition-colors"
              >
                VoiceMitra
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex md:flex-col items-center justify-around md:justify-start gap-1 p-2 md:p-3 flex-1 overflow-x-hidden">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className="flex-1 md:flex-none w-full">
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 4 }}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 md:px-3 py-2 md:py-3 rounded-xl transition-all duration-200 cursor-pointer justify-center md:justify-start
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 neon-border'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="text-xl shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-[10px] md:text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className="text-[10px] md:hidden font-medium">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer - Sign Out Only */}
      <div className="hidden md:flex flex-col gap-4 p-4 border-t border-white/10 overflow-hidden">
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 text-red-400/80 hover:text-red-400 hover:border-red-500/40 transition-all duration-200 w-full justify-center md:justify-start"
        >
          <RiLogoutBoxRLine className="text-xl shrink-0" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium whitespace-nowrap"
            >
              Sign Out
            </motion.span>
          )}
        </motion.button>
        
        {!isCollapsed && (
          <p className="text-[10px] text-gray-600 text-center">v1.0.0</p>
        )}
      </div>
    </motion.aside>
  )
}
