// src/components/PreviewTab.jsx
import React, { useState } from 'react';
import { Layout, Card, Text, TextField, BlockStack } from '@shopify/polaris';

export default function PreviewTab({ milestones, barColor, textColor }) {
  const [simulatedCartTotal, setSimulatedCartTotal] = useState(40);

  // Math inside the isolated preview component
  const sortedMilestones = [...milestones].sort((a, b) => a.threshold - b.threshold);
  const nextMilestone = sortedMilestones.find(m => simulatedCartTotal < m.threshold);
  const unlockedMilestones = sortedMilestones.filter(m => simulatedCartTotal >= m.threshold);
  
  const maxThreshold = sortedMilestones.length > 0 ? sortedMilestones[sortedMilestones.length - 1].threshold : 100;
  const progressPercentage = Math.min((simulatedCartTotal / (maxThreshold || 1)) * 100, 100);

  return (
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
          
          <div style={{ width: '380px', background: '#ffffff', boxShadow: '0px 4px 20px rgba(0,0,0,0.15)', borderRadius: '4px', display: 'flex', flexDirection: 'column', height: '550px', overflow: 'hidden', border: '1px solid #e1e3e5' }}>
            
            <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#202223' }}>Your Cart Drawer</span>
              <span style={{ cursor: 'pointer', fontSize: '18px', color: '#6d7175' }}>✕</span>
            </div>

            <div style={{ padding: '16px', background: '#fafbfb', borderBottom: '1px solid #e1e3e5' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px', color: textColor, fontWeight: '500', fontSize: '13px' }}>
                {nextMilestone ? (
                  <span>You are <strong>${nextMilestone.threshold - simulatedCartTotal}</strong> away from <strong>{nextMilestone.rewardText || 'next tier'}</strong>!</span>
                ) : (
                  <span>🎉 Congrats! You have unlocked all tier rewards!</span>
                )}
              </div>

              <div style={{ width: '100%', height: '12px', background: '#e1e3e5', borderRadius: '6px', overflow: 'hidden', position: 'relative', marginBottom: '12px' }}>
                <div style={{ width: `${progressPercentage}%`, height: '100%', background: barColor, transition: 'width 0.3s ease-in-out' }} />
              </div>

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
  );
}