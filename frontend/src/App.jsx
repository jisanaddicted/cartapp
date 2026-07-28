import React, { useState, useEffect } from 'react';
import { 
  Page, Layout, Card, Text, TextField, 
  Button, BlockStack, InlineStack, Bleed, Divider, Banner, Spinner
} from '@shopify/polaris';

export default function App() {
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#000000');
  const [milestones, setMilestones] = useState([]);

  // App UI operational feedback states
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  // Helper function to dynamically grab an App Bridge session token
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
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const resData = await response.json();
        if (response.ok && resData.success && resData.data) {
          setBarColor(resData.data.barColor || '#008060');
          setTextColor(resData.data.textColor || '#000000');
          
          // Map MongoDB schema array values smoothly back into React structure
          if (resData.data.milestones && resData.data.milestones.length > 0) {
            setMilestones(resData.data.milestones.map(m => ({
              threshold: m.threshold,
              rewardText: m.rewardText,
              iconUrl: m.iconUrl || 'https://cdn.shopify.com/s/files/1/0000/0000/files/gift.png'
            })));
          } else {
            // Seed a clean row if data collection arrays return blank
            setMilestones([{ threshold: 50, rewardText: '', iconUrl: 'https://cdn.shopify.com/s/files/1/0000/0000/files/gift.png' }]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch configurations from server database:", err);
      } finally {
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
        setBanner({
          type: 'success',
          title: 'Configuration successfully synchronized to Render & MongoDB!'
        });
      } else {
        setBanner({
          type: 'critical',
          title: 'Failed to synchronize setups',
          message: data.error || 'Server rejected settings update validation.'
        });
      }
    } catch (err) {
      setBanner({
        type: 'critical',
        title: 'Network Communication Error',
        message: 'Could not communicate with your live Render backend server instance.'
      });
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
    <Page title="Milestone Cart Drawer Dashboard">
      <Layout>
        {banner && (
          <Layout.Section>
            <Banner title={banner.title} tone={banner.type} onDismiss={() => setBanner(null)}>
              {banner.message && <p>{banner.message}</p>}
            </Banner>
          </Layout.Section>
        )}

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
                        {/* Inline Delete Button Pattern */}
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
    </Page>
  );
}