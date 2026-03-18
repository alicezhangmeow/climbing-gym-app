import { Navigate, Route, Routes } from 'react-router-dom'
import { GymDetailPage } from './pages/GymDetailPage'
import { GymListPage } from './pages/GymListPage'
import { ImportPage } from './pages/ImportPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GymListPage />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/gyms/:gymId" element={<GymDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
