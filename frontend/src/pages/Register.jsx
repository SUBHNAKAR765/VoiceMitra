import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { RiMailLine, RiLockLine, RiUserLine, RiArrowRightLine } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'
import { register } from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const { addToast, setUser, user } = useAppStore()

  if (user) return <Navigate to="/" replace />
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match!' })
      return
    }

    setLoading(true)
    try {
      const { data } = await register({
        name,
        email,
        username,
        password
      })
      setUser(data)
      addToast({ type: 'success', message: 'Account created! Welcome to VoiceMitra.' })
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.'
      addToast({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-950">
      {/* Background Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

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
          <p className="text-gray-500 text-sm">Join the future of voice AI</p>
        </div>

        <h2 className="text-xl font-semibold text-white text-center mb-6">Create Account</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
            <div className="relative group">
              <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Username</label>
            <div className="relative group">
              <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe123"
                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email</label>
            <div className="relative group">
              <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Confirm</label>
              <div className="relative group">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{loading ? 'Creating account...' : 'Create account'}</span>
            {!loading && <RiArrowRightLine />}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Already have an account?{' '}
            <Link to="/login" title='sign in link' className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors ml-1">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
