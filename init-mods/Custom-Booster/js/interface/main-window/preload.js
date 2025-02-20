const { contextBridge, ipcRenderer } = require('electron');


let currentPreset = {
    id: -1,
    stats: {
        power: 0,
        rlTime: 0,
        mode: 'CLASSIC',
        boostsByReloads: 1
    }
};

let statInputs = {
};


function setIsPowerON(isPowered) {
    document.querySelector("#power-button").style.boxShadow = isPowered ? "0px 0px 5px 1px lime" : "0px 1px 5px #393939a3";
    document.querySelector("#power-button > label").innerHTML = isPowered ? 'Enabled' : 'Disabled';
}

function onPresetReceived(presetId, presetStats) {

    document.querySelector('#editor-blocker').style.display = presetStats.canChangeStats ? 'none' : 'flex';
    if(!presetStats.canChangeStats) scrollTo(0, 0);
    document.body.style.overflow = presetStats.canChangeStats ? '' : 'hidden';

    if(presetStats.canChangeStats) {
        let toolsShortcutMenu = document.querySelector('#tools-shortcuts-menu')
        if(toolsShortcutMenu) toolsShortcutMenu.remove();
    }

    currentPreset.id = presetId;
    currentPreset.stats = presetStats;
    statInputs.power.value = presetStats.power;
    statInputs.rlTime.value = presetStats.rlTime / 1000;
    statInputs.boostsByReloads.value = presetStats.boostsByReloads;

    (statInputs.mode.selectedOptions[0] || {}).selected = false;
    statInputs.mode.querySelector('option[value="' + presetStats.mode + '"]').selected = true;

    document.querySelectorAll('#presets-container > button.selected-preset').forEach(el => {
        el.classList.remove('selected-preset');
    });

    if(presetId != -1) document.querySelector('#presets-container > button[preset-b-id="' + presetId + '"]').classList.add('selected-preset');
}

ipcRenderer.on('loaded-preset', (ev, newPresetId, newPresetStats) => {
    onPresetReceived(newPresetId, newPresetStats);
});

window.addEventListener('load', ()=>{
    statInputs = {
        power: document.querySelector('#input-power'),
        rlTime: document.querySelector('#input-rltime'),
        boostsByReloads: document.querySelector("#input-boostsbyreloads"),
        mode: document.querySelector('#input-mode'),
    };

    setIsPowerON(false);
});

let customAudioLevel = 0;
let audioPath = '';
let baseOfOtherShortcuts;

ipcRenderer.on('startContent', (ev, contentId, contentD) => {
    switch (contentId) {
        case 'preferences':
            document.querySelector("#shortcut-box > label").innerText = 'Shortcut: ' + contentD.shortcut;
            customAudioLevel = contentD.audioLevel;
            baseOfOtherShortcuts = contentD.toolsBaseShortcut;
            
            let audioInputLevel = document.querySelector('#audio-level-input');
            
            audioInputLevel.value = customAudioLevel+'';

            
            audioInputLevel.onchange = () => {
                let newValAudioI = Number(audioInputLevel.value);
                if(newValAudioI < 0 || newValAudioI > 1) return;

                customAudioLevel = newValAudioI;
                ipcRenderer.send('newAudioLevel', newValAudioI);
            }
            break;
        
        case 'audioPath':
            audioPath = contentD;
            break;
    }
});


ipcRenderer.on('setIsBoostActive', (ev, isBoostActive) => {
    setIsPowerON(isBoostActive);
});

ipcRenderer.on('boostUsed', (ev, isOtherSound) => {
    let audioToPlay = new Audio(isOtherSound||audioPath);
    audioToPlay.volume = customAudioLevel;
    audioToPlay.onended = () => {
        audioToPlay.remove();
    };
    audioToPlay.play();
});


contextBridge.exposeInMainWorld('electronAPI', {
    tooglePower: () => {
        ipcRenderer.send('toogle-power');
    },
    loadPreset: (npresetid) => {
        ipcRenderer.send('load-preset', npresetid);
    },
    editStat: (statId, statVal) => {
        ipcRenderer.send('editStat', statId, statVal);
    },
    editShortcut: () => {
        ipcRenderer.send('editShortcut');
    },
    editToolShortcut: () => {
        ipcRenderer.send('editToolShortcut');
    },

    getOtherShortcutsBase: () => {
        return baseOfOtherShortcuts;
    }
});