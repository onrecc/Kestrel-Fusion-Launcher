

let gameAPI;



const DICTIONNARYLIST = {
    MODES: {
        CLASSIC: 0,
        MULTIPLIER: 1,
        CLASSIC_WITHOUT_Y: 2,
        MULTIPLIER_WITHOUT_Y: 3
    }
};


function logAnyMsg(msg) {
    console.log('[client:custom-booster]:', msg);
}

let userPreferences = {};
let userPresets = {};

const saveAttrsPath = require('path').join(__dirname, 'preferences.json');

const presetsFilePath = require('path').join(__dirname, 'presets.json');

function saveAttrFile() {
    logAnyMsg('saving preferences..');
    require('fs').writeFileSync(saveAttrsPath, JSON.stringify(userPreferences), {encoding: 'utf8'});
    logAnyMsg('preferences saved!');
}

function savePresetsFile() {
    logAnyMsg('saving presets..');
    require('fs').writeFileSync(presetsFilePath, JSON.stringify(userPresets), {encoding: 'utf8'});
    logAnyMsg('presets saved!');
}



let isGameAPIConnected = false;

function convertNumberFromMsg(numbermsg) {
    try {
        let newNumber = parseFloat(numbermsg);
        if(Number.isNaN(numbermsg)) return 0;
        if(Number.MAX_SAFE_INTEGER > newNumber && Number.MIN_SAFE_INTEGER < newNumber) return newNumber;
        newNumber = null;
        return 0;
    } catch (error) {
        logAnyMsg('ERROR WHILE PARSING NUMBER :');
        logAnyMsg(error);
        return 0;
    }
}


let currentStats = {
    enabled: false,
    //enabled: true,
    mode: DICTIONNARYLIST.MODES.CLASSIC,
    power: 3,
    rlTime: 1000,
    presetId: -1, // -1 = not using an preset actually
    canChangeStats: true,
    lastBoostUsedTime: 0,
    boostsByReloads: 1,
    numberOfBoosts: 1,
};


const presetManager = {};

presetManager.currentPresetId = 0;

presetManager.loadWithId = (presetid) => {
    presetid = Number(presetid);
    let newPreset = userPresets[presetid];
    if(newPreset == null) return false;
    
    userPreferences.lastPresetId = presetid;

    presetManager.currentPresetId = presetid;
    currentStats.presetId = presetid;
    
    currentStats.mode = newPreset.mode;
    currentStats.power = newPreset.power;
    currentStats.rlTime = newPreset.rlTime;
    currentStats.boostsByReloads = newPreset.boostsByReloads || 1; // if 0 = no boosts
    
    currentStats.numberOfBoosts = currentStats.boostsByReloads;

    presetManager.updateWindowPreset();
    saveAttrFile();

    return true;
};

presetManager.updateWindowPreset = () => {

    let statsToSend = {...currentStats};
    
    for (const modeKeyName in DICTIONNARYLIST.MODES) {
        if(DICTIONNARYLIST.MODES[modeKeyName] === statsToSend.mode) {
            statsToSend.mode = modeKeyName;
            break;
        }
    }

    if(typeof statsToSend.mode != 'string') return false;
    
    if(customWindow) customWindow.webContents.send('loaded-preset', currentStats.presetId, statsToSend);
    if(customWindow) customWindow.webContents.send('setIsBoostActive', currentStats.enabled);
};

// Saving
function onEditedStat() {
    if(!currentStats.canChangeStats) return;
    if(currentStats.presetId == -1) return;

    savePresetsFile();
}

let isServerFrozenLocalPlayer = () => false;

let customWindow;

/****************************************
 *       When the game is started       *
 ****************************************/
exports.onStart = async () => {
    gameAPI = exports.modInfos.gameScriptToJSAPI;
    const {playerVehicle} = gameAPI;

    // let getPlyrRot = playerVehicle.rotation.get;
    let baseRot;
    function getVehicleRot() {
        if(!baseRot) baseRot = gameAPI.gameMemory.getBaseAddress() + 0x1C99298;
        let zAddr = gameAPI.gameMemory.getAddressWithOffsets(baseRot, 0x60);
        return {
            x: gameAPI.gameMemory.read(zAddr + 8, 'float'),
            z: -gameAPI.gameMemory.read(zAddr, 'float'),
        }
    }
    
    function onBoostApplied() {

        if(!isGameAPIConnected) return;

        if(isServerFrozenLocalPlayer()) return;
        if(!currentStats.enabled) return;

        if(!playerVehicle.checkExisting()) return;

        let dateNow = Number(new Date().getTime());

        // if(currentStats.lastBoostUsedTime + currentStats.rlTime > dateNow) return;

        if(currentStats.numberOfBoosts < 1) {
            if(currentStats.lastBoostUsedTime + currentStats.rlTime > dateNow) return;
            currentStats.numberOfBoosts = currentStats.boostsByReloads;
        }

        currentStats.numberOfBoosts--;

        currentStats.lastBoostUsedTime = dateNow;

        const carVel = playerVehicle.velocity;


        switch (currentStats.mode) {
            case DICTIONNARYLIST.MODES.CLASSIC:{
                
                let initVelX = carVel.getX();
                let initVelY = carVel.getY();
                let initVelZ = carVel.getZ();
                // carVel.setX( initVelX + ((initVelX) * currentStats.power) );
                // carVel.setY( initVelY + ((initVelY) * currentStats.power) );
                // carVel.setZ( initVelZ + ((initVelZ) * currentStats.power) );
                // break;

                let linearPower = currentStats.power * 3;
                let vehicleRot = getVehicleRot();
                
                carVel.setX( initVelX + (vehicleRot.x * linearPower) );
                carVel.setZ( initVelZ + (vehicleRot.z * linearPower) );
                carVel.setY( initVelY + (((initVelY) * currentStats.power) / 8) );
                // carVel.setX( initVelX + (Math.sin(vehicleRot) * linearPower) );
                // carVel.setZ( initVelZ + (Math.cos(vehicleRot) * linearPower) );
                // carVel.setY( initVelY + (((initVelY) * currentStats.power) / 8) );

                break;}

            case DICTIONNARYLIST.MODES.CLASSIC_WITHOUT_Y:{
                
                // let initVelX = carVel.getX();
                // let initVelZ = carVel.getZ();
                // carVel.setX( initVelX + ((initVelX) * currentStats.power) );
                // carVel.setZ( initVelZ + ((initVelZ) * currentStats.power) );
                
                let initVelX = carVel.getX();
                let initVelZ = carVel.getZ();

                let linearPower = currentStats.power * 3;
                let vehicleRot = getVehicleRot();
                
                carVel.setX( initVelX + (vehicleRot.x * linearPower) );
                carVel.setZ( initVelZ + (vehicleRot.z * linearPower) );
                // carVel.setX( initVelX + (Math.sin(vehicleRot) * linearPower) );
                // carVel.setZ( initVelZ + (Math.cos(vehicleRot) * -linearPower) );
                
                break;}
            
            case DICTIONNARYLIST.MODES.MULTIPLIER:
                carVel.setX(carVel.getX() * currentStats.power);
                carVel.setY(carVel.getY() * currentStats.power);
                carVel.setZ(carVel.getZ() * currentStats.power);
                break;
            
            case DICTIONNARYLIST.MODES.MULTIPLIER_WITHOUT_Y:
                carVel.setX(carVel.getX() * currentStats.power);
                carVel.setZ(carVel.getZ() * currentStats.power);
                break;

        
            default:
                break;
        }
        
        if(customWindow) customWindow.webContents.send('boostUsed');

    }

    function onPressedChangeSizeShortcutUP(ev) {
        
        if(ev.state != 'DOWN') return;
        if(!gameAPI.interface.isAppHidden()) return;

        if(!isGameAPIConnected) return;

        if(isServerFrozenLocalPlayer()) return;
        if(!currentStats.enabled) return;
        if(!currentStats.canChangeStats) return;

        if(!playerVehicle.checkExisting()) return;

        let varAddr = gameAPI.gameMemory.getListAddresses().vehicle.base;
        if(!varAddr) return;

        varAddr = gameAPI.gameMemory.getAddressWithOffsets(varAddr, 0x74);
        if(!varAddr) return;
        
        let initVal = gameAPI.gameMemory.read(varAddr, "float");
        if(!initVal) return;

        if(initVal > 0.005) {
            initVal += 0.001;
        } else {
            initVal += 0.0005;
        }
        if(initVal > 30) return;

        gameAPI.gameMemory.write(varAddr, initVal, "float");
        
        if(customWindow) customWindow.webContents.send('boostUsed', require('path').join(__dirname, 'tool-audio.mp3'));
    }

    function onPressedChangeSizeShortcutDOWN(ev) {
        
        if(ev.state != 'DOWN') return;
        if(!gameAPI.interface.isAppHidden()) return;

        if(!isGameAPIConnected) return;

        if(isServerFrozenLocalPlayer()) return;
        if(!currentStats.enabled) return;
        if(!currentStats.canChangeStats) return;

        if(!playerVehicle.checkExisting()) return;

        let varAddr = gameAPI.gameMemory.getListAddresses().vehicle.base;
        if(!varAddr) return;

        varAddr = gameAPI.gameMemory.getAddressWithOffsets(varAddr, 0x74);
        if(!varAddr) return;
        
        let initVal = gameAPI.gameMemory.read(varAddr, "float");
        if(!initVal) return;

        initVal -= 0.0005;
        //if(initVal < 0.001555) return;
        if(initVal < 0.0005) return;

        gameAPI.gameMemory.write(varAddr, initVal, "float");
        
        if(customWindow) customWindow.webContents.send('boostUsed', require('path').join(__dirname, 'tool-audio.mp3'));
    }

    let oldDriftVal;
    function onPressedChangeDriftShortcut(ev) {
        
        if(ev.state != 'DOWN') return;
        if(!gameAPI.interface.isAppHidden()) return;

        if(!isGameAPIConnected) return;

        if(isServerFrozenLocalPlayer()) return;
        if(!currentStats.enabled) return;
        if(!currentStats.canChangeStats) return;

        if(!playerVehicle.checkExisting()) return;

        let varAddr = gameAPI.gameMemory.getListAddresses().vehicle.base;
        if(!varAddr) return;

        varAddr = gameAPI.gameMemory.getAddressWithOffsets(varAddr, 0x80);
        if(!varAddr) return;
        
        let initVal = gameAPI.gameMemory.read(varAddr, "float");
        if(!initVal) return;

        if(initVal == 0.0077 && oldDriftVal) {
            initVal = oldDriftVal;
        } else {
            oldDriftVal = initVal;
            initVal = 0.0077;
        }

        gameAPI.gameMemory.write(varAddr, initVal, "float");

        if(customWindow) customWindow.webContents.send('boostUsed', require('path').join(__dirname, 'tool-audio.mp3'));
        
    }

    
    function onPressedRotationShortcut(ev) {
        
        if(ev.state != 'DOWN') return;
        if(!gameAPI.interface.isAppHidden()) return;

        if(!isGameAPIConnected) return;

        if(isServerFrozenLocalPlayer()) return;
        if(!currentStats.enabled) return;

        if(!playerVehicle.checkExisting()) return;


        let plyrRotV = getVehicleRot();

        let plyrVelX = 6.2 * -plyrRotV.z;
        let plyrVelZ = 6.2 * plyrRotV.x;
        // let plyrVelX = 3.5 * Math.sin(plyrRotV);
        // let plyrVelZ = 3.5 * -Math.cos(plyrRotV);

        let varAddr;
        let initVal;
        varAddr = gameAPI.gameMemory.getAddressWithOffsets(gameAPI.gameMemory.getListAddresses().vehicle.base, 0x30);
        if(!varAddr) return;
        
        initVal = gameAPI.gameMemory.read(varAddr, "float");
        if(!initVal) return;

        gameAPI.gameMemory.write(varAddr, initVal + plyrVelX, "float");
        
        varAddr += 0x8;
        
        initVal = gameAPI.gameMemory.read(varAddr, "float");
        if(!initVal) return;

        gameAPI.gameMemory.write(varAddr, initVal + plyrVelZ, "float");

        if(customWindow) customWindow.webContents.send('boostUsed', require('path').join(__dirname, 'rotation-boost-audio.mp3'));
        
    }

    
    function spawnWindow() {
        
        if(customWindow) return;

        customWindow = gameAPI.interface.createMenu(
            require('path').join(__dirname, 'interface/main-window/index.html'),
            require('path').join(__dirname, 'interface/main-window/preload.js')
        );
        
        customWindow.webContents.on('dom-ready', () => {
            setTimeout(() => {
                
                if(!customWindow) return;

                if(customWindow) customWindow.webContents.send('startContent', 'audioPath', require('path').join(__dirname, 'boost-audio.mp3'));
                if(customWindow) customWindow.webContents.send('startContent', 'preferences', userPreferences);
                
                presetManager.updateWindowPreset();
            }, 500);
        });
        

        customWindow.once('close', () => {
            customWindow = null;
        });

        
        let canUseMenu = true;

        // Handle the connection with the menu :
        customWindow.webContents.on('ipc-message', (ev, channelMsg, ...args) => {
            if(!canUseMenu) return;
            
            if((!currentStats.canChangeStats) && (channelMsg != 'editShortcut' && channelMsg != 'newAudioLevel')) return;

            switch (channelMsg) {
                
                case 'editStat':
                    switch (args[0]) {
                        case 'power':
                            currentStats.power = args[1];
                            userPresets[currentStats.presetId].power = currentStats.power;
                            break;
                        case 'rlTime':
                            currentStats.rlTime = args[1];
                            userPresets[currentStats.presetId].rlTime = currentStats.rlTime;
                            break;
                        case 'mode':
                            if(!args[1]) break;
                            currentStats.mode = DICTIONNARYLIST.MODES[args[1]];
                            userPresets[currentStats.presetId].mode = currentStats.mode;
                            break;
                        case 'boostsByReloads':
                            if(!args[1]) break;
                            currentStats.boostsByReloads = args[1];
                            userPresets[currentStats.presetId].boostsByReloads = currentStats.boostsByReloads;
                            break;
                    
                        default:
                            break;
                    }
                    onEditedStat();
                    break;
                    
                case 'editShortcut':
                    gameAPI.keyboard.askUserForCustomInput({modName: exports.modInfos.modName}).then( newKey =>{
                        // If cancelled
                        if(!newKey) return;

                        userPreferences.shortcut = newKey;
                        saveAttrFile();

                        gameAPI.keyboard.editEventKeyId(exports.modInfos.modName, 'active-boost', userPreferences.shortcut);
                        if(customWindow) customWindow.webContents.send('startContent', 'preferences', userPreferences);
                    });
                    break;
                    
                case 'editToolShortcut':
                    gameAPI.keyboard.askUserForCustomInput({modName: exports.modInfos.modName}).then( newKey =>{
                        // If cancelled
                        if(!newKey) return;

                        // If already created the shortcuts before:
                        if(userPreferences.toolsBaseShortcut) {
                            userPreferences.toolsBaseShortcut = newKey;

                            gameAPI.keyboard.editEventKeyId(exports.modInfos.modName, 'tool-driftcontrol', [userPreferences.toolsBaseShortcut, 'D']);
                            gameAPI.keyboard.editEventKeyId(exports.modInfos.modName, 'tool-size-up', [userPreferences.toolsBaseShortcut, 'W']);
                            gameAPI.keyboard.editEventKeyId(exports.modInfos.modName, 'tool-size-down', [userPreferences.toolsBaseShortcut, 'S']);
                            gameAPI.keyboard.editEventKeyId(exports.modInfos.modName, 'tool-size-down', [userPreferences.toolsBaseShortcut, 'S']);
                            gameAPI.keyboard.editEventKeyId(exports.modInfos.modName, 'rotation-boost', [userPreferences.toolsBaseShortcut, userPreferences.toolsBaseShortcut]);
                        } else {
                            // Create the shortcuts:
                            userPreferences.toolsBaseShortcut = newKey;
                            gameAPI.keyboard.onInput(exports.modInfos.modName, 'tool-driftcontrol', [userPreferences.toolsBaseShortcut, 'D'], onPressedChangeDriftShortcut);
                            gameAPI.keyboard.onInput(exports.modInfos.modName, 'tool-size-up', [userPreferences.toolsBaseShortcut, 'W'], onPressedChangeSizeShortcutUP);
                            gameAPI.keyboard.onInput(exports.modInfos.modName, 'tool-size-down', [userPreferences.toolsBaseShortcut, 'S'], onPressedChangeSizeShortcutDOWN);
                            gameAPI.keyboard.onInput(exports.modInfos.modName, 'rotation-boost', [userPreferences.toolsBaseShortcut, userPreferences.toolsBaseShortcut], onPressedRotationShortcut);
                        }

                        saveAttrFile();

                        if(customWindow) customWindow.webContents.send('startContent', 'preferences', userPreferences);
                    });
                    break;
                    
                case 'load-preset':
                    presetManager.loadWithId(args[0]);
                    break;
                    
                case 'toogle-power':
                    currentStats.enabled = !currentStats.enabled;
                    if(customWindow) customWindow.webContents.send('setIsBoostActive', currentStats.enabled);
                    break;
                    
                case 'newAudioLevel':
                    userPreferences.audioLevel = args[0];
                    saveAttrFile();
                    break;
                
            }
        });
    }


    function setCanEditStats(caneditstatsnow) {
        currentStats.canChangeStats = caneditstatsnow;
        if(caneditstatsnow) presetManager.loadWithId(userPreferences.lastPresetId);
    }


    gameAPI.onlineMod.createClientPlugin({
        name: 'custom-booster',
        onEnable: (pluginAPI) => {

            isServerFrozenLocalPlayer = () => !pluginAPI.canLocalPlayerMove();
            
            currentStats.mode = DICTIONNARYLIST.MODES.CLASSIC;
            currentStats.presetId = -1;
            currentStats.enabled = false;
            currentStats.power = 1.7;
            currentStats.rlTime = 5000;
            currentStats.boostsByReloads = 3;
            currentStats.numberOfBoosts = currentStats.boostsByReloads;

            pluginAPI.events.onCustomMessage('custombooster', (msg) => {
                
                let msgParams = msg.split(' ');

                if(msgParams[1] == null) msgParams[1] = '0';

                let haveEditedSomething = true;

                // Don't let the server editing the stats when the player can edit the stats else the server can edit the saves of the player
                if(msgParams[0] != 'C' && currentStats.canChangeStats) {
                    setCanEditStats( false );
                    haveEditedSomething = 1;
                }
                
                switch (msgParams[0]) {
                    
                    case 'M':{
                        let newMode = parseInt(convertNumberFromMsg(msgParams[1]));
                        if(newMode > 3 || newMode < 0) break;
                        currentStats.mode = newMode;
                        break;}

                    case 'P':
                        let newPower = convertNumberFromMsg(msgParams[1]);
                        if(newPower < -800 || newPower > 800) break;
                        currentStats.power = newPower;
                        break;
                        
                    case 'T':
                        // TO TEST, CAN BUG:
                        let newRLTime = parseInt(convertNumberFromMsg(msgParams[1]));
                        if(newRLTime < 0 || newRLTime > 900000) break;
                        newRLTime = newRLTime < 20 ? 20 : newRLTime;
                        currentStats.rlTime = newRLTime;
                        break;
                    
                    case 'E':
                        currentStats.enabled = msgParams[1] == '1';
                        break;
                        
                    case 'C':
                        let canNowEditP = msgParams[1] == '1';
                        if(currentStats.canChangeStats == canNowEditP) break;
                        setCanEditStats( canNowEditP );
                        break;

                    case 'B':
                        let newBoostsByReloads = parseInt(convertNumberFromMsg(msgParams[1]));
                        if(newBoostsByReloads < 1 || newBoostsByReloads > 50000) break;
                        currentStats.boostsByReloads = newBoostsByReloads;
                        if(currentStats.numberOfBoosts > currentStats.boostsByReloads) currentStats.numberOfBoosts = currentStats.boostsByReloads;
                        break;
                
                    default:
                        if(haveEditedSomething !== 1) haveEditedSomething = false;
                        break;
                }

                if(haveEditedSomething || haveEditedSomething == 1) presetManager.updateWindowPreset();
            });
            
            setCanEditStats( false );
            presetManager.updateWindowPreset();
        },
        onDisable: (pluginAPI) => {
            isServerFrozenLocalPlayer = () => false;
            setCanEditStats( true );
        }
    });


    gameAPI.onConnected(async()=>{
        isGameAPIConnected = true;

        logAnyMsg('Loading presets..');
        
        try {

            if(!require('fs').existsSync(presetsFilePath)) throw "";

            userPresets = JSON.parse(require('fs').readFileSync(presetsFilePath, {encoding: 'utf8'}));

            if(typeof userPresets != 'object') throw "";

        } catch (error) {
            userPresets = {};
        }
        if(!userPresets[1]) userPresets[1] = {power: 1.5, mode: DICTIONNARYLIST.MODES.MULTIPLIER, rlTime: 100, boostsByReloads: 3};
        if(!userPresets[2]) userPresets[2] = {power: 0.7, mode: DICTIONNARYLIST.MODES.CLASSIC, rlTime: 100, boostsByReloads: 3};
        if(!userPresets[3]) userPresets[3] = {power: 2.5, mode: DICTIONNARYLIST.MODES.CLASSIC, rlTime: 3000, boostsByReloads: 3};
        if(!userPresets[4]) userPresets[4] = {power: 2, mode: DICTIONNARYLIST.MODES.MULTIPLIER, rlTime: 3000, boostsByReloads: 3};
        
        
        logAnyMsg('Loading preferences..');

        try {

            if(!require('fs').existsSync(saveAttrsPath)) throw "";

            userPreferences = JSON.parse(require('fs').readFileSync(saveAttrsPath, {encoding: 'utf8'}));

            if(typeof userPreferences != 'object') throw "";

        } catch (error) {
            userPreferences = {};
        }

        userPreferences.lastPresetId = userPreferences.lastPresetId || 1;
        userPreferences.shortcut = userPreferences.shortcut || 'RIGHT SHIFT';
        userPreferences.audioLevel = typeof userPreferences.audioLevel != 'number' ? 0.5 : userPreferences.audioLevel;


        logAnyMsg('All files loaded!');
        
        logAnyMsg('Adding shortcuts..');
        
        // gameAPI.keyboard.onInput(exports.modInfos.modName, 'active-boost', userPreferences.shortcut, (ev) => {
            
        //     if(ev.state != 'DOWN') return;
            
        //     if(gameAPI.interface.isAppHidden()) {
        //         onBoostApplied();
        //         return;
        //     }
        //     logAnyMsg('CANNOT ENABLE THE BOOST');
        // });
        
        gameAPI.keyboard.onInput(exports.modInfos.modName, 'active-boost', userPreferences.shortcut, (ev) => {
            
            if(ev.state != 'DOWN') return;
            
            if(gameAPI.interface.isAppHidden()) {
                onBoostApplied();
                return;
            }
            // logAnyMsg('CANNOT ENABLE THE BOOST');
        });

        presetManager.loadWithId(userPreferences.lastPresetId) || presetManager.loadWithId(1);


        spawnWindow();

        if(userPreferences.toolsBaseShortcut) {
            gameAPI.keyboard.onInput(exports.modInfos.modName, 'tool-driftcontrol', [userPreferences.toolsBaseShortcut, 'D'], onPressedChangeDriftShortcut);
            gameAPI.keyboard.onInput(exports.modInfos.modName, 'tool-size-up', [userPreferences.toolsBaseShortcut, 'W'], onPressedChangeSizeShortcutUP);
            gameAPI.keyboard.onInput(exports.modInfos.modName, 'tool-size-down', [userPreferences.toolsBaseShortcut, 'S'], onPressedChangeSizeShortcutDOWN);
            gameAPI.keyboard.onInput(exports.modInfos.modName, 'rotation-boost', [userPreferences.toolsBaseShortcut, userPreferences.toolsBaseShortcut], onPressedRotationShortcut);
        }

    });
    
    gameAPI.onDisconnected(async(ev)=>{
        isGameAPIConnected = false;
        if(customWindow) customWindow.close();
    });


}