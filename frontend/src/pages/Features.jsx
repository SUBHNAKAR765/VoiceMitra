import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  RiCloudLine,
  RiNewspaperLine,
  RiGlobalLine,
  RiTimeLine,
  RiBookOpenLine,
  RiTranslate2,
  RiCalculatorLine,
  RiEmotionLaughLine,
  RiChatQuoteLine,
  RiLightbulbLine,
  RiHistoryLine,
  RiCodeSSlashLine,
  RiSparkling2Line,
  RiHeartPulseLine,
  RiMusic2Line,
  RiRestaurantLine,
  RiCompass3Line,
  RiPlanetLine,
  RiCoinsLine,
  RiTrophyLine,
  RiBook3Line
} from 'react-icons/ri'

const features = [
  { icon: RiCloudLine, label: 'Weather', desc: 'Real-time weather for any city', color: 'from-cyan-500 to-blue-500', query: "What's the weather?" },
  { icon: RiNewspaperLine, label: 'News', desc: 'Top headlines summarized', color: 'from-purple-500 to-pink-500', query: 'Tell me the latest news' },
  { icon: RiGlobalLine, label: 'Wikipedia', desc: 'Instant knowledge lookup', color: 'from-emerald-500 to-teal-500', query: 'Search Wikipedia for ' },
  { icon: RiTimeLine, label: 'Time & Date', desc: 'Current time and date', color: 'from-orange-500 to-amber-500', query: 'What time is it?' },
  { icon: RiBookOpenLine, label: 'Dictionary', desc: 'Find word definitions', color: 'from-indigo-500 to-purple-500', query: 'Define the word serendipity' },
  { icon: RiTranslate2, label: 'Translator', desc: 'Translate text instantly', color: 'from-rose-500 to-orange-500', query: 'Translate "Good morning, my friend" to French' },
  { icon: RiCalculatorLine, label: 'Calculator', desc: 'Solve math questions', color: 'from-teal-500 to-emerald-500', query: 'What is 15 percent of 850?' },
  { icon: RiEmotionLaughLine, label: 'Jokes', desc: 'Tell a funny joke', color: 'from-yellow-400 to-amber-500', query: 'Tell me a programming joke' },
  { icon: RiChatQuoteLine, label: 'Quotes', desc: 'Get daily inspiration', color: 'from-violet-500 to-fuchsia-500', query: 'Give me a motivational quote' },
  { icon: RiLightbulbLine, label: 'Trivia', desc: 'Science and history quiz', color: 'from-amber-500 to-red-500', query: 'Give me a science trivia question' },
  { icon: RiHistoryLine, label: 'History', desc: 'Events on this day', color: 'from-blue-500 to-indigo-500', query: 'What happened on this day in history?' },
  { icon: RiCodeSSlashLine, label: 'Coding', desc: 'Explain tech & code', color: 'from-emerald-400 to-cyan-500', query: 'Explain how async/await works in JavaScript' },
  { icon: RiHeartPulseLine, label: 'Health Tips', desc: 'Advice for healthy life', color: 'from-rose-500 to-pink-500', query: 'Give me a healthy lifestyle tip' },
  { icon: RiMusic2Line, label: 'Music Recommend', desc: 'Soothe with music suggestions', color: 'from-purple-500 to-indigo-500', query: 'Suggest some ambient music for studying' },
  { icon: RiRestaurantLine, label: 'Recipes', desc: 'Learn how to cook dishes', color: 'from-amber-500 to-orange-500', query: 'How do I make standard pancakes?' },
  { icon: RiCompass3Line, label: 'Travel Guide', desc: 'Fascinating geography facts', color: 'from-teal-500 to-cyan-500', query: 'Tell me some interesting facts about Tokyo' },
  { icon: RiPlanetLine, label: 'Astronomy', desc: 'Fascinating facts about space', color: 'from-blue-500 to-violet-500', query: 'Tell me an interesting fact about Mars' },
  { icon: RiCoinsLine, label: 'Finance', desc: 'Convert rates & financial tips', color: 'from-emerald-500 to-teal-500', query: 'Convert 100 USD to EUR' },
  { icon: RiTrophyLine, label: 'Sports Trivia', desc: 'Famous matches & record holders', color: 'from-orange-500 to-red-500', query: 'Who holds the record for the most Olympic gold medals?' },
  { icon: RiBook3Line, label: 'Literature', desc: 'Information about books & authors', color: 'from-yellow-500 to-amber-500', query: 'Who wrote the novel "To Kill a Mockingbird"?' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Features() {
  const navigate = useNavigate()

  const handleFeatureClick = (query) => {
    navigate(`/assistant?q=${encodeURIComponent(query)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto pb-12"
    >
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <RiSparkling2Line className="text-cyan-400 text-3xl animate-pulse" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">Assistant Features</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Explore all the topics and voice assistant capabilities. Click a card to try a preset query.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
