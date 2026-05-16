import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiYoutubeLine, RiDownload2Line, RiFileCopyLine,
  RiSearchLine, RiTimeLine, RiCloseLine, RiCheckLine,
} from 'react-icons/ri'
import { transcribeYoutube } from '../api/client'
import { useAppStore } from '../store/useAppStore'

// Format seconds → [HH:]MM:SS
function fmt(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SegmentRow({ seg, index }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(seg.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      className="group flex gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
    >
      {/* Timestamp badge */}
      <div className="flex items-start gap-1 shrink-0 pt-0.5">
        <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md whitespace-nowrap">
          {fmt(seg.start)}
        </span>
        <span className="text-xs text-gray-700 pt-0.5">→</span>
        <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
          {fmt(seg.end)}
        </span>
      </div>

      {/* Text */}
      <p className="text-sm text-gray-200 leading-relaxed flex-1">{seg.text}</p>

      {/* Copy button */}
      <button
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 shrink-0"
      >
        {copied ? <RiCheckLine className="text-emerald-400" /> : <RiFileCopyLine />}
      </button>
    </motion.div>
  )
}

export default function Youtube() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)
  const { addToast } = useAppStore()
  const inputRef = useRef(null)

  const handleTranscribe = async () => {
    if (!url.trim()) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const { data } = await transcribeYoutube(url.trim())
      setResult(data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to transcribe. Check the URL and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setResult(null)
    setError('')
    setSearch('')
    inputRef.current?.focus()
  }

  const handleCopyAll = () => {
    if (!result) return
    navigator.clipboard.writeText(result.full_text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
    addToast({ type: 'success', message: 'Full transcript copied!' })
  }

  const handleDownload = () => {
    if (!result) return
    const lines = result.segments.map(
      (s) => `[${fmt(s.start)} --> ${fmt(s.end)}]  ${s.text}`
    )
    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `transcript-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
    addToast({ type: 'success', message: 'Transcript downloaded!' })
  }

  const handleDownloadSRT = () => {
    if (!result) return
    const lines = result.segments.map((s, i) => {
      const start = fmt(s.start).replace('.', ',')
      const end = fmt(s.end).replace('.', ',')
      return `${i + 1}\n00:${start.padStart(8, '0')} --> 00:${end.padStart(8, '0')}\n${s.text}\n`
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `transcript-${Date.now()}.srt`
    a.click()
    URL.revokeObjectURL(a.href)
    addToast({ type: 'success', message: 'SRT file downloaded!' })
  }

  const filteredSegments = result?.segments.filter((s) =>
    s.text.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto flex flex-col gap-6 pb-10"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
          <RiYoutubeLine className="text-white text-xl" />
        </div>
        <div>
          <h2 className="font-bold text-white text-lg">YouTube Transcriber</h2>
          <p className="text-xs text-gray-500">Paste any YouTube URL to generate a full transcript with timestamps</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="glass p-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <RiYoutubeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-lg" />
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleTranscribe()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-gray-900/60 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            {url && (
              <button
                onClick={() => setUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <RiCloseLine />
              </button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTranscribe}
            disabled={!url.trim() || loading}
            className="btn-primary flex items-center gap-2 text-white disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Transcribing...
              </>
            ) : (
              <>
                <RiYoutubeLine />
                Transcribe
              </>
            )}
          </motion.button>
        </div>

        {/* Loading status */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2"
            >
              {['Downloading audio from YouTube...', 'Processing with Faster-Whisper AI...', 'Generating timestamps...'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 1.5 }}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                  {step}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
            >
              <RiCloseLine className="shrink-0 text-lg" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass flex flex-col gap-0 overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {result.segment_count} segments
                </span>
                <span className="text-xs text-gray-600">
                  {result.full_text.split(' ').length} words
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transcript..."
                  className="bg-gray-900/60 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors w-48"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleCopyAll}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  {copiedAll ? <RiCheckLine className="text-emerald-400" /> : <RiFileCopyLine />}
                  Copy All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <RiDownload2Line />
                  TXT
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadSRT}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <RiDownload2Line />
                  SRT
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleClear}
                  className="btn-ghost flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <RiCloseLine />
                  Clear
                </motion.button>
              </div>
            </div>

            {/* Segments list */}
            <div className="overflow-y-auto max-h-[55vh] py-2">
              {filteredSegments.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-8">No segments match your search.</p>
              ) : (
                filteredSegments.map((seg, i) => (
                  <SegmentRow key={i} seg={seg} index={i} />
                ))
              )}
            </div>

            {/* Full text preview */}
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <RiTimeLine /> Full transcript preview
              </p>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                {result.full_text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
