import React, { useState } from 'react';
import { Layout, Card, Text, TextField, BlockStack } from '@shopify/polaris';

export default function PreviewTab({ milestones, barColor, textColor }) {
  const [simulatedCartTotal, setSimulatedCartTotal] = useState(40);

  // 1. Sort milestones ascendingly so the progress track flows naturally
  const sortedMilestones = [...milestones].sort((a, b) => a.threshold - b.threshold);
  
  // Find operational limits
  const maxThreshold = sortedMilestones.length > 0 ? sortedMilestones[sortedMilestones.length - 1].threshold : 100;
  const progressPercentage = Math.min((simulatedCartTotal / (maxThreshold || 1)) * 100, 100);
  
  const nextMilestone = sortedMilestones.find(m => simulatedCartTotal < m.threshold);

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
          
          <div style={{ width: '380px', background: '#ffffff', boxShadow: '0px 4px 20px rgba(0,0,0,0.15)', borderRadius: '4px', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden', border: '1px solid #e1e3e5' }}>
            
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#202223' }}>Your Cart Drawer</span>
              <span style={{ cursor: 'pointer', fontSize: '18px', color: '#6d7175' }}>✕</span>
            </div>

            {/* Dynamic Interactive Progress Area */}
            <div style={{ padding: '24px 20px 32px 20px', background: '#fafbfb', borderBottom: '1px solid #e1e3e5' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px', color: textColor, fontWeight: '500', fontSize: '13px' }}>
                {nextMilestone ? (
                  <span>You are <strong>${nextMilestone.threshold - simulatedCartTotal}</strong> away from <strong>{nextMilestone.rewardText || 'next tier'}</strong>!</span>
                ) : (
                  <span>🎉 Congrats! You have unlocked all tier rewards!</span>
                )}
              </div>

              {/* Progress Bar Track Wrapper Container */}
              <div style={{ position: 'relative', width: '100%', height: '8px', background: '#e1e3e5', borderRadius: '4px', marginBottom: '40px', marginTop: '16px' }}>
                
                {/* Colored Progress Fill Bar Line */}
                <div style={{ width: `${progressPercentage}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.3s ease-in-out' }} />

                {/* Plot Icons Across the Line via Map Loops */}
                {sortedMilestones.map((milestone, index) => {
                  // Calculate relative location on the line axis
                  const milestonePct = Math.min((milestone.threshold / (maxThreshold || 1)) * 100, 100);
                  const isUnlocked = simulatedCartTotal >= milestone.threshold;

                  return (
                    <div 
                      key={index} 
                      style={{ 
                        position: 'absolute', 
                        left: `${milestonePct}%`, 
                        top: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        zIndex: 2
                      }}
                    >
                      {/* Icon Circle Frame Bubble */}
                      <div 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: isUnlocked ? barColor : '#ffffff', 
                          border: `2px solid ${isUnlocked ? barColor : '#c9cccf'}`, 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          position: 'relative',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                          transition: 'background-color 0.3s, border-color 0.3s'
                        }}
                      >
                        {/* Image inside bubble */}
                        <img 
                          src={milestone.iconUrl || 'https://cdn.shopify.com/s/files/1/0000/0000/files/gift.png'} 
                          alt="reward status icon" 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            objectFit: 'contain',
                            filter: isUnlocked ? 'brightness(0) invert(1)' : 'none' 
                          }} 
                        />

                        {/* Overlapping Status Badge Indicator */}
                        {isUnlocked && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              top: '-6px', 
                              right: '-6px', 
                              background: '#008060', 
                              color: '#ffffff', 
                              borderRadius: '50%', 
                              width: '16px', 
                              height: '16px', 
                              fontSize: '10px', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              border: '1.5px solid #ffffff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>

                      {/* Threshold Price Target Display Box under the Bubble */}
                      <div 
                        style={{ 
                          marginTop: '6px', 
                          fontSize: '11px', 
                          fontWeight: isUnlocked ? '600' : '400', 
                          color: isUnlocked ? barColor : '#6d7175',
                          whiteSpace: 'nowrap',
                          position: 'absolute',
                          top: '36px'
                        }}
                      >
                        ${milestone.threshold}
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

            {/* Cart Product Items */}
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

            {/* Checkout Footer */}
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