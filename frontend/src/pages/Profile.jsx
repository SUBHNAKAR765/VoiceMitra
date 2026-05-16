import { motion } from 'framer-motion'
import { RiUserLine, RiMailLine, RiHashtag, RiShieldUserLine, RiIdCardLine } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'

export default function Profile() {
  const { user } = useAppStore()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to view your profile.</p>
      </div>
    )
  }

  const profileData = [
    { icon: RiUserLine, label: 'Full Name', value: user.name },
    { icon: RiMailLine, label: 'Email Address', value: user.email },
    { icon: RiShieldUserLine, label: 'Username', value: user.username },
    { icon: RiIdCardLine, label: 'Roll Number', value: user.roll_number },
    { icon: RiHashtag, label: 'User ID', value: user.id },
  ]

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="text-center mb-10">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-2xl shadow-cyan-500/30">
            <span className="text-3xl font-bold text-white uppercase">{getInitials(user.name)}</span>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-3xl blur-lg opacity-20 -z-10" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
        <p className="text-cyan-400 font-medium text-sm tracking-wide uppercase">VoiceMitra Student Profile</p>
      </div>

      <div className="grid gap-4">
        {profileData.map(({ icon: Icon, label, value }) => (
          <motion.div
            key={label}
            whileHover={{ x: 4 }}
            className="glass p-5 flex items-center gap-5 border border-white/5 hover:border-cyan-500/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-900/50 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
              <Icon className="text-xl text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
              <p className="text-lg font-semibold text-gray-200">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 p-6 glass border-cyan-500/20 bg-cyan-500/5 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-2">Account Status</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-xs text-emerald-400 font-medium">Verified & Active Student Account</p>
        </div>
        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
          This profile information is retrieved in real-time from the VoiceMitra student database. 
          To update your details, please contact the administration department.
        </p>
      </div>
    </motion.div>
  )
}
