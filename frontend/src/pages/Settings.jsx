import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { RiSaveLine, RiVolumeUpLine } from 'react-icons/ri'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
        <Icon className="text-cyan-400 text-lg" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls = "w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"

export default function Settings() {
  const { settings, updateSettings, addToast } = useAppStore()

  const save = () => addToast({ type: 'success', message: 'Settings saved locally!' })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto flex flex-col gap-6 pb-8"
    >



      {/* TTS Engine */}
      <Section icon={RiVolumeUpLine} title="Voice Engine">
        <Field label="Text-to-Speech Engine">
          <div className="flex gap-3">
            {['gtts', 'pyttsx3'].map((engine) => (
              <button
                key={engine}
                onClick={() => updateSettings({ ttsEngine: engine })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
                  ${(settings.ttsEngine || 'gtts') === engine
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                    : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
              >
                {engine === 'gtts' ? '🌐 Google TTS (Online)' : '💻 pyttsx3 (Offline)'}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={save}
        className="btn-primary flex items-center justify-center gap-2 text-white w-full"
      >
        <RiSaveLine />
        Save Settings
      </motion.button>

      <p className="text-xs text-gray-600 text-center">
        Keys are stored in your browser. For production, set them in <code className="font-mono text-gray-500">backend/.env</code>
      </p>
    </motion.div>
  )
}
