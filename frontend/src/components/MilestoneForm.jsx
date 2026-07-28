import React, { useState } from 'react';

export default function MilestoneForm() {
  const [targetAmount, setTargetAmount] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeIconUrl, setPrizeIconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Automatically get the shop domain from the current browser URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const shopDomain = urlParams.get('shop') || 'test-store.myshopify.com';

    const payload = {
      shopDomain,
      targetAmount: Number(targetAmount),
      prizeName,
      prizeIconUrl,
    };

    try {
      // Connects directly to your Express route: router.post('/api/milestones', ...)
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: `Successfully saved milestone: ${prizeName}!` });
        setTargetAmount('');
        setPrizeName('');
        setPrizeIconUrl('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save milestone.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to the backend server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Create New Milestone</h2>
      
      {message.text && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#e6f4ea' : '#fce8e6',
          color: message.type === 'success' ? '#137333' : '#c5221f'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Target Amount ($):</label>
          <input 
            type="number" 
            value={targetAmount} 
            onChange={(e) => setTargetAmount(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Prize Name:</label>
          <input 
            type="text" 
            value={prizeName} 
            onChange={(e) => setPrizeName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Prize Icon URL:</label>
          <input 
            type="url" 
            value={prizeIconUrl} 
            onChange={(e) => setPrizeIconUrl(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#008060', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Saving to Database...' : 'Save Milestone'}
        </button>
      </form>
    </div>
  );
}