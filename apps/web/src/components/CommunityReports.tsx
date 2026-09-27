import React, { useState, useEffect } from 'react';
import { apiClient } from '../api';
import { Report } from '@drp/shared-types';

interface CommunityReportsProps {
  disasterId: string;
}

export const CommunityReports: React.FC<CommunityReportsProps> = ({ disasterId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchReports = async (pageNum: number, isRefresh: boolean = false) => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ reports: Report[]; total: number }>(
        `/disasters/${disasterId}/reports?page=${pageNum}&limit=5`
      );
      if (pageNum === 1 || isRefresh) {
        setReports(res.data.reports);
      } else {
        setReports((prev) => [...prev, ...res.data.reports]);
      }
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [disasterId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReports(nextPage);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchReports(1, true);
  };

  if (loading && reports.length === 0) {
    return <div className="text-gray-500 italic mt-4">Loading community chatter...</div>;
  }

  if (!loading && reports.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Live Community Chatter</h3>
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>
        <p className="text-gray-500 italic">No community reports available right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md mt-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Live Community Chatter</h3>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="mb-2">
              <div className="font-bold text-gray-900">@{report.user}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{report.content}</p>
          </div>
        ))}
      </div>
      
      {reports.length < total && (
        <button 
          onClick={loadMore}
          disabled={loading}
          className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
