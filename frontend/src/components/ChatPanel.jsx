import { motion } from 'framer-motion'
import { RiRobot2Line, RiUser3Line, RiFileCopyLine, RiVolumeUpLine } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-cyan-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const { addToast } = useAppStore()
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    addToast({ type: 'success', message: 'Copied to clipboard!' })
  }

  const playAudio = () => {
    if (msg.audio_url) new Audio(msg.audio_url).play()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm
        ${isUser
          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
          : 'bg-gradient-to-br from-cyan-500 to-blue-600'
        }`}
      >
        {isUser ? <RiUser3Line /> : <RiRobot2Line />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] group relative`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-500/20 text-gray-100 rounded-tr-sm'
            : 'glass border-cyan-500/20 text-gray-200 rounded-tl-sm'
          }`}
        >
          {msg.content}
        </div>

        {/* Action buttons */}
        <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
          <button onClick={copy} className="p-1 text-gray-500 hover:text-cyan-400 transition-colors">
            <RiFileCopyLine className="text-xs" />
          </button>
          {msg.audio_url && (
            <button onClick={playAudio} className="p-1 text-gray-500 hover:text-cyan-400 transition-colors">
              <RiVolumeUpLine className="text-xs" />
            </button>
          )}
        </div>

        <p className={`text-xs text-gray-600 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

export default function ChatPanel({ isLoading, liveText }) {
  const { messages } = useAppStore()

  return (
    <div className="flex flex-col gap-4 py-2">
      {messages.length === 0 && !liveText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-gray-600"
        >
          <RiRobot2Line className="text-5xl mx-auto mb-3 text-gray-700" />
          <p className="text-sm">Press the microphone and start speaking</p>
        </motion.div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}

      {/* liveText shown only while actively recording */}
      {liveText && (
        <MessageBubble
          msg={{ id: 'live', role: 'user', content: liveText, timestamp: new Date().toISOString() }}
        />
      )}

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <RiRobot2Line className="text-sm" />
          </div>
          <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm border border-cyan-500/20">
            <TypingDots />
          </div>
        </div>
      )}
    </div>
  )
}
