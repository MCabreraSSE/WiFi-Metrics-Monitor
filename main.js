const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { scanWiFi, getConnectionInfo } = require('./wifi-scanner');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'WiFi Metrics Monitor Pro',
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('public/index.html');

  // Abrir DevTools en desarrollo
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers para comunicación con el renderer
ipcMain.handle('get-wifi-metrics', async () => {
  try {
    const metrics = await getConnectionInfo();
    return { success: true, data: metrics };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scan-networks', async () => {
  try {
    const networks = await scanWiFi();
    return { success: true, data: networks };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
