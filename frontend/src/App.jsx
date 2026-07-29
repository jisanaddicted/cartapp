import React, { useState } from 'react';
import { Page, Tabs } from '@shopify/polaris';
import SettingsTab from './components/MilestoneForm.jsx';
import PreviewTab from './components/PreviewTab';

export default function App() {
  // 1. Track your active tab using a strict unique string identifier string, not an index integer number
  const [selectedTabId, setSelectedTabId] = useState('settings');
  
  // State for data management 
  const [milestones, setMilestones] = useState([]);
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#202223');
  const [loading, setLoading] = useState(false);

  // 2. Define tabs array WITHOUT nesting the panel component directly in the configurations state
  const tabsConfig = [
    { id: 'settings', content: 'Milestone Configuration Defaults' },
    { id: 'preview', content: 'Real-time Drawer Preview Window' }
  ];

  // Map indexes safely back to strict unique IDs during selection triggers
  const handleTabChange = (selectedTabIndex) => {
    const targetTab = tabsConfig[selectedTabIndex];
    setSelectedTabId(targetTab.id);
  };

  // State modification functions...
  const addMilestoneRow = () => setMilestones([...milestones, { threshold: '', rewardText: '', iconUrl: '' }]);
  const removeMilestoneRow = (index) => setMilestones(milestones.filter((_, i) => i !== index));
  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };
  const saveSettings = () => { /* save logic */ };

  // 3. Find active index indicator safely for the Polaris UI tab bar highlights wrapper
  const currentSelectedIndex = tabsConfig.findIndex((tab) => tab.id === selectedTabId);

  return (
    <Page title="Tiered Progress Bar Setup Manager">
      {/* Pass exact numeric index value required by Polaris to fit layout controls */}
      <Tabs tabs={tabsConfig} selected={currentSelectedIndex >= 0 ? currentSelectedIndex : 0} onSelect={handleTabChange}>
        
        {/* 4. CONDITIONAL RENDERING SWITCH: This ensures fresh data variables are always evaluated on every single DOM interaction pass */}
        <div style={{ marginTop: '20px' }}>
          {selectedTabId === 'settings' && (
            <SettingsTab
              milestones={milestones}
              barColor={barColor}
              textColor={textColor}
              loading={loading}
              setBarColor={setBarColor}
              setTextColor={setTextColor}
              handleMilestoneChange={handleMilestoneChange}
              addMilestoneRow={addMilestoneRow}
              removeMilestoneRow={removeMilestoneRow}
              saveSettings={saveSettings}
            />
          )}

          {selectedTabId === 'preview' && (
            <PreviewTab
              milestones={milestones}
              barColor={barColor}
              textColor={textColor}
            />
          )}
        </div>

      </Tabs>
    </Page>
  );
}