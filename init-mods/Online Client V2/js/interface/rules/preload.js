const { contextBridge, ipcRenderer } = require('electron');

let haveReceivedRules = false;

ipcRenderer.on('rules', (ev, rulesTxt) => {
    haveReceivedRules = true;
    document.querySelector('#rules-txt').innerText = rulesTxt+'';
});

contextBridge.exposeInMainWorld('electronAPI', {
    setIsUserAccepting: (isacceptedr) => {
        if(!haveReceivedRules) return;
        ipcRenderer.send('rulesUserRes', isacceptedr ? 1 : 0);
    }
});