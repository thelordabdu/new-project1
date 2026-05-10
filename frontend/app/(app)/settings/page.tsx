'use client';

import { useState } from 'react';
import { connectWhoop } from '@/services/connections.service';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnectWhoop() {
    setLoading(true);
    setError(null);
    try {
      // TODO(v0.9): replace with real user ID from Supabase auth session
      const userId = process.env.NEXT_PUBLIC_DEV_USER_ID ?? '';
      if (!userId) {
        setError('NEXT_PUBLIC_DEV_USER_ID not set in .env.local');
        return;
      }
      await connectWhoop(userId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 32, fontFamily: 'monospace', maxWidth: 480 }}>
      <h1 style={{ marginBottom: 24 }}>Settings</h1>

      <section>
        <h2 style={{ marginBottom: 12, fontSize: 16 }}>Connected devices</h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>Whoop</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
              Recovery · Sleep · HRV · Strain
            </p>
          </div>

          <button
            onClick={handleConnectWhoop}
            disabled={loading}
            style={{
              padding: '8px 18px',
              background: loading ? '#555' : '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {loading ? 'Redirecting…' : 'Connect Whoop'}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 12, color: '#c00', fontSize: 13 }}>{error}</p>
        )}
      </section>
    </main>
  );
}
