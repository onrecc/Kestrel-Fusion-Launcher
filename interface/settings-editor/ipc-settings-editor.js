const {dialog, ipcMain} = require('electron');
const config = require('../../config-manager');
const globalVars = require('../../global-variables');


const idCommunicationWindow = 'SETTINGS_EDITOR_W';


/*****************************************************
****** Events / Communication with the window : ******
******************************************************/

let canDoOtherActions = true;

// ipcMain.on(idCommunicationWindow + 'editAttr', (ev, attrkey, attrvalue) => {
//     config[attrkey] = attrvalue;
// });


// When user click on the "save" button
ipcMain.on(idCommunicationWindow + 'save', (ev, editedConfigAttrs) => {

    if(!canDoOtherActions) return;

    canDoOtherActions = false;

    let reloadAfterShortcuts = editedConfigAttrs['baseShortcut'] != null && editedConfigAttrs['baseShortcut'] != config['baseShortcut'];

    for (const key in editedConfigAttrs) {
        config[key] = editedConfigAttrs[key];
    }

    if(reloadAfterShortcuts) {
        console.log('Reloading shortcuts..');
        require('../../js-to-game-scripts').shortcuts.reloadShortcutsUsingBaseShortcut();
    }

    config.save();

    setTimeout(() => {
        globalVars.openHomeWindow();
        canDoOtherActions = true;
    }, 230);
});

ipcMain.on(idCommunicationWindow + 'printmsg', (ev, msgToPrint) => {

    require('electron').dialog.showMessageBox({
        message: msgToPrint,
        buttons: [],
        type: 'info'
    });
});


// When user click on the "cancel" button
ipcMain.on(idCommunicationWindow + 'cancel', () => {
    
    if(!canDoOtherActions) return;

    canDoOtherActions = false;

    globalVars.openHomeWindow();

    canDoOtherActions = true;
});