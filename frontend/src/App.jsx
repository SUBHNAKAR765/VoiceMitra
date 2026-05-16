import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import Youtube from './pages/Youtube'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import Toast from './components/Toast'

export default function App() {
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/youtube" element={<Youtube />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </AnimatePresence>
      <Toast />
    </>
  )
}
