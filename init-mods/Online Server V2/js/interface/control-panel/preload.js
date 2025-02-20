const { contextBridge, ipcRenderer } = require('electron');

let pluginsButtons = [];


ipcRenderer.on('stat', (ev, statid, statdata) => {
    let statElement = document.querySelector('[data-stat-role=' + JSON.stringify(statid+'') + ']');
    if(!statElement) return;
    if(statElement.getAttribute('data-stat-txt')) {
        statdata = (statElement.getAttribute('data-stat-txt')+'').replace('?', statdata);
    }
    statElement.innerText = statdata;
});


const tooglePlugin = (pluginId) => {
    ipcRenderer.send('plugin', 'toogle', pluginId);
};


let removeLastPlayerMenu;

ipcRenderer.on('addPlayer', (ev, playerinfos) => {
    let basePlayerElement = document.createElement('div');
    basePlayerElement.classList.add("base-player-element");
    basePlayerElement.setAttribute('player-id', playerinfos.id+'');

    basePlayerElement.innerHTML = `
        <label></label> <button>+</button>
    `;
    const featureButton = basePlayerElement.querySelector('button');
    featureButton.style = `
        border: 1px solid black;
        width: 25px;
        height: 25px;
        cursor: pointer;
    `;
    
    // **************** Player actions menu ****************
    
    featureButton.onclick = (ev) => {
        let managePlayerMenu = document.createElement('div');
        managePlayerMenu.style = `
            position: absolute;
            left: ${ev.clientX + window.scrollX}px;
            top: ${ev.clientY + window.scrollY}px;
            width: 100px;
            /* height: 225px; */
            display: flex;
            flex-direction: column;
            padding: 15px 10px;
            gap: 3px;
            background: rgba(111, 188, 255, 0.28);
            border-radius: 11px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(1.7px);
            border: 1px solid rgba(111, 188, 255, 0.26);
            transform-origin: top;
            transform: scaleY(0);
            transition: transform 0.26s ease;
        `;

        const playerManagerbuttonsCSS = `
            cursor: pointer;
            border: none;
            background: #eff8ff;
            border-radius: 9px;
            min-height: 30px;
        `;

        let evDetectC = () => {
            removeEventListener('click', evDetectC);
            managePlayerMenu.remove();
            removeLastPlayerMenu = null;
        };
        removeLastPlayerMenu = evDetectC;
        setTimeout(() => {
            addEventListener('click', evDetectC);
        }, 250);
        managePlayerMenu.setAttribute('plyr-id', playerinfos.id);
        managePlayerMenu.innerHTML = `
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('toogle-visibility', this.parentElement.getAttribute('plyr-id'))">Toogle Visibility</button>
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('toogle-visibility-on-map', this.parentElement.getAttribute('plyr-id'))">Toogle Visibility On Map</button>
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('tp', this.parentElement.getAttribute('plyr-id'))">Random TP</button>
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('toogle-can-v', this.parentElement.getAttribute('plyr-id'))">Toogle can enter in vehicle</button>
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('toogle-canmove', this.parentElement.getAttribute('plyr-id'))">Toogle Freeze</button>
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('addcoins', this.parentElement.getAttribute('plyr-id'))">Give coins</button>
        <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('disconnect', this.parentElement.getAttribute('plyr-id'))">Disconnect</button>
        `;
        
        // <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('apply-damage', this.parentElement.getAttribute('plyr-id'))">Apply damage</button>
        // <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('instant-damage', this.parentElement.getAttribute('plyr-id'))">Instant kill</button>
        // <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('setv', this.parentElement.getAttribute('plyr-id'), 18, 1, 0)">Set vehicule Invu</button>
        // <button style="${playerManagerbuttonsCSS}" onclick="electronAPI.managePlayer('setv', this.parentElement.getAttribute('plyr-id'), 1, 0, 1)">Set vehicule Hero Locked</button>
        
        document.body.appendChild(managePlayerMenu);
        setTimeout(() => {
            managePlayerMenu.style.transform = 'scaleY(1)';
        }, 80);
    }

    basePlayerElement.oncontextmenu = (ev) => {
        ev.preventDefault();
        if(removeLastPlayerMenu) removeLastPlayerMenu();
        featureButton.onclick(ev);
    }

    basePlayerElement.querySelector('label').innerText = `ID: ${playerinfos.id}`;

    document.querySelector('#players-container').appendChild(basePlayerElement);
});

ipcRenderer.on('removePlayer', (ev, plyrid) => {
    let elToRemove = document.querySelectorAll('#players-container > .base-player-element');
    
    plyrid += '';

    elToRemove.forEach(el => {
        if(!el) return;
        if(el.getAttribute('player-id')+'' == plyrid) {
            el.remove();
        }
    });
});


ipcRenderer.on('addPluginButton', (ev, pluginName, buttonObj) => {
    buttonObj.pluginName = pluginName;
    pluginsButtons.push(buttonObj);
});

ipcRenderer.on('removePluginButton', (ev, pluginName, buttonIdPlugin) => {
    pluginsButtons = pluginsButtons.filter(buttonObj => buttonObj.pluginName != pluginName || buttonObj.id != buttonIdPlugin);
});

const setIsPluginElementActive = (el, isPluginActive) => {
    console.log('plugin now:', isPluginActive);

    const buttonToggleActive = el.querySelector('button');

    if(isPluginActive) {
        buttonToggleActive.classList.remove('offplugin');
        buttonToggleActive.innerHTML = 'ON';
    } else {
        buttonToggleActive.classList.add('offplugin');
        buttonToggleActive.innerHTML = 'OFF';
    }
};


ipcRenderer.on('addPlugin', (ev, name) => {
    
    let pluginEl = document.createElement('div');
    pluginEl.idPluginName = name;
    pluginEl.innerHTML = `
    <label></label>
    <button class="offplugin">OFF</button>
    `;
    
    pluginEl.querySelector('label').innerText = name;
    
    let buttonToggleActive = pluginEl.querySelector('button');

    buttonToggleActive.onclick = () => {
        // electronAPI.tooglePlugin(name);
        tooglePlugin(name);
    }

    pluginEl.oncontextmenu = ev => {
        ev.preventDefault();
        if(removeLastPlayerMenu) removeLastPlayerMenu();
    
        let managePluginMenu = document.createElement('div');
        managePluginMenu.style = `
            position: absolute;
            left: ${ev.clientX + window.scrollX}px;
            top: ${ev.clientY + window.scrollY}px;
            width: 100px;
            /* height: 225px; */
            display: flex;
            flex-direction: column;
            padding: 15px 10px;
            gap: 3px;
            background: rgba(111, 188, 255, 0.28);
            border-radius: 11px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(1.7px);
            border: 1px solid rgba(111, 188, 255, 0.26);
            transform-origin: top;
            transform: scaleY(0);
            transition: transform 0.26s ease;
        `;

        const pluginMButtonsCSS = `
            cursor: pointer;
            border: none;
            background: #eff8ff;
            border-radius: 9px;
            min-height: 30px;
        `;

        let evDetectC = () => {
            removeEventListener('click', evDetectC);
            managePluginMenu.remove();
            removeLastPlayerMenu = null;
        };
        removeLastPlayerMenu = evDetectC;
        setTimeout(() => {
            addEventListener('click', evDetectC);
        }, 250);
        function addPluginButton(displayText, actionid) {
            let buttonActionPlugin = document.createElement('button');
            buttonActionPlugin.style = pluginMButtonsCSS;
            buttonActionPlugin.innerText = displayText;
            managePluginMenu.appendChild(buttonActionPlugin);
            buttonActionPlugin.onclick = () => {
                ipcRenderer.send('plugin', 'button', name, actionid);
            }
        }
        pluginsButtons.forEach(pluginButtonObj => {
            if(pluginButtonObj.pluginName != name) return;

            addPluginButton(pluginButtonObj.name, pluginButtonObj.id);
        })
        
        document.body.appendChild(managePluginMenu);
        setTimeout(() => {
            managePluginMenu.style.transform = 'scaleY(1)';
        }, 80);
    }
    
    document.querySelector('#plugins-container').appendChild(pluginEl);
});

ipcRenderer.on('pluginSetIsActive', (ev, pluginname, ispluginenabled) => {

    if(!ispluginenabled) {
        pluginsButtons = pluginsButtons.filter(buttonObj => buttonObj.pluginName != pluginname);
    }

    let pluginsEl = document.querySelectorAll('#plugins-container > div');
    pluginsEl.forEach(el => {
        if(el.idPluginName != pluginname) return;

        setIsPluginElementActive(el, ispluginenabled);
    })
});

contextBridge.exposeInMainWorld('electronAPI', {
    tooglePlugin: tooglePlugin,

    toogleAcceptPlayers: () => {
        ipcRenderer.send('toogle-players-accepted');
    },
    tooglePvP: () => {
        ipcRenderer.send('toogle-pvp');
    },
    managePlayer: (actiontype, ...actionvalues) => {
        ipcRenderer.send('manage-player', actiontype, ...actionvalues);
    }
});