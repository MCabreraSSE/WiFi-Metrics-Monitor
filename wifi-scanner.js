const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Detecta el sistema operativo y ejecuta el comando apropiado
 */
async function getConnectionInfo() {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      return await getWindowsWiFiInfo();
    } else if (platform === 'darwin') {
      return await getMacOSWiFiInfo();
    } else if (platform === 'linux') {
      return await getLinuxWiFiInfo();
    } else {
      throw new Error('Sistema operativo no soportado');
    }
  } catch (error) {
    console.error('Error obteniendo información WiFi:', error);
    throw error;
  }
}

/**
 * Windows - Usa netsh
 */
async function getWindowsWiFiInfo() {
  const { stdout } = await execPromise('netsh wlan show interfaces');
  
  const parseValue = (key) => {
    const regex = new RegExp(`${key}\\s*:\\s*(.+)`, 'i');
    const match = stdout.match(regex);
    return match ? match[1].trim() : 'N/A';
  };

  return {
    ssid: parseValue('SSID'),
    bssid: parseValue('BSSID'),
    signal: parseValue('Signal'),
    rssi: calculateRSSI(parseValue('Signal')),
    channel: parseValue('Channel'),
    band: parseValue('Radio type'),
    security: parseValue('Authentication'),
    receiveRate: parseValue('Receive rate'),
    transmitRate: parseValue('Transmit rate'),
    timestamp: Date.now()
  };
}

/**
 * macOS - Usa airport utility
 */
async function getMacOSWiFiInfo() {
  const airportPath = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
  const { stdout } = await execPromise(`${airportPath} -I`);
  
  const parseValue = (key) => {
    const regex = new RegExp(`${key}:\\s*(.+)`, 'i');
    const match = stdout.match(regex);
    return match ? match[1].trim() : 'N/A';
  };

  const rssi = parseInt(parseValue('agrCtlRSSI')) || -70;
  const noise = parseInt(parseValue('agrCtlNoise')) || -90;

  return {
    ssid: parseValue('SSID'),
    bssid: parseValue('BSSID'),
    rssi: rssi,
    snr: rssi - noise,
    noise: noise,
    channel: parseValue('channel'),
    band: parseValue('channel').includes('2.4') ? '2.4 GHz' : '5 GHz',
    security: parseValue('link auth'),
    transmitRate: parseValue('lastTxRate'),
    timestamp: Date.now()
  };
}

/**
 * Linux - Usa iwconfig y nmcli
 */
async function getLinuxWiFiInfo() {
  try {
    // Intentar con nmcli primero (NetworkManager)
    const { stdout: nmcliOut } = await execPromise('nmcli -t -f active,ssid,bssid,chan,signal,security dev wifi');
    const activeConnection = nmcliOut.split('\n').find(line => line.startsWith('yes:'));
    
    if (activeConnection) {
      const [, ssid, bssid, channel, signal, security] = activeConnection.split(':');
      const rssi = parseInt(signal) - 100; // Convertir porcentaje a dBm aproximado
      
      return {
        ssid: ssid,
        bssid: bssid,
        rssi: rssi,
        channel: channel,
        signal: `${signal}%`,
        security: security,
        band: parseInt(channel) > 14 ? '5 GHz' : '2.4 GHz',
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.log('nmcli no disponible, intentando iwconfig...');
  }

  // Fallback a iwconfig
  const { stdout: iwconfigOut } = await execPromise('iwconfig 2>/dev/null | grep -E "ESSID|Quality|Frequency"');
  
  return {
    ssid: extractValue(iwconfigOut, 'ESSID:"(.+?)"'),
    rssi: -70, // iwconfig no siempre proporciona RSSI directo
    signal: extractValue(iwconfigOut, 'Quality=(.+?)\\s'),
    channel: 'N/A',
    timestamp: Date.now()
  };
}

/**
 * Escanear redes disponibles
 */
async function scanWiFi() {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      return await scanWindowsNetworks();
    } else if (platform === 'darwin') {
      return await scanMacOSNetworks();
    } else if (platform === 'linux') {
      return await scanLinuxNetworks();
    }
  } catch (error) {
    console.error('Error escaneando redes:', error);
    return [];
  }
}

async function scanWindowsNetworks() {
  const { stdout } = await execPromise('netsh wlan show networks mode=bssid');
  const networks = [];
  
  const ssidRegex = /SSID \d+ : (.+)/g;
  const signalRegex = /Signal\s+:\s+(\d+)%/g;
  
  let match;
  while ((match = ssidRegex.exec(stdout)) !== null) {
    const signalMatch = signalRegex.exec(stdout);
    networks.push({
      ssid: match[1].trim(),
      signal: signalMatch ? `${signalMatch[1]}%` : 'N/A'
    });
  }
  
  return networks;
}

async function scanMacOSNetworks() {
  const airportPath = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
  const { stdout } = await execPromise(`${airportPath} -s`);
  
  const lines = stdout.split('\n').slice(1); // Saltar header
  return lines.filter(line => line.trim()).map(line => {
    const parts = line.trim().split(/\s+/);
    return {
      ssid: parts[0],
      bssid: parts[1],
      rssi: parts[2],
      channel: parts[3]
    };
  });
}

async function scanLinuxNetworks() {
  const { stdout } = await execPromise('nmcli -t -f ssid,signal,security dev wifi');
  
  return stdout.split('\n').filter(line => line.trim()).map(line => {
    const [ssid, signal, security] = line.split(':');
    return { ssid, signal: `${signal}%`, security };
  });
}

// Utilidades
function calculateRSSI(signalPercent) {
  // Convertir porcentaje a dBm aproximado
  const percent = parseInt(signalPercent);
  if (isNaN(percent)) return -70;
  return -100 + (percent / 2);
}

function extractValue(text, regex) {
  const match = text.match(new RegExp(regex));
  return match ? match[1] : 'N/A';
}

module.exports = {
  getConnectionInfo,
  scanWiFi
};
