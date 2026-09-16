import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { TabKey } from './components/Sidebar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { ApplicationExplorer } from './pages/ApplicationExplorer';
import { SQLExplorer } from './pages/SQLExplorer';
import { RiskScorer } from './pages/RiskScorer';
import { ModelPerformance } from './pages/ModelPerformance';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const renderPage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'applications':
        return <ApplicationExplorer />;
      case 'sql':
        return <SQLExplorer />;
      case 'scorer':
        return <RiskScorer />;
      case 'model':
        return <ModelPerformance />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderPage()}
    </Layout>
  );
};

export default App;
