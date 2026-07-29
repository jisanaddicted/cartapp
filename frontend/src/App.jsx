import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Page } from '@shopify/polaris';
import MilestoneForm from './components/MilestoneForm.jsx';
import PreviewTab from './components/PreviewTab.jsx';

export default function App() {
  // State for tracking configuration data variables
  const [milestones, setMilestones] = useState([]);
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#202223');
  const [loading, setLoading] = useState(false);

  // Fetch stored configurations from MongoDB on mount
  useEffect(() => {
    async function fetchCurrentSettings() {
      try {
        const response = await fetch('/api/milestones'); // Points to backend layout route
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setMilestones(data.milestones || []);
            setBarColor(data.barColor || '#008060');
            setTextColor(data.textColor || '#202223');
          }
        }
      } catch (error) {
        console.error('Error fetching milestone configurations:', error);
      }
    }
    fetchCurrentSettings();
  }, []);

  // Structural array modification functions
  const addMilestoneRow = () => {
    setMilestones([...milestones, { threshold: '', rewardText: '', iconUrl: '' }]);
  };

  const removeMilestoneRow = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  // Full-stack submission syncing layout properties to database storage
  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ milestones, barColor, textColor })
      });
      
      if (!response.ok) {
        throw new Error('Network synchronization response failed.');
      }
    } catch (err) {
      console.error('Failed saving configurations backend payload:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 
        Shopify App Bridge reads <ui-nav-menu> automatically to inject 
        navigation links cleanly into the Shopify Admin Sidebar shell.
      */}
      <ui-nav-menu>
        <Link to="/app">Milestone Setup</Link>
        <Link to="/app/preview">Real-time Preview Window</Link>
      </ui-nav-menu>

      {/* Client-side routing execution layout inside the embedded iframe */}
      <Routes>
        <Route 
          path="/app" 
          element={
            <Page title="Milestone Configuration Defaults">
              <div style={{ marginTop: '20px' }}>
                <MilestoneForm
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
              </div>
            </Page>
          } 
        />
        
        <Route 
          path="/app/preview" 
          element={
            <Page title="Real-time Drawer Preview Window">
              <div style={{ marginTop: '20px' }}>
                <PreviewTab
                  milestones={milestones}
                  barColor={barColor}
                  textColor={textColor}
                />
              </div>
            </Page>
          } 
        />
      </Routes>
    </>
  );
}