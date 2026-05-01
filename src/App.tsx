import { HashRouter, Route, Routes } from 'react-router-dom';
import HealthPage from './HealthPage';
import MainPage from './MainPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
    </HashRouter>
  );
}