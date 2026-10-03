import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function RouteGate({ children, guestOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="route-loading"><span className="spinner" /></div>
  if (guestOnly && user) return <Navigate to="/" replace />
  if (!guestOnly && !user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RouteGate guestOnly><LoginPage /></RouteGate>} />
      <Route path="/register" element={<RouteGate guestOnly><RegisterPage /></RouteGate>} />
      <Route path="/" element={<RouteGate><ChatPage /></RouteGate>} />
      <Route path="/profile" element={<RouteGate><ProfilePage /></RouteGate>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}