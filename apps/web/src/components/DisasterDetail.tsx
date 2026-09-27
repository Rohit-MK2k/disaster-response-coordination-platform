import React, { useEffect, useState } from 'react';
import { Disaster } from '@drp/shared-types';
import { apiClient } from '../api';

export const DisasterDetail = ({ id, userRole, onBack }: { id: string; userRole: string; onBack: () => void }) => {
  const [disaster, setDisaster] = useState<Disaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDisaster = async () => {
      try {
        const res = await apiClient.get(`/disasters/${id}`);
        setDisaster(res.data);
      } catch (e) {
        setError('Failed to load disaster details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDisaster();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/disasters/${id}`);
      onBack();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Permission Denied: You do not have admin rights to delete this record.');
      } else {
        setError('Failed to delete disaster.');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!disaster) return <div>{error} <button onClick={onBack}>Back</button></div>;

  return (
    <div>
      <button onClick={onBack}>← Back to Board</button>
      <h2>{disaster.title}</h2>
      <p><strong>Description:</strong> {disaster.description}</p>
      <p><strong>Location:</strong> {disaster.location_name} ({disaster.location_lat}, {disaster.location_lng})</p>
      <p><strong>Tags:</strong> {disaster.tags.join(', ')}</p>
      <p><strong>Status:</strong> {disaster.status}</p>
      
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      
      {userRole === 'admin' && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleDelete} style={{ background: 'red', color: 'white' }}>Delete Disaster</button>
        </div>
      )}
    </div>
  );
};
