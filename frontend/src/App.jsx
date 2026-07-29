import React, { useState, useEffect } from 'react';
import { Page, BlockStack, Banner, Spinner } from '@shopify/polaris';

// 🚀 Clean, Isolated Tab Views Imported
import SettingsTab from './components/MilestoneForm.jsx';
import PreviewTab from './components/PreviewTab';

export default function App() {
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#000000');
  const [milestones, setMilestones] = useState([]);

  // Controlled tab string state matching the 'href' values for App Bridge tabs
  const [currentTab, setCurrentTab] = useState('/');

  // App UI operational feedback states
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  const getSessionToken = async () => {
    if (window.shopify && typeof window.shopify.idToken === "function") {
      return await window.shopify.idToken();
    }
    return "";
  };

  // 1. FETCH DATA FROM MONGODB ON APP LAUNCH
  useEffect(() => {
    const fetchSavedConfig = async () => {
      try {
        const token = await getSessionToken();
        const response = await fetch('/api/milestones', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const resData = await response.json();
        if (response.ok && resData.success && resData.data) {
          setBarColor(resData.data.barColor || '#008060');
          setTextColor(resData.data.textColor || '#000000');
          
          if (resData.data.milestones && resData.data.milestones.length > 0) {
            setMilestones(resData.data.milestones.map(m => ({
              threshold: m.threshold,
              rewardText: m.rewardText,
              iconUrl: m.iconUrl || 'https://cdn.shopify.com/s/files/1/0000/0000/files/gift.png'
            })));
          } else {
            setMilestones([{ threshold: 50, rewardText: 'Free Shipping Unlocked!', iconUrl: 'https://cdn.shopify.com/s/files/1/0000/0000/files/gift.png' }]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch configurations:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSavedConfig();
  }, []);

  // Sync App Bridge tab clicks with your React component state
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      setCurrentTab(path);
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = field === 'threshold' ? Number(value) : value;
    setMilestones(updated);
  };

  const addMilestoneRow = () => {
    setMilestones([...milestones, { threshold: 0, rewardText: '', iconUrl: 'https://cdn.shopify.com/s/files/1/0000/0000/files/gift.png' }]);
  };

  const removeMilestoneRow = (index) => {
    const updated = milestones.filter((_, i) => i !== index);
    setMilestones(updated);
  };

  // 2. POST UPDATE DATA CONFIGURATIONS BACK TO DATABASE
  const saveSettings = async () => {
    setLoading(true);
    setBanner(null);

    const payload = {
      barColor,
      textColor,
      milestones: milestones.map(m => ({
        threshold: Number(m.threshold),
        rewardText: m.rewardText,
        iconUrl: m.iconUrl
      }))
    };

    try {
      const token = await getSessionToken();
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setBanner({ type: 'success', title: 'Configuration successfully synchronized to Render & MongoDB!' });
      } else {
        setBanner({ type: 'critical', title: 'Failed to synchronize setups', message: data.error });
      }
    } catch (err) {
      setBanner({ type: 'critical', title: 'Network Communication Error', message: 'Could not connect to Render server.' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spinner accessibilityLabel="Loading milestone parameters" size="large" />
      </div>
    );
  }

  return (
    <Page title="Milestone Progress Manager">
      
      {/* 🚀 SHOPIFY APP BRIDGE NAVIGATION COMPONENT */}
      <ui-nav-menu>
        {/* The first link MUST point to home (rel="home"). Shopify hides this but requires it. */}
        <a href="/" rel="home" data-polaris-unstyled="true" onClick={(e) => { e.preventDefault(); setCurrentTab('/'); }}>Settings & Tiers</a>
        {/* Visible secondary tab in the sidebar */}
        <a href="/preview" data-polaris-unstyled="true" onClick={(e) => { e.preventDefault(); setCurrentTab('/preview'); }}>Live Drawer Preview</a>
      </ui-nav-menu>

      <div style={{ width: '100%', display: 'block', opacity: 1 }}>
        <BlockStack gap="400">
          
          <div style={{ marginTop: '16px' }}>
            {banner && (
              <div style={{ marginBottom: '20px' }}>
                <Banner title={banner.title} tone={banner.type} onDismiss={() => setBanner(null)}>
                  {banner.message && <p>{banner.message}</p>}
                </Banner>
              </div>
            )}

            {/* 🚀 CONDITIONAL RENDERING DELIVERED TO EXPORTED SUB-COMPONENTS */}
            {currentTab === '/' ? (
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
            ) : (
              <PreviewTab 
                milestones={milestones}
                barColor={barColor}
                textColor={textColor}
              />
            )}
          </div>
        </BlockStack>
      </div>
    </Page>
  );
}