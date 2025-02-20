const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const config = require('./config-manager');


const globalVars = require('./global-variables');
globalVars.app = app;
globalVars.appLocationURL = __dirname;
globalVars.KFFolderPath = path.join( config['game-location'], '/KF-Files' );

if(!fs.existsSync(globalVars.KFFolderPath)) fs.mkdirSync( globalVars.KFFolderPath );


require('./backup-manager');
const modManager = require('./mod-manager');
const windowTypes = require('./window-types.json');
require('./menu-builder'); // Create the menu
require('./ipc-main-manager'); // Interactions main process <=> window process
let memoryJS;

if(config.firstTime) {
    config.version = app.getVersion();
    require("./first-time");
}


console.log('modules loaded');

// let oldErrrs = [];
// process.on('uncaughtException', err => {
//     console.error(err);
//     if(globalVars.mainWindow) {
//         globalVars.mainWindow.webContents.send('alert', err.stack + '');
//     } else {
//         oldErrrs.push(
//             err
//         )
//     }
// })
// setInterval(() => {
//     if(!globalVars.mainWindow) return;
//     setTimeout(() => {
//         oldErrrs.forEach(
//             err => globalVars.mainWindow.webContents.send('alert', err.stack + '')
//         )
//         oldErrrs = [];
//     }, 800);
// }, 2000);

let currentWindowType = windowTypes.MAIN;


// DONT ACTIVATE "customisable" FOR TEXT THAT ANYBODY CAN EDIT
function alertWindow(text, customisable) {
    globalVars.mainWindow.webContents.send('alert', text, customisable);
}

modManager.launcherVersion = app.getVersion();



// Executed when the main window is loaded :
function onWindowReloaded() {

    if(currentWindowType != windowTypes.MAIN) return;

    function applyThemeOnWindow(themeid) {
        try {
            globalVars.mainWindow.webContents.executeJavaScript(`
            (()=>{
                let el = document.createElement("link");
                el.rel = "stylesheet";
                el.href = ${
                    JSON.stringify( path.join(globalVars.appLocationURL, '/themes', themeid) )
                };

                document.head.appendChild(el);
            })()
            `, false);
        } catch (error) {
            console.error(error);
        }
    }
    
    if(config['open-dev-tool']) globalVars.mainWindow.webContents.openDevTools();

    // Apply themes :
    config['user-preferences'].themes.forEach( applyThemeOnWindow );
    
    // Change the background
    if(config['user-preferences'].background) globalVars.mainWindow.webContents.send('background', config['user-preferences'].background);

    // Load the mods
    let haveModNotLoaded = modManager.loadAllMods();

    if(haveModNotLoaded) {
        console.log('1 or more mods cannot be loaded');
        alertWindow("Error : a mod can't be loaded\n(verify if there are a mod.json file or if he is badly imported)");
    }


    // Send the version of the app :
    globalVars.mainWindow.webContents.send('version', config.version);
    
    // send the app location
    // globalVars.mainWindow.webContents.send('appLocation', globalVars.appLocationURL, path.join(path.dirname(globalVars.app.getPath('exe')), '../'), config['not-use-date']);
    globalVars.mainWindow.webContents.send('appLocation', globalVars.appLocationURL, path.dirname(globalVars.app.getPath('exe')), config['not-use-date']);
}



const createWindow = (windowtypetoopen, cusompreload, isfullscreen) => {

    let removeOldWindow = () => null;

    // if there are already a window openned remove it
    if(typeof windowtypetoopen != "string" && globalVars.mainWindow != null) {

        const windowToR = globalVars.mainWindow;

        removeOldWindow = () => {
            windowToR.close();
        }
    }

    let windowWidth = 956, windowHeight = 600;

    if(isfullscreen) {
        let {screen} = require('electron');

        screen = screen.getPrimaryDisplay().workAreaSize;

        windowWidth = screen.width;
        windowHeight = screen.height;
    }

    if(cusompreload !== false) {

        if(!cusompreload) {
            cusompreload = path.join(globalVars.appLocationURL, '/interface/preload.js')
        } else {
            cusompreload = (cusompreload+'').startsWith('_') ? cusompreload.slice(1) : path.join(globalVars.appLocationURL, '/interface', cusompreload)
        }
    } else {
        cusompreload = undefined;
    }

    let newWindowToShow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        fullscreen: config.fullscreen,
        webPreferences: {
            preload: cusompreload,
            contextIsolation: true,
            nodeIntegration: true
        }
    });
    
    newWindowToShow.setIcon(path.join(__dirname, 'icon.ico'));

    if(typeof windowtypetoopen != 'string') {
        
        globalVars.mainWindow = newWindowToShow;
        currentWindowType = windowtypetoopen;
        
        switch (windowtypetoopen) {
            case windowTypes.MAIN:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/index.html`;
                break;
            
            case windowTypes.CHAR_EDITOR:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/character-builder/index.html`;
                break;
            
            case windowTypes.LICENSE:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/license-and-copyrights/license-page.html`;
                break;
            
            case windowTypes.COPYRIGHTS:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/license-and-copyrights/copyrights-page.html`;
                break;
                
            case windowTypes.OTHERLICENSES:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/license-and-copyrights/other-licenses-page.html`;
                break;
            
            case windowTypes.UPDATER:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/updater/updater.html`;
                break;
            
            case windowTypes.SETTINGS_EDITOR:
                windowtypetoopen = `file://${globalVars.appLocationURL}/interface/settings-editor/settings-editor.html`;
                break;
        }
    } else {
        if(windowtypetoopen.startsWith('_')) {
            windowtypetoopen = `file://${windowtypetoopen.slice(1)}`;
        } else {
            windowtypetoopen = `file://${globalVars.appLocationURL}/interface/${windowtypetoopen}`;
        }
    }

    // Load the .html page :
    newWindowToShow.loadURL(windowtypetoopen);
    newWindowToShow.webContents.once('dom-ready', removeOldWindow);

    return newWindowToShow;
}
globalVars.createWindow = createWindow;

function openHomeWindow() {
    createWindow(windowTypes.MAIN)
     .webContents.on('dom-ready', onWindowReloaded); // Every time that the window is loaded/reloaded the function "onWindowReloaded" is called

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow(windowTypes.MAIN).webContents.once('dom-ready', onWindowReloaded);
    });
}
globalVars.openHomeWindow = openHomeWindow;

// Open the window when the app is ready
app.whenReady().then(() => {

    // Next open the window :
    openHomeWindow();
});


// Stop the app when all windows is closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log("STOP APP");
        app.quit();
    }
});

app.on('will-quit', () => {
    require('electron').globalShortcut.unregisterAll();
});



// Check if the game is launched every seconds
setInterval(() => {
    
    try {

        if(memoryJS == null) memoryJS = require('memoryjs');
        
        memoryJS.getProcesses((error, processes) => {
            if(error) {
                console.error(error);
                console.log('error while checking if the game is launched');
                return;
            }

            globalVars.isGameLaunched = processes.find( p => p.szExeFile == config.exename ) != null;
        });
    } catch (error) {
        console.error(error);
    }

}, 1000);