import React, { useEffect, useState } from 'react';
import { Disaster } from '@drp/shared-types';
import { apiClient } from '../api';
import { ReportDisasterForm } from './ReportDisasterForm';

export const DisasterBoard = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReporting, setIsReporting] = useState(false);

  const fetchDisasters = async () => {
    try {
      const res = await apiClient.get('/disasters');
      setDisasters(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  if (loading) return <div>Loading disasters...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Active Disasters</h3>
        {!isReporting && (
          <button onClick={() => setIsReporting(true)} style={{ background: 'green', color: 'white', padding: '10px' }}>
            + Report Incident
          </button>
        )}
      </div>

      {isReporting && (
        <ReportDisasterForm 
          onCreated={() => {
            setIsReporting(false);
            fetchDisasters();
          }} 
          onCancel={() => setIsReporting(false)} 
        />
      )}

      {disasters.length === 0 ? <p>No disasters logged.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {disasters.map(d => (
            <li key={d.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <h4>{d.title}</h4>
              <p>Status: {d.status} | Location: {d.location_name}</p>
              <button onClick={() => onSelect(d.id)}>View Details</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
