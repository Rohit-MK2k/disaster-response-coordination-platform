import React, { useState } from 'react';
import { apiClient } from '../api';

export const ReportDisasterForm = ({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please describe the disaster.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await apiClient.post('/disasters', { text });
      setText('');
      onCreated();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to report incident.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
      <h3>Report an Incident</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="E.g., Huge flood in downtown Manhattan..."
          rows={4}
          disabled={loading}
          style={{ width: '100%', padding: '10px' }}
        />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={{ background: 'blue', color: 'white', padding: '10px' }}>
            {loading ? 'Analyzing & Reporting...' : 'Report'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading} style={{ padding: '10px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
