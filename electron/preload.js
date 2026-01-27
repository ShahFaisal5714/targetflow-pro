const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  isElectron: true,
  
  // IPC communication
  onMenuExportDatabase: (callback) => {
    ipcRenderer.on('menu-export-database', callback);
  },
  onMenuImportDatabase: (callback) => {
    ipcRenderer.on('menu-import-database', callback);
  },
  
  // Remove listeners
  removeMenuExportListener: () => {
    ipcRenderer.removeAllListeners('menu-export-database');
  },
  removeMenuImportListener: () => {
    ipcRenderer.removeAllListeners('menu-import-database');
  }
});

// Log that preload script is loaded
console.log('Electron preload script loaded');
