import React, { useEffect, useState } from 'react';
import { Disaster } from '@drp/shared-types';
import { apiClient } from '../api';

import { NearbyResources } from './NearbyResources';
import { CommunityReports } from './CommunityReports';

export const DisasterDetail = ({ id, userRole, onBack }: { id: string; userRole: string; onBack: () => void }) => {
  const [disaster, setDisaster] = useState<Disaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{ description: string; status: string }>({ description: '', status: '' });

  useEffect(() => {
    let isMounted = true;
    
    const fetchDisaster = async () => {
      try {
        const res = await apiClient.get(`/disasters/${id}`);
        if (isMounted) {
          setDisaster(res.data);
          // Only update edit form data if we are NOT currently editing
          setEditData(prev => isEditing ? prev : { description: res.data.description, status: res.data.status });
        }
      } catch (e: any) {
        if (e.response?.status === 404) {
          // If the disaster was deleted by someone else, kick the user back to the board
          onBack();
        } else if (isMounted) {
          setError('Failed to load disaster details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchDisaster();

    const intervalId = setInterval(() => {
      fetchDisaster();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [id, onBack, isEditing]);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.patch(`/disasters/${id}`, editData);
      setDisaster(res.data);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update disaster.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!disaster) return <div>{error} <button onClick={onBack}>Back</button></div>;

  return (
    <div>
      <button onClick={onBack}>← Back to Board</button>
      <h2>{disaster.title}</h2>

      {isEditing ? (
        <form onSubmit={handleUpdate} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Description:</label>
            <textarea 
              value={editData.description} 
              onChange={e => setEditData({...editData, description: e.target.value})}
              style={{ width: '100%', minHeight: '80px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Status:</label>
            <select 
              value={editData.status} 
              onChange={e => setEditData({...editData, status: e.target.value})}
              style={{ width: '100%', padding: '5px', marginTop: '5px' }}
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button type="submit" style={{ background: 'blue', color: 'white', padding: '5px 15px', marginRight: '10px' }}>Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <>
          <p><strong>Description:</strong> {disaster.description}</p>
          <p><strong>Location:</strong> {disaster.location_name} ({disaster.location_lat}, {disaster.location_lng})</p>
          <p><strong>Tags:</strong> {disaster.tags.join(', ')}</p>
          <p><strong>Status:</strong> {disaster.status}</p>
          <button onClick={() => setIsEditing(true)} style={{ marginBottom: '20px', padding: '5px 15px' }}>Edit Disaster</button>
        </>
      )}

      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      
      <NearbyResources disasterId={id} />
      <CommunityReports disasterId={id} />

      {userRole === 'admin' && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleDelete} style={{ background: 'red', color: 'white' }}>Delete Disaster (Admin)</button>
        </div>
      )}
    </div>
  );
};
