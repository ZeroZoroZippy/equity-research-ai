import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ResearchConsole } from './pages/ResearchConsole';
import { ReportViewer } from './pages/ReportViewer';
import { SectorComparison } from './pages/SectorComparison';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/research/stock" element={<ResearchConsole />} />
        <Route path="/research/sector" element={<ResearchConsole />} />
        <Route path="/report" element={<ReportViewer />} />
        <Route path="/sector-comparison" element={<SectorComparison />} />
      </Routes>
    </Router>
  );
}

export default App;
