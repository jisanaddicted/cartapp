import React, { useState, useEffect } from 'react';
import { Page } from '@shopify/polaris';
import MilestoneForm from './components/MilestoneForm.jsx';

export default function App() {
  // State for tracking configuration data variables
  const [milestones, setMilestones] = useState([]);
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#202223');
  const [loading, setLoading] = useState(false);

  // Optional: Fetch stored configurations from MongoDB on mount
  useEffect(() => {
    async function fetchCurrentSettings() {
      try {
        const response = await fetch('/api/milestones'); // Adjust URL endpoint based on Express server routes
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
      const response = await fetch('/api/milestones', { // Make sure this hits your valid Node production API route
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
  );
}