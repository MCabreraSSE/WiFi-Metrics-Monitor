const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getWiFiMetrics: () => ipcRenderer.invoke('get-wifi-metrics'),
  scanNetworks: () => ipcRenderer.invoke('scan-networks')
});
