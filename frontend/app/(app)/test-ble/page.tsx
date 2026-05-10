'use client';

import { useRef, useState } from 'react';
import { cleanRR } from '@/lib/signal/filter';
import { computeRMSSD, packetRMSSD } from '@/lib/signal/metrics';

const BUFFER_SIZE = 100;
const ROLLING_WINDOW = 10;
const GAP_THRESHOLD_MS = 2000;
const QUALITY_WARN = 80;

interface RRSample {
  ts: number;
  hr: number;
  rr_intervals: number[]; // post-filter
  raw_rr_count: number;   // before filter
  gap: boolean;           // ts delta from previous sample >2000ms
}

export default function BLETestPage() {
  const [status, setStatus] = useState('idle');
  const [samples, setSamples] = useState<RRSample[]>([]);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  const bufferRef = useRef<RRSample[]>([]);
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const rollingRef = useRef<number[]>([]);
  const rawTotalRef = useRef(0);
  const filteredTotalRef = useRef(0);
  // Prevents auto-reconnect when the user intentionally disconnects
  const intentionalDisconnectRef = useRef(false);

  function handleData(event: Event) {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const flags = value.getUint8(0);
    const hr16bit = flags & 0x1;
    const hr = hr16bit ? value.getUint16(1, true) : value.getUint8(1);

    const rawRR: number[] = [];
    if (flags & 0x10) {
      let offset = hr16bit ? 3 : 2;
      if (flags & 0x8) offset += 2;
      while (offset + 1 < value.byteLength) {
        rawRR.push(Math.round((value.getUint16(offset, true) / 1024) * 1000));
        offset += 2;
      }
    }

    const cleanedRR = cleanRR(rawRR);
    rawTotalRef.current += rawRR.length;
    filteredTotalRef.current += cleanedRR.length;

    const now = Date.now();
    const prev = bufferRef.current[bufferRef.current.length - 1];
    const gap = prev !== undefined && now - prev.ts > GAP_THRESHOLD_MS;

    const sample: RRSample = {
      ts: now,
      hr,
      rr_intervals: cleanedRR,
      raw_rr_count: rawRR.length,
      gap,
    };

    bufferRef.current = [...bufferRef.current.slice(-(BUFFER_SIZE - 1)), sample];

    const pRMSSD = packetRMSSD(cleanedRR);
    if (pRMSSD !== null) {
      rollingRef.current = [...rollingRef.current.slice(-(ROLLING_WINDOW - 1)), pRMSSD];
    }

    setSamples([...bufferRef.current]);
    console.log('BLE sample:', sample);
  }

  async function subscribeToCharacteristic(server: BluetoothRemoteGATTServer) {
    const service = await server.getPrimaryService('heart_rate');
    const char = await service.getCharacteristic('heart_rate_measurement');
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', handleData);
    characteristicRef.current = char;
  }

  async function handleDisconnect() {
    if (intentionalDisconnectRef.current) {
      intentionalDisconnectRef.current = false;
      return;
    }
    const dev = deviceRef.current;
    if (!dev) return;
    setStatus('reconnecting...');
    setReconnecting(true);
    try {
      const server = await dev.gatt!.connect();
      await subscribeToCharacteristic(server);
      setStatus(`reconnected: ${dev.name}`);
    } catch {
      setStatus('disconnected — reconnect failed, connect manually');
      setDevice(null);
      deviceRef.current = null;
    } finally {
      setReconnecting(false);
    }
  }

  async function connect() {
    try {
      setStatus('requesting device...');
      const dev = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });
      setStatus(`connecting to ${dev.name}...`);
      const server = await dev.gatt!.connect();
      await subscribeToCharacteristic(server);
      dev.addEventListener('gattserverdisconnected', handleDisconnect);
      deviceRef.current = dev;
      setDevice(dev);
      setStatus(`connected: ${dev.name}`);
    } catch (err) {
      setStatus(`error: ${(err as Error).message}`);
    }
  }

  function disconnect() {
    intentionalDisconnectRef.current = true;
    deviceRef.current?.gatt?.disconnect();
    deviceRef.current = null;
    setDevice(null);
    setStatus('disconnected');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(bufferRef.current, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ble-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Derived display values — computed fresh on every render triggered by setSamples
  const quality =
    rawTotalRef.current > 0
      ? (filteredTotalRef.current / rawTotalRef.current) * 100
      : 100;

  const rollingRMSSD =
    rollingRef.current.length > 0
      ? rollingRef.current.reduce((a, b) => a + b, 0) / rollingRef.current.length
      : null;

  // Global RMSSD: pool within-packet diffs from all non-gap samples in the buffer
  const nonGapPackets = samples.filter(s => !s.gap).map(s => s.rr_intervals);
  const globalRMSSD = computeRMSSD(nonGapPackets);

  const last = samples[samples.length - 1];
  const poorSignal = quality < QUALITY_WARN && rawTotalRef.current > 0;

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', maxWidth: 640 }}>
      <h1 style={{ marginBottom: 4 }}>BLE Test — R-R Intervals</h1>
      <p style={{ marginBottom: 16, color: reconnecting ? '#c80' : '#555' }}>
        Status: {status}
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={connect}
          disabled={!!device || reconnecting}
          style={btn(!device && !reconnecting)}
        >
          Connect Device
        </button>
        <button
          onClick={disconnect}
          disabled={!device}
          style={btn(!!device, '#c00')}
        >
          Disconnect
        </button>
        <button
          onClick={exportData}
          disabled={samples.length === 0}
          style={btn(samples.length > 0, '#006')}
        >
          Export JSON
        </button>
      </div>

      {samples.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {/* Signal quality */}
          <div
            style={{
              marginBottom: 12,
              padding: '8px 12px',
              background: poorSignal ? '#fff0f0' : '#f0fff0',
              border: `1px solid ${poorSignal ? '#f99' : '#9f9'}`,
              borderRadius: 6,
            }}
          >
            <strong>Signal quality:</strong> {quality.toFixed(1)}%
            {poorSignal && (
              <span style={{ color: '#c00', marginLeft: 8 }}>
                ⚠ poor signal — sit still
              </span>
            )}
            <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
              ({filteredTotalRef.current}/{rawTotalRef.current} R-R passed filter)
            </span>
          </div>

          {/* Key metrics */}
          <p>
            <strong>Samples collected:</strong> {samples.length}
          </p>
          <p>
            <strong>Latest HR:</strong> {last.hr} bpm
          </p>
          <p>
            <strong>Latest R-R (cleaned):</strong>{' '}
            {last.rr_intervals.length > 0
              ? last.rr_intervals.join(', ') + ' ms'
              : '— (all filtered)'}
            {last.gap && (
              <span style={{ color: '#c80', marginLeft: 8 }}>⚠ gap</span>
            )}
          </p>

          {/* RMSSD */}
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: '#f8f8f8',
              border: '1px solid #ddd',
              borderRadius: 6,
            }}
          >
            <p style={{ margin: '0 0 4px' }}>
              <strong>Rolling RMSSD</strong>{' '}
              <span style={{ color: '#888', fontSize: 12 }}>
                (avg of last {rollingRef.current.length} packets)
              </span>
              :{' '}
              {rollingRMSSD !== null
                ? rollingRMSSD.toFixed(1) + ' ms'
                : 'not enough data'}
            </p>
            <p style={{ margin: 0, color: '#555' }}>
              <strong>Session RMSSD</strong>{' '}
              <span style={{ color: '#888', fontSize: 12 }}>
                (all non-gap samples)
              </span>
              :{' '}
              {globalRMSSD > 0 ? globalRMSSD.toFixed(1) + ' ms' : 'not enough data'}
            </p>
          </div>

          {/* Raw log */}
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer' }}>
              Raw sample log (last {samples.length})
            </summary>
            <pre
              style={{
                fontSize: 11,
                maxHeight: 400,
                overflow: 'auto',
                marginTop: 8,
                background: '#f4f4f4',
                padding: 8,
                borderRadius: 4,
              }}
            >
              {JSON.stringify(samples, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function btn(active: boolean, color = '#000'): React.CSSProperties {
  return {
    padding: '8px 16px',
    background: active ? color : '#555',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: active ? 'pointer' : 'not-allowed',
    fontSize: 14,
  };
}
