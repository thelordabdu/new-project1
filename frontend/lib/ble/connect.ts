/**
 * connect.ts
 * Web Bluetooth API wrapper — device connection + GATT setup.
 * Chrome/Edge only. Not supported in Firefox or Safari.
 */

export interface BLESample {
  ts: number
  hr: number
  rr_intervals: number[] // milliseconds
}

type SampleHandler = (sample: BLESample) => void

export async function connectBLEDevice(onSample: SampleHandler): Promise<BluetoothDevice> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }],
  })

  const server = await device.gatt!.connect()
  const service = await server.getPrimaryService('heart_rate')
  const characteristic = await service.getCharacteristic('heart_rate_measurement')

  await characteristic.startNotifications()
  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const sample = parseHRMCharacteristic(event)
    if (sample) onSample(sample)
  })

  return device
}

function parseHRMCharacteristic(event: Event): BLESample | null {
  const value = (event.target as BluetoothRemoteGATTCharacteristic).value
  if (!value) return null

  const flags = value.getUint8(0)
  const hr16bit = flags & 0x1
  const hasEnergy = flags & 0x8
  const hasRR = flags & 0x10

  const hr = hr16bit ? value.getUint16(1, true) : value.getUint8(1)

  const rrIntervals: number[] = []
  if (hasRR) {
    let offset = hr16bit ? 3 : 2
    if (hasEnergy) offset += 2
    while (offset + 1 < value.byteLength) {
      const raw = value.getUint16(offset, true)
      rrIntervals.push(Math.round((raw / 1024) * 1000))
      offset += 2
    }
  }

  return { ts: Date.now(), hr, rr_intervals: rrIntervals }
}
