import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ResearchConsole } from './pages/ResearchConsole';
import { ReportViewer } from './pages/ReportViewer';
import { SectorComparison } from './pages/SectorComparison';
import { Login } from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/research/stock"
            element={(
              <ProtectedRoute>
                <ResearchConsole />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/research/sector"
            element={(
              <ProtectedRoute>
                <ResearchConsole />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/report"
            element={(
              <ProtectedRoute>
                <ReportViewer />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/sector-comparison"
            element={(
              <ProtectedRoute>
                <SectorComparison />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
