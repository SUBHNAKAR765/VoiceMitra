import { motion, AnimatePresence } from 'framer-motion'
import { RiSearchLine, RiNotification3Line, RiUserLine, RiSettings4Line, RiLogoutBoxRLine } from 'react-icons/ri'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { user, setUser } = useAppStore()

  const notifications = [
    { id: 1, title: 'Welcome!', message: 'Thanks for joining VoiceMitra.', time: '2m ago', unread: true },
    { id: 2, title: 'New Feature', message: 'YouTube transcriptions are live!', time: '1h ago', unread: true },
    { id: 3, title: 'System Update', message: 'Backend connection established.', time: '3h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleSearch = (e) => {
    e.preventDefault()
    if (!search.trim()) return
    navigate(`/assistant?q=${encodeURIComponent(search)}`)
    setSearch('')
  }

  const handleSignOut = () => {
    setIsProfileOpen(false)
    setUser(null)
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'VV'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-6 py-4 glass border-b border-white/10 z-30"
    >
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative group w-full max-w-md">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or ask the assistant..."
          className="w-full bg-gray-900/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
        />
      </form>

      {/* Right Section: Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer relative"
          >
            <RiNotification3Line className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-gray-950 animate-pulse" />
            )}
          </motion.div>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 glass border border-white/10 p-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    <button className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold uppercase tracking-wider">Mark all as read</button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group ${n.unread ? 'bg-cyan-500/5' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-xs font-bold ${n.unread ? 'text-cyan-400' : 'text-gray-300'}`}>{n.title}</p>
                          <span className="text-[10px] text-gray-600 group-hover:text-gray-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="relative group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <span className="text-sm font-bold text-white uppercase">{getInitials(user?.name)}</span>
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-all -z-10" />
          </motion.div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileOpen(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 glass border border-white/10 p-2 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">{user?.name || 'Guest User'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <RiUserLine className="text-lg" />
                      <span>Profile</span>
                    </button>
                    <button 
                      onClick={() => { setIsProfileOpen(false); navigate('/settings') }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <RiSettings4Line className="text-lg" />
                      <span>Settings</span>
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <RiLogoutBoxRLine className="text-lg" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}
