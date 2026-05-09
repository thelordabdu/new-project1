# v0: BLE data collection proof

**Goal:** Connect to a Whoop or Garmin over Bluetooth, capture raw R-R intervals, log them.  
**Success criteria:** R-R interval stream visible in console. Numbers make sense (273ms–2000ms range).  
**No UI. No DB. No auth. No API. Just BLE.**

---

## What we're capturing and why

**R-R intervals** — the time in milliseconds between consecutive heartbeats. This is the raw signal that everything else derives from:

- HRV (RMSSD) — computed from R-R intervals
- Resting HR — average R-R interval inverted
- Respiratory rate — frequency modulation of R-R intervals
- Our recovery score — weighted formula using HRV + HR + sleep
- Our strain score — time spent in HR zones derived from R-R

This is the most important signal. Get this right and everything else follows.

---

## How BLE HR broadcasting works

Both Whoop and Garmin support the **standard Bluetooth Heart Rate Profile**:

- **Service UUID:** `0x180D` (Heart Rate)
- **Characteristic UUID:** `0x2A37` (Heart Rate Measurement)

The characteristic sends notifications (pushes data to you automatically) containing:

```
Byte 0: Flags
  Bit 0: HR format (0 = uint8, 1 = uint16)
  Bit 3: Energy expended present
  Bit 4: R-R intervals present ← this is what we need

Byte 1 (or 1-2): Heart rate value

If bit 4 set — R-R intervals follow as uint16 values
  Units: 1/1024 seconds
  Convert to ms: rr_ms = (raw_value / 1024) * 1000
```

**To get R-R intervals:** the device must have HR Broadcast enabled AND be in an active state (worn, recording). Idle devices may not send R-R data.

### Enable HR Broadcast
- **Whoop:** App → Profile → Device Settings → Heart Rate Broadcast → ON
- **Garmin:** Settings → Sensors & Accessories → Wrist HR → Broadcast HR → ON (varies by model)

---

## v0 implementation: Next.js test page

Web Bluetooth works in Chrome and Edge only (not Firefox, not Safari). That's fine for v0.

### Step 1: Create the test page

Create `app/(app)/test-ble/page.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';

interface RRSample {
  ts: number;
  hr: number;
  rr_intervals: number[]; // in ms
}

export default function BLETestPage() {
  const [status, setStatus] = useState('idle');
  const [samples, setSamples] = useState<RRSample[]>([]);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const bufferRef = useRef<RRSample[]>([]);

  async function connect() {
    try {
      setStatus('requesting device...');

      const dev = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });

      setStatus(`connecting to ${dev.name}...`);
      const server = await dev.gatt!.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleData);

      setDevice(dev);
      setStatus(`connected: ${dev.name}`);
    } catch (err) {
      setStatus(`error: ${(err as Error).message}`);
    }
  }

  function handleData(event: Event) {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const flags = value.getUint8(0);
    const hr16bit = flags & 0x1;

    // Parse heart rate
    const hr = hr16bit ? value.getUint16(1, true) : value.getUint8(1);

    // Parse R-R intervals
    const rrIntervals: number[] = [];
    const hasEnergyExpended = flags & 0x8;
    const hasRR = flags & 0x10;

    if (hasRR) {
      let offset = hr16bit ? 3 : 2;
      if (hasEnergyExpended) offset += 2;

      while (offset + 1 < value.byteLength) {
        const raw = value.getUint16(offset, true);
        const rr_ms = Math.round((raw / 1024) * 1000);
        rrIntervals.push(rr_ms);
        offset += 2;
      }
    }

    const sample: RRSample = {
      ts: Date.now(),
      hr,
      rr_intervals: rrIntervals,
    };

    bufferRef.current = [...bufferRef.current.slice(-99), sample];
    setSamples([...bufferRef.current]);

    // Log to console for inspection
    console.log('BLE sample:', sample);
  }

  async function disconnect() {
    device?.gatt?.disconnect();
    setDevice(null);
    setStatus('disconnected');
  }

  // Quick RMSSD calculation on collected samples
  function computeRMSSD(): string {
    const allRR = samples.flatMap(s => s.rr_intervals);
    if (allRR.length < 2) return 'not enough data';
    const diffs = allRR.slice(1).map((v, i) => Math.pow(v - allRR[i], 2));
    const rmssd = Math.sqrt(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    return rmssd.toFixed(1) + ' ms';
  }

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>BLE Test — R-R Intervals</h1>
      <p>Status: {status}</p>

      <button onClick={connect} disabled={!!device}>Connect Device</button>
      <button onClick={disconnect} disabled={!device} style={{ marginLeft: 8 }}>Disconnect</button>

      {samples.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p><strong>Samples collected:</strong> {samples.length}</p>
          <p><strong>Latest HR:</strong> {samples[samples.length - 1].hr} bpm</p>
          <p><strong>Latest R-R intervals:</strong> {samples[samples.length - 1].rr_intervals.join(', ')} ms</p>
          <p><strong>Computed RMSSD (HRV):</strong> {computeRMSSD()}</p>

          <details style={{ marginTop: 16 }}>
            <summary>Raw sample log (last 100)</summary>
            <pre style={{ fontSize: 11, maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(samples, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Run it

```bash
npm run dev
# Open http://localhost:3000/test-ble in Chrome
# Make sure your Whoop or Garmin has HR Broadcast enabled
# Click Connect Device → select your device from the browser picker
```

### Step 3: Validate the numbers

While connected, open your Whoop app or Garmin Connect. Compare:
- Our HR reading vs what the app shows → should match within 1-2 BPM
- Our RMSSD (HRV) vs what Whoop shows in recovery → may differ (Whoop computes HRV overnight, not in real-time), but the order of magnitude should be close

---

## v0 success checklist

- [ ] HR Broadcast enabled on Whoop
- [ ] Chrome open on `localhost:3000/test-ble`
- [ ] Device paired and connected via browser picker
- [ ] HR values appearing and making sense (40–200 BPM range)
- [ ] R-R intervals appearing (273–2000ms range)
- [ ] RMSSD computed from collected R-R intervals
- [ ] Raw sample log exported to JSON (copy from the `<pre>` block)
- [ ] Compare HR reading to Whoop app — within 2 BPM?

---

## What to document after v0

Create `docs/v0/findings.md` and record:

1. Which device you connected (Whoop 4.0 / 5.0, Garmin model)
2. Does it broadcast R-R intervals? (some devices/modes don't)
3. Sample rate — how many packets per second?
4. Any gaps or dropouts observed?
5. RMSSD value vs Whoop app HRV — how close?
6. Any unexpected data in the BLE packets?

This doc becomes the ground truth for v0.1 signal processing work.

---

## Common issues

**"Bluetooth not available"**
- Must use Chrome or Edge. Firefox and Safari don't support Web Bluetooth.
- Must be on HTTPS or localhost.

**"No devices found"**
- HR Broadcast must be enabled in the Whoop/Garmin app settings.
- Device must be worn and actively measuring (not idle).
- Bluetooth must be enabled on your computer.

**R-R intervals array is empty**
- Bit 4 of the flags byte is not set → device is not sending R-R data.
- Try starting a workout on the device — active mode is more likely to include R-R.
- Some Garmin models only broadcast R-R during an active recorded activity.

**RMSSD looks wrong**
- Check for motion artifacts — sit still while testing.
- Filter out values outside 273–2000ms range before computing.
