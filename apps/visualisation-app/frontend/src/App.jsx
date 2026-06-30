import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MetricsProvider } from './context/MetricsContext';
import Dashboard from './pages/Dashboard';
import SliceDetail from './pages/SliceDetail';

function App() {
  return (
    <MetricsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/slice/:sliceId" element={<SliceDetail />} />
        </Routes>
      </Router>
    </MetricsProvider>
  );
}

export default App;
