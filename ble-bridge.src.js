/* ══════════════════════════════════════════════════════════════
   Puente Bluetooth LE nativo — Estacionamiento El Paso
   Envuelve @capacitor-community/bluetooth-le y lo expone en
   window.ElPasoBLE con una API mínima, lista para usarse desde
   index.html sin necesidad de bundler/import en tiempo de ejecución.
   Solo se usa dentro del APK (Capacitor); en navegador normal la
   app sigue usando Web Bluetooth (navigator.bluetooth) como antes.
   ══════════════════════════════════════════════════════════════ */
import { BleClient } from '@capacitor-community/bluetooth-le';

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await BleClient.initialize({ androidNeverForLocation: true });
    initialized = true;
  }
}

async function requestDevice(services) {
  await ensureInit();
  return BleClient.requestDevice({
    services,
    optionalServices: services,
    allowDuplicates: false,
  });
}

async function connect(deviceId, onDisconnect) {
  await ensureInit();
  await BleClient.connect(deviceId, onDisconnect);
}

async function disconnect(deviceId) {
  try { await BleClient.disconnect(deviceId); } catch (e) { /* ya desconectado */ }
}

/* Busca la primera característica escribible entre los servicios/uuids candidatos,
   igual que hacía findWriteCharacteristic() con Web Bluetooth. */
async function findWritable(deviceId, serviceUUIDs, charUUIDs) {
  const services = await BleClient.getServices(deviceId);
  for (const svcUUID of serviceUUIDs) {
    const svc = services.find(s => s.uuid.toLowerCase() === svcUUID.toLowerCase());
    if (!svc) continue;
    for (const chrUUID of charUUIDs) {
      const chr = svc.characteristics.find(c => c.uuid.toLowerCase() === chrUUID.toLowerCase());
      if (chr && (chr.properties.write || chr.properties.writeWithoutResponse)) {
        return { service: svc.uuid, characteristic: chr.uuid, writeWithoutResponse: !!chr.properties.writeWithoutResponse };
      }
    }
    // cualquier característica escribible del servicio
    const any = svc.characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
    if (any) {
      return { service: svc.uuid, characteristic: any.uuid, writeWithoutResponse: !!any.properties.writeWithoutResponse };
    }
  }
  return null;
}

async function write(deviceId, service, characteristic, bytes, writeWithoutResponse) {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (writeWithoutResponse) {
    await BleClient.writeWithoutResponse(deviceId, service, characteristic, dataView);
  } else {
    await BleClient.write(deviceId, service, characteristic, dataView);
  }
}

window.ElPasoBLE = { requestDevice, connect, disconnect, findWritable, write };
