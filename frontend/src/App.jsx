import React, { useState, useEffect } from 'react';
import { 
  Page, Layout, Card, Text, TextField, 
  Button, BlockStack, InlineStack, Bleed, Divider, Banner, Spinner, Tabs
} from '@shopify/polaris';

export default function App() {
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#000000');
  const [milestones, setMilestones] = useState([]);

  // Navigation Tabs state
  const [selectedTab, setSelectedTab] = useState(0);

  // App UI operational feedback states
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  // Simulated Drawer states (for testing calculation thresholds inside preview)
  const [simulatedCartTotal, setSimulatedCartTotal] = useState(40);

  const tabs = [
    { id: 'settings-tab', title: 'Settings & Tiers', panelID: 'settings-panel' },
    { id: 'preview-tab', title: 'Live Drawer Preview', panelID: 'preview-panel' }
  ];

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
      } finaly {
        setInitialLoading(false);
      }
    };

    fetchSavedConfig();
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

  // --- DRAWER MATHEMATICS PREVIEW LOGIC ---
  const sortedMilestones = [...milestones].sort((a, b) => a.threshold - b.threshold);
  const nextMilestone = sortedMilestones.find(m => simulatedCartTotal < m.threshold);
  const unlockedMilestones = sortedMilestones.filter(m => simulatedCartTotal >= m.threshold);
  
  const maxThreshold = sortedMilestones.length > 0 ? sortedMilestones[sortedMilestones.length - 1].threshold : 100;
  const progressPercentage = Math.min((simulatedCartTotal / (maxThreshold || 1)) * 100, 100);

  return (
    <Page title="Milestone Progress Manager">
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        <div style={{ marginTop: '20px' }}>
          {banner && (
            <div style={{ marginBottom: '20px' }}>
              <Banner title={banner.title} tone={banner.type} onDismiss={() => setBanner(null)}>
                {banner.message && <p>{banner.message}</p>}
              </Banner>
            </div>
          )}

          {selectedTab === 0 ? (
            /* TAB 1: THE CONFIGURATION INTERFACE */
            <Layout>
              <Layout.Section>
                <BlockStack gap="500">
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h2">Configure Reward Milestones</Text>
                      <Text as="p" color="subdued">Define spending targets (in dollars) that customers must cross to unlock rewards.</Text>
                      <Divider />

                      {milestones.length === 0 ? (
                        <Text as="p" color="subdued">No milestones added yet. Click below to add one.</Text>
                      ) : (
                        milestones.map((milestone, index) => (
                          <InlineStack key={index} gap="400" align="space-between" blockAlign="center">
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Spend Threshold ($)"
                                type="number"
                                value={milestone.threshold}
                                onChange={(val) => handleMilestoneChange(index, 'threshold', val)}
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ flex: 2 }}>
                              <TextField
                                label="Reward Banner Text"
                                value={milestone.rewardText}
                                onChange={(val) => handleMilestoneChange(index, 'rewardText', val)}
                                placeholder="e.g. Free Shipping unlocked!"
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ flex: 1.5 }}>
                              <TextField
                                label="Prize Icon Link"
                                value={milestone.iconUrl}
                                onChange={(val) => handleMilestoneChange(index, 'iconUrl', val)}
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ paddingTop: '24px' }}>
                              <Button tone="critical" variant="plain" onClick={() => removeMilestoneRow(index)}>
                                Remove
                              </Button>
                            </div>
                          </InlineStack>
                        ))
                      )}

                      <InlineStack align="start">
                        <Button onClick={addMilestoneRow}>Add New Tier Milestone</Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">Progress Bar Theme</Text>
                    <TextField label="Fill Bar Color Hex Code" value={barColor} onChange={setBarColor} autoComplete="off" />
                    <TextField label="Text Status Font Color" value={textColor} onChange={setTextColor} autoComplete="off" />
                    <Bleed marginInlineStart="400" marginInlineEnd="400"><Divider /></Bleed>
                    <Button variant="primary" loading={loading} onClick={saveSettings} fullWidth>Save Settings Configuration</Button>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          ) : (
            /* TAB 2: LIVE SIMULATED CART DRAWER PREVIEW */
            <Layout>
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">Simulate Cart Total</Text>
                    <Text as="p" color="subdued">Adjust this slider value to see how the cart drawer automatically calculates tiers dynamically.</Text>
                    <TextField 
                      label="Current Cart Value ($)" 
                      type="number" 
                      value={simulatedCartTotal} 
                      onChange={(v) => setSimulatedCartTotal(Number(v))} 
                      autoComplete="off" 
                    />
                    <input 
                      type="range" 
                      min="0" 
                      max={maxThreshold + 50} 
                      value={simulatedCartTotal} 
                      onChange={(e) => setSimulatedCartTotal(Number(e.target.value))}
                      style={{ width: '100%', accentColor: barColor, cursor: 'pointer' }}
                    />
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <div style={{ display: 'flex', justifyContent: 'center', background: '#f1f2f4', padding: '40px 10px', borderRadius: '8px', border: '1px dashed #c9cccf' }}>
                  
                  {/* SIMULATED CART DRAWER CONTAINER */}
                  <div style={{ width: '380px', background: '#ffffff', boxShadow: '0px 4px 20px rgba(0,0,0,0.15)', borderRadius: '4px', display: 'flex', flexDirection: 'column', height: '550px', overflow: 'hidden', border: '1px solid #e1e3e5' }}>
                    
                    {/* Drawer Header */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#202223' }}>Your Cart Drawer</span>
                      <span style={{ cursor: 'pointer', fontSize: '18px', color: '#6d7175' }}>✕</span>
                    </div>

                    {/* DYNAMIC PROGRESS BAR REGION */}
                    <div style={{ padding: '16px', background: '#fafbfb', borderBottom: '1px solid #e1e3e5' }}>
                      <div style={{ textAlign: 'center', marginBottom: '8px', color: textColor, fontWeight: '500', fontSize: '13px' }}>
                        {nextMilestone ? (
                          <span>You are <strong>${nextMilestone.threshold - simulatedCartTotal}</strong> away from <strong>{nextMilestone.rewardText || 'next tier'}</strong>!</span>
                        ) : (
                          <span>🎉 Congrats! You have unlocked all tier rewards!</span>
                        )}
                      </div>

                      {/* Bar Track Background */}
                      <div style={{ width: '100%', height: '12px', background: '#e1e3e5', borderRadius: '6px', overflow: 'hidden', position: 'relative', marginBottom: '12px' }}>
                        <div style={{ width: `${progressPercentage}%`, height: '100%', background: barColor, transition: 'width 0.3s ease-in-out' }} />
                      </div>

                      {/* Display active unlocked goals */}
                      {unlockedMilestones.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {unlockedMilestones.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#008060' }}>
                              <span>✅</span>
                              <span>Unlocked: <strong>{m.rewardText || `Tier $${m.threshold}`}</strong></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dummy Cart Items Area */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #f1f2f4', paddingBottom: '12px' }}>
                        <div style={{ width: '60px', height: '60px', background: '#f1f2f4', borderRadius: '4px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>Simulated Store Item</div>
                          <div style={{ fontSize: '12px', color: '#6d7175', marginTop: '2px' }}>Qty: 1</div>
                          <div style={{ fontWeight: '600', marginTop: '6px', fontSize: '13px' }}>${simulatedCartTotal}</div>
                        </div>
                      </div>
                    </div>

                    {/* Drawer Footer Subtotal Panel */}
                    <div style={{ padding: '16px', borderTop: '1px solid #e1e3e5', background: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold' }}>
                        <span>Subtotal</span>
                        <span>${simulatedCartTotal}.00</span>
                      </div>
                      <button style={{ width: '100%', background: '#008060', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: '600', cursor: 'not-allowed' }}>
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>

                </div>
              </Layout.Section>
            </Layout>
          )}
        </div>
      </Tabs>
    </Page>
  );
}