import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { apiClient } from './api';
import { AuthenticatedUser } from '@drp/shared-types';

const socket = io('http://localhost:3000');

export const App = () => {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Check health on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      apiClient.get('/health')
        .then(res => {
          if (res.data.user) setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          setUser(null);
        });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, role, name, id } = res.data;
      localStorage.setItem('authToken', token);
      setUser({ id, role }); // In a real app we'd have the full auth user
      setError('');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#eee' }}>
        <h2>Disaster Response Platform</h2>
        {user && (
          <div>
            <span>Role: <strong>{user.role}</strong></span>
            <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
          </div>
        )}
      </header>

      <main style={{ padding: '20px' }}>
        <p>Real-time Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>

        {!user ? (
          <div>
            <h3>Login</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '200px', gap: '10px' }}>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit">Login</button>
            </form>
            <p><small>Hint: admin@example.com / password123</small></p>
          </div>
        ) : (
          <div>
            <h3>Welcome!</h3>
            <p>You are logged in as a <strong>{user.role}</strong>.</p>
            {user.role === 'admin' ? (
              <p>You have full access to create, edit, and delete.</p>
            ) : (
              <p>You can create and edit, but you cannot delete.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

