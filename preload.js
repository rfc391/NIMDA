
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // You can expose secure functions here
});
