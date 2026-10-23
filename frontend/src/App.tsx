import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScenarioListPage } from './pages/ScenarioListPage';
import { ScenarioBuilderPage } from './pages/ScenarioBuilderPage';
import { SimulationWorkspacePage } from './pages/SimulationWorkspacePage';
import { ShelterManagementPage } from './pages/ShelterManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ComparePage } from './pages/ComparePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ArthaSetuStatsPage } from './pages/ArthaSetuStatsPage';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { SurakshaChatbot } from './components/SurakshaChatbot';


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <>
        {children}
        <SurakshaChatbot activeScenarioId={activeScenarioId} />
      </>
    );
  }

  return (
    <div className="grid-wrapper min-h-screen text-[#1F2937] flex flex-col font-sans relative">
      <div className="grid-background pointer-events-none" aria-hidden="true"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeScenarioId={activeScenarioId}
          onScenarioChange={setActiveScenarioId}
        />

        <div className="flex-1 flex">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeScenarioId={activeScenarioId}
          />

          <main className="flex-1 lg:ml-64 p-4 lg:p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Suraksha EOC Disaster AI Assistant Floating Chatbot */}
        <SurakshaChatbot activeScenarioId={activeScenarioId} />
      </div>
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scenarios" element={<ScenarioListPage />} />
          <Route path="/scenarios/new" element={<ScenarioBuilderPage />} />
          <Route path="/scenarios/:id/edit" element={<ScenarioBuilderPage />} />
          <Route path="/simulation/:id" element={<SimulationWorkspacePage />} />
          <Route path="/shelters" element={<ShelterManagementPage />} />
          <Route path="/analytics/:id" element={<AnalyticsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/live-tracking" element={<LiveTrackingPage />} />
          <Route path="/live-map" element={<LiveTrackingPage />} />
          <Route path="/stats" element={<ArthaSetuStatsPage />} />
          <Route path="/arthasetu" element={<ArthaSetuStatsPage />} />

        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
