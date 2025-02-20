const { contextBridge, ipcRenderer } = require('electron');

let config;


const idCommunicationWindow = 'SETTINGS_EDITOR_W';


let editableSettings = [
    {
        name: 'closing the app after that the game is launched',
        id: 'close-after-game-launched',
        type: 'boolean',
        input: null
    },
    {
        name: 'launch the game with the console',
        id: 'open-in-cmd',
        type: 'boolean',
        input: null
    },
    {
        name: 'don\'t launch the game',
        id: 'not-launch-game',
        type: 'boolean',
        input: null
    },
    {
        name: 'close the app after launched the game',
        id: "close-after-game-launched",
        type: 'boolean',
        input: null
    },
    {
        name: 'close the app after launched the game',
        id: "close-after-game-launched",
        type: 'boolean',
        input: null
    },
    // {
    //     name: "Base Shortcut",
    //     id: "baseShortcut",
    //     type: 'string',
    //     input: null,
    //     help: "IMPORTANT: don't use only one letter, it's recommanded to start with something like 'Shift+' or 'Ctrl+'"
    // }
];

const printToS = (msg) => {
    ipcRenderer.send(idCommunicationWindow + 'printmsg', msg);
};

ipcRenderer.on('configManager', (ev, newConfigM) => {
    console.log('received config manager');
    config = newConfigM;

    const parentForSettings = document.querySelector('#settings-container');

    parentForSettings.innerHTML = '';

    function addSetting(settingname, settingid, settingtype, settinghelp) {

        let el = document.createElement('div');

        el.className = 'setting-box';

        el.innerHTML = '<label></label>';
        el.querySelector('label').innerText = settingname;

        let input = document.createElement('input');

        let helpButton;

        switch (settingtype) {
            case 'boolean':
                input.type = 'checkbox';
                input.checked = config[settingid] == true;
                break;
                
            case 'string':
                input.type = 'text';
                input.value = config[settingid];
                
                if(settinghelp) {
                    input.disabled = true;
                    helpButton = document.createElement('button');
                    helpButton.innerHTML = 'Help';
                    helpButton.style = `
                        margin: 0;
                        font-size: 15px;
                        padding: 5px 10px;
                    `;
                    helpButton.onclick = () => {
                        input.disabled = false;
                        printToS( settinghelp );
                        el.onclick = null;
                    }
                }
                break;
        
            default:
                input.type = 'text';
                input.value = config[settingid];
                
                if(settinghelp) {
                    input.disabled = true;
                    helpButton = document.createElement('button');
                    helpButton.innerHTML = 'Help';
                    helpButton.style = `
                        margin: 0;
                        font-size: 15px;
                        padding: 5px 10px;
                    `;
                    helpButton.onclick = () => {
                        input.disabled = false;
                        electronAPI.printToS( settinghelp );
                        el.onclick = null;
                    }
                }
                break;
        }

        el.appendChild(input);

        if(helpButton) el.appendChild(helpButton);

        parentForSettings.appendChild(el);

        return input;
    }

    editableSettings.forEach(
        setting => setting.input = addSetting(setting.name, setting.id, setting.type, setting.help)
    );

});


contextBridge.exposeInMainWorld('electronAPI', {

    // printToS: (msg) => {
    //     ipcRenderer.send(idCommunicationWindow + 'printmsg', msg);
    // },

    cancelChanges: () => {
        setTimeout(() => {
            ipcRenderer.send(idCommunicationWindow + 'cancel');
        }, 230);
    },
    save: () => {

        let editedConfigAttrs = {};

        editableSettings.forEach(
            setting => {
                editedConfigAttrs[setting.id] = setting.type == 'boolean' ? setting.input.checked : setting.input.value;
            }
        );

        ipcRenderer.send(idCommunicationWindow + 'save', editedConfigAttrs);
    }
});