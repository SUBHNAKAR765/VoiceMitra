import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { RiUserLine, RiLockLine, RiArrowRightLine } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'
import { login } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const { addToast, setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data } = await login(username, password)
      setUser(data)
      addToast({ type: 'success', message: `Welcome back, ${data.name}!` })
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      addToast({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-950">
      {/* Background Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass p-8 md:p-10 relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden animate-glow border border-white/10 mb-4">
            <img src="/logo.png" className="w-full h-full object-cover" alt="VoiceMitra Logo" />
          </div>
          <h1 className="text-3xl font-bold neon-text mb-1">VoiceMitra</h1>
          <p className="text-gray-500 text-sm">Your AI-powered voice assistant</p>
        </div>

        <h2 className="text-2xl font-semibold text-white text-center mb-8">Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Username / Email</label>
            <div className="relative group">
              <RiUserLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username or Email"
                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-11 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" title='forgot password link' className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <RiLockLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-11 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            {!loading && <RiArrowRightLine />}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            New here?{' '}
            <Link to="/register" title='create account link' className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors ml-1">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
