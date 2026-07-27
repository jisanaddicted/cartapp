import React, { useState } from 'react';
import { 
  Page, Layout, Card, Text, TextField, 
  Button, BlockStack, InlineStack, Bleed, Divider 
} from '@shopify/polaris';

export default function App() {
  const [barColor, setBarColor] = useState('#008060');
  const [textColor, setTextColor] = useState('#000000');
  const [milestones, setMilestones] = useState([
    { threshold: 50, rewardText: 'Free Shipping!' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = field === 'threshold' ? Number(value) : value;
    setMilestones(updated);
  };

  const addMilestoneRow = () => {
    setMilestones([...milestones, { threshold: 0, rewardText: '' }]);
  };

  const removeMilestoneRow = (index) => {
    const updated = milestones.filter((_, i) => i !== index);
    setMilestones(updated);
  };

  const saveSettings = async () => {
    setLoading(true);
    const payload = {
      barColor,
      textColor,
      milestones: milestones.map(m => ({
        threshold: m.threshold * 100,
        rewardText: m.rewardText
      }))
    };
    console.log("Saving setup payload:", payload);
    setTimeout(() => {
      setLoading(false);
      alert("Settings pushed successfully!");
    }, 1000);
  };

  return (
    <Page title="Milestone Cart Drawer Dashboard">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Configure Reward Milestones</Text>
                <Text as="p" color="subdued">Define spending targets (in dollars) that customers must cross to unlock rewards.</Text>
                <Divider />
                {milestones.map((milestone, index) => (
                  <InlineStack key={index} gap="400" align="space-between" blockAlign="center">
                    <div style={{ flex: 1 }}><TextField label="Spend Threshold ($)" type="number" value={milestone.threshold} onChange={(val) => handleMilestoneChange(index, 'threshold', val)} autoComplete="off" /></div>
                    <div style={{ flex: 2 }}><TextField label="Reward Banner Text" value={milestone.rewardText} onChange={(val) => handleMilestoneChange(index, 'rewardText', val)} placeholder="e.g. Free Shipping unlocked!" autoComplete="off" /></div>
                    <div style={{ paddingTop: '24px' }}><Button tone="critical" variant="plain" onClick={() => removeMilestoneRow(index)}>Remove</Button></div>
                  </InlineStack>
                ))}
                <InlineStack align="start"><Button onClick={addMilestoneRow}>Add New Tier Milestone</Button></InlineStack>
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