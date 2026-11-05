'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bubble', {
  dragStart: () => ipcRenderer.send('bubble:drag-start'),
  dragMove: () => ipcRenderer.send('bubble:drag-move'),
  dragEnd: (moved) => ipcRenderer.send('bubble:drag-end', moved),
  menu: () => ipcRenderer.send('bubble:menu'),
  onState: (fn) => ipcRenderer.on('bubble:state', (_e, state) => fn(state)),
});
