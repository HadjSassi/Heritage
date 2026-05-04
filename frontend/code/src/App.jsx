import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import FamilyTree from './pages/FamilyTree'
import PersonProfile from './pages/PersonProfile'
import RecordsSearch from './pages/RecordsSearch'
import MediaGallery from './pages/MediaGallery'
import Matches from './pages/Matches'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('heritage_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tree" element={<PrivateRoute><FamilyTree /></PrivateRoute>} />
          <Route path="/person/:id" element={<PrivateRoute><PersonProfile /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><RecordsSearch /></PrivateRoute>} />
          <Route path="/media" element={<PrivateRoute><MediaGallery /></PrivateRoute>} />
          <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

