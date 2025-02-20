exports.showRules = (rulesText, gameAPI) => new Promise((resolve, reject) => {

    let haveSendedRes = false;
    
    let rulesWindow = gameAPI.interface.createMenu(
        require('path').join(__dirname, 'interface/rules/index.html'),
        require('path').join(__dirname, 'interface/rules/preload.js')
    );
    
    rulesWindow.webContents.on('dom-ready', () => {
        if(!rulesWindow) return;
        
        rulesWindow.webContents.send('rules', rulesText);
    });

    rulesWindow.once('close', () => {
        rulesWindow = null;
        if(!haveSendedRes) reject();
        haveSendedRes = true;
    });

    
    let canUseMenu = true;

    // Handle the connection with the menu :
    rulesWindow.webContents.on('ipc-message', (ev, channelMsg, ...args) => {
        if(!canUseMenu) return;
        
        switch (channelMsg) {
            case 'rulesUserRes':
                canUseMenu = false;
                if(!haveSendedRes) resolve(args[0] == 1);
                haveSendedRes = true;
                if(rulesWindow) rulesWindow.close();
                break;
            
            default:
                break;
        }
    });
})