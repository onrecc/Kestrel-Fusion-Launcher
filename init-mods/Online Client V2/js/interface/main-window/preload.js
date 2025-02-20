const { contextBridge, ipcRenderer } = require('electron');

let canChangeConnection = false;
let currentConnectionState = 0;

let canUpdateDisg = true;

let lastEmoteKeyShortcut;

ipcRenderer.on('stat', (ev, statid, statdata) => {

    if(statid == 'client') {

        
        let coStateElement = document.querySelector('[data-stat-role="connection-state"]');

        let connectionButton = document.querySelector('#connection-button');

        switch (statdata.connectionState) {
            case 0:
                coStateElement.innerText = "Offline";
                connectionButton.innerHTML = "Join Server";
                break;
                
            case 1: // normally this state never happens
            case 2:
                coStateElement.innerText = "Online";
                connectionButton.innerHTML = "Quit Server";
                break;
            default:
                break;
        }

        if(statdata.connectionState != null) {
            // If connection updated, the user can change the connection
            canChangeConnection = true;
            document.querySelector('#connection-button').classList.add('canhover');
            currentConnectionState = statdata.connectionState;
        }

        if(statdata.disguise != null) {
            //
        }
        return;
    }

    let statElement = document.querySelector('[data-stat-role=' + JSON.stringify(statid+'') + ']');
    if(!statElement) return;

    if(statElement.getAttribute('data-stat-txt')) {
        statdata = (statElement.getAttribute('data-stat-txt')+'').replace('?', statdata);
    }
    statElement.innerText = statdata;
});

let emotesTotalList = [];
let playerSettings;

ipcRenderer.on('other', (ev, msgId, ...args) => {
    switch (msgId) {
        
        case 'updatedisguise':
            document.querySelector('[data-button-role="disguise-u"]').innerHTML = args[0] == 1 ? 'Updated' : 'Cannot Update';
            setTimeout(() => {
                document.querySelector('[data-button-role="disguise-u"]').innerHTML = 'Update Disguise';
                document.querySelector('[data-button-role="disguise-u"]').classList.add('canhover');
                canUpdateDisg = true;
            }, 1250);
            break;
            
        case 'emotes':
            emotesTotalList = args[0];
            break;
            
        case 'emoteShortcut':
            lastEmoteKeyShortcut = args[0];
            break;
    
        case 'playerSettings':
            playerSettings = args[0];
            break;

        default:
            break;
    }
});

let servButtonsCount = 0;

ipcRenderer.on('server-buttons', (ev, msgId, ...args) => {

    const serverButtonsContainer = document.querySelector('#server-buttons-container');

    switch (msgId) {

        // Adding OR editing a button
        case 'add':

            let buttonWithSameId;
            
            serverButtonsContainer.querySelectorAll('button').forEach(buttonWithMaybeSameId => {
                if(buttonWithMaybeSameId && buttonWithMaybeSameId.getAttribute('data-s-button-id') == args[1]) buttonWithSameId = buttonWithMaybeSameId;
            });

            // Editing an existing button
            if(buttonWithSameId) {
                buttonWithSameId.innerText = args[0];
                break;
            }

            if(servButtonsCount >= 50) break;
            servButtonsCount++;
            let newSButton = document.createElement('button');
            newSButton.innerText = args[0];
            newSButton.setAttribute('data-s-button-id', args[1]);
            newSButton.onclick = () => {
                ipcRenderer.send('serv-button-pressed', args[1]);
            };
            serverButtonsContainer.appendChild(newSButton);
            break;

        case 'remove':
            serverButtonsContainer.querySelectorAll('button').forEach(servButton => {
                if(servButton.getAttribute('data-s-button-id') == args[0]) {
                    servButtonsCount--;
                    servButton.remove();
                }
            });
            break;

        case 'removeall':
            serverButtonsContainer.querySelectorAll('button').forEach(servButton => {
                servButton.remove();
            });
            servButtonsCount = 0;
            break;
    
        default:
            break;
    }

    if(servButtonsCount < 0) servButtonsCount = 0;

    serverButtonsContainer.style.display = (serverButtonsContainer.querySelectorAll('button').length == 0) ? 'none' : 'flex';

    // if(serverButtonsContainer.querySelectorAll('button').length == 0) {
    //     serverButtonsContainer.style.height = '0px';
    // } else {
    //     serverButtonsContainer.style.height = '200px';
    // }

});


contextBridge.exposeInMainWorld('electronAPI', {
    changeConnection: () => {
        if(!canChangeConnection) return;
        document.querySelector('#connection-button').classList.remove('canhover');
        document.querySelector('#connection-button').innerHTML = currentConnectionState == 0 ? "Joining.." : "Leaving..";
        canChangeConnection = false;
        ipcRenderer.send('changeConnection');
    },
    toogleWeapons: () => {
        ipcRenderer.send('toogle-w');
    },
    toogleUI: () => {
        ipcRenderer.send('toogle-ui');
    },
    updateDisguise: () => {
        if(!canUpdateDisg) return;
        canUpdateDisg = false;
        document.querySelector('[data-button-role="disguise-u"]').innerHTML = 'Updating..';
        document.querySelector('[data-button-role="disguise-u"]').classList.remove('canhover');
        ipcRenderer.send('disguise', 'update');
    },
    searchDisguise: (research) => {
        ipcRenderer.send('disguise', 'search', research);
    },
    searchDisguiseWithId: (research) => {
        ipcRenderer.send('disguise', 'searchWithId', research);
    },

    updateplayerposes: () => {
        ipcRenderer.send('updateplayerposes');
    },

    getEmoteShortcut: () => {
        return lastEmoteKeyShortcut;
    },
    getEmotes: () => emotesTotalList,
    editEmoteShortcut: () => {
        ipcRenderer.send('editEmoteShortcut');
    },
    editSpecialAttackKey: () => {
        ipcRenderer.send('editSpecialAttackKey');
    },

    sendNewPlayerSettings: (newPlayerSettings) => {
        ipcRenderer.send('playerSettings', newPlayerSettings);
    },

    setTimerMode: (newTimerMode) => {
        ipcRenderer.send('TIMERMODE', newTimerMode);
    },

    getPlayerSettings: () => {
        return playerSettings;
    }
});