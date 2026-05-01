import { HashRouter, Route, Routes } from 'react-router-dom';
import HealthPage from './HealthPage';

function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Home</h1>
    </main>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
    </HashRouter>
  );
}