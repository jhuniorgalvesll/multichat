'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('toast', {
  onData: (fn) => ipcRenderer.on('toast:data', (_e, data) => fn(data)),
  size: (height) => ipcRenderer.send('toast:size', height),
  hold: (hold) => ipcRenderer.send('toast:hold', hold),
  close: () => ipcRenderer.send('toast:close'),
  open: () => ipcRenderer.send('toast:open'),
  reply: (text) => ipcRenderer.invoke('toast:reply', text),
});
