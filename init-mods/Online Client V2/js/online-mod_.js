
let maxPlayerNumber = 25;

// THE VERSIONS CANNOT BE LIKE "1.2.3" BUT "1.2"/"1.3"/"0.4"...
const clientVersion = "0.8";



let onlinePlayers = {
    /**
     * @param {Number} plyrid 
     * @returns {Player}
     */
    get: (plyrid) => {
        let plyr = onlinePlayers[plyrid];
        if(plyr) return plyr;
        plyr = new Player(plyrid);
        onlinePlayers[plyrid] = plyr;
        return plyr;
    },
    forEach: (cllbackfunc) => {
        let plyrIndexKey = 0;
        while (plyrIndexKey <= maxPlayerNumber) {
            const plyr = onlinePlayers[plyrIndexKey];
            if(plyr && typeof plyr != 'function') cllbackfunc(plyr);
            plyrIndexKey++;
        }
        // for (const key in onlinePlayers) {
        //     const plyr = onlinePlayers[key];
        //     if(plyr && typeof plyr != 'function') cllbackfunc(plyr);
        // }
    },
    clearAllElements: () => {
        for (const key in onlinePlayers) {
            const plyr = onlinePlayers[key];
            if(typeof plyr != 'function') onlinePlayers[key] = null;
        }
    }
};



/**
 * 
 * NOTE: NO FUNCTION IN "msgFuncs" CAN RETURN Infinity OR NaN BECAUSE THE (number || 0) RETURN 0 IF IT'S NaN OR Infinity
 * 
 */

const msgFuncs = {

    toPosMsg: (x, y, z, rot) => {
        return msgFuncs.toPosPartMsg(x) + msgFuncs.toPosPartMsg(y) + msgFuncs.toPosPartMsg(z) + (rot != null ? msgFuncs.toSmallMsg(rot) : '');
    },

    parsePosMsg: (msg) => {
        return {
            x: msgFuncs.toPosNumber(msg),
            y: msgFuncs.toPosNumber(msg.slice(2)),
            z: msgFuncs.toPosNumber(msg.slice(4)),
            rot: msg.length >= 7 ? msgFuncs.toSmallNumb(msg[6]) : null
        }
    },

    // Server function
    toUpdateMsg: (plyrid, msgtype, msgnumber) => {
        return 'U' + msgFuncs.toSmallMsg(plyrid) + msgtype + msgFuncs.toSmallMsg(msgnumber);
    },
    
    toPosPartMsg: numberToSend => {

        let intNumberPart = parseInt(numberToSend);

        if(intNumberPart < 0) return String.fromCharCode(intNumberPart + 810)  +  String.fromCharCode(parseInt((numberToSend - intNumberPart) * -1000) + 10);

        return String.fromCharCode(intNumberPart + 810)  +  String.fromCharCode(parseInt((numberToSend - intNumberPart) * 1000) + 10);
    },
    
    toPosNumber: msg => {

        let resultC = (msg.charCodeAt(0) || 0) - 810;
        if(resultC < -800 || resultC > 1000) return 0;

        let secondResult = (msg.charCodeAt(1) || 10) - 10;
        if(secondResult < 0 || secondResult > 999) secondResult = 0;

        if(resultC < 0) return resultC + (secondResult * -0.001);

        return resultC + (secondResult * 0.001);
    },
    
    // Must return an integer
    toSmallNumb: msg => {
        let resultC = (msg.charCodeAt(0) || 10) - 10;
        if(resultC < 0 || resultC > 1000) return 0;
        return resultC;
    },

    // attrNumber: max=1000 min=0
    toSmallMsg: attrNumber => String.fromCharCode(attrNumber + 10)
};

const positionManager = {
    isPositionDangerous: (x, y, z) => {
        if(y < -20 || y > 90) return true;
        if(x < -450 || x > 660) return true;
        if(z < -450 || z > 450) return true;
        return false;
    },
    toGScriptPos: (x, y, z) => {
        return {
            x: parseInt((x + 2000) * 1000),
            y: parseInt((y - 0.21 + 2000) * 1000),
            z: parseInt((z + 2000) * 1000),
        }
    }
};

let gameAPI;

let isConnectingToServer = false;

let sendToGameAPI = () => {};

let clientPluginsEvents = {
    onChangeParty: [],
    onCustomMsg: [],
    onAnyMsg: []
};

let vehicleManager = require('./v-manager');

let clientSave = {};
const clientSavePath = require('path').join(__dirname, 'client-save.json');

function saveClientFile() {
    logClientMsg('saving client-save.json..');
    require('fs').writeFileSync(clientSavePath, JSON.stringify(clientSave), {encoding: 'utf8'});
    logClientMsg('client-save.json saved!');
}

class Player {
    constructor(playerId, plyrSocket) {
        this.id = playerId;

        this.isVisibleOnMap = true;
        
        this.tags = {}; // for that the plugins can save custom infos in the player instances

        this.socket = plyrSocket;

        this.anim = 0;
        this.disguise = 0;// NOT USED
        this.vehicle = 0;

        this.isCharCreature = false;
        
        this.rot = 0;
        this.pos = {
            x: 0,
            y: 0,
            z: 0
        };

        // For save that for example the client need to update the vehicle of a player
        this.updates = [];
    }

    distanceTo(otherpos) {
        if(otherpos.pos) otherpos = otherpos.pos;
        let totalDist = this.pos.x - otherpos.x;
        if(totalDist < 0) totalDist *= -1;
        
        let otherDistPart = this.pos.y - otherpos.y;
        if(otherDistPart < 0) otherDistPart *= -1;

        totalDist += otherDistPart;
        
        otherDistPart = this.pos.z - otherpos.z;
        if(otherDistPart < 0) otherDistPart *= -1;

        totalDist += otherDistPart;

        return totalDist;
    }

    distanceWithoutY(otherpos) {
        if(otherpos.pos) otherpos = otherpos.pos;
        let totalDist = this.pos.x - otherpos.x;
        if(totalDist < 0) totalDist *= -1;
        
        let otherDistPart = this.pos.z - otherpos.z;
        if(otherDistPart < 0) otherDistPart *= -1;

        totalDist += otherDistPart;

        return totalDist;
    }
    
    setIsVisibleOnMap (isvisiblenow) {
        this.isVisibleOnMap = isvisiblenow;
        
        sendToGameAPI('MPLYR', this.id, isvisiblenow ? 1 : 0);
    }
};

const animsList = require('./anims');

function logClientMsg(msg) {
    console.log('[client]:', msg);
}



function convertNumberFromMsg(numbermsg) {
    try {
        let newNumber = parseFloat(numbermsg);
        if(Number.isNaN(numbermsg)) return 0;
        if(Number.MAX_SAFE_INTEGER > newNumber && Number.MIN_SAFE_INTEGER < newNumber) return newNumber;
        newNumber = null;
        return 0;
    } catch (error) {
        logClientMsg('ERROR WHILE PARSING NUMBER :');
        logClientMsg(error);
        return 0;
    }
}

let isSendingMsg = false;

const customScriptCObj = {
    id: 'ONLINE_E_ACTIONS',
    maxWaitingTime: 8000
};

let onlineClientWindow;

/****************************************
 *       When the game is started       *
 ****************************************/
exports.onStart = async () => {
    gameAPI = exports.modInfos.gameScriptToJSAPI;
    const {gameMemory} = gameAPI;

    sendToGameAPI = (...args) => {
        if(gameAPI && gameAPI.sendMessage && isGameAPIConnected) gameAPI.sendMessage(customScriptCObj, ...args);
    }
    
    let intervalUpdateToServer;

    isConnectingToServer = false;

    // *********** Load the custom client save file : ***********

    try {
        if(require('fs').existsSync( clientSavePath )) {
            clientSave = require( clientSavePath );
        } else {
            clientSave = null;
        }
    } catch (error) {
        logClientMsg('---- ERROR WHILE LOADING SAVE : ----');
        console.error(error);
    }
    if(!clientSave) clientSave = {};
    clientSave.shortcuts = clientSave.shortcuts || {};
    clientSave.shortcuts.emotes = clientSave.shortcuts.emotes || 'B';
    clientSave.shortcuts.toogleWeapons = clientSave.shortcuts.toogleWeapons || 'NUMPAD 8';
    clientSave.shortcuts.specialAttack = clientSave.shortcuts.specialAttack || 'G';

    if(typeof clientSave.autoUpdateDisguise != 'boolean') clientSave.autoUpdateDisguise = (!!clientSave.autoUpdateDisguise);


    isSendingMsg = false;

    let localPlayer = {
        id: -1,
        disguise: 0,
        disguiseId: '',
        isLocked: false,
        anim: 0,
        isDed: false,
        lastAnimInitId: 0,
        vehicle: null,
        vehicleId: 0,
        rot: 0,
        pos: {
            x:0,
            y:0,
            z:0
        },
        // attackRange: 0.125,
        attackRange: 0.15,
        currentPartyId: "", // "" = no party, "party_123" = is in the party "party_123"
        isCDisabled: false
    };

    // let localPlayerId = -1;
    
    let serverURL = '';
    
    let clientWebsocket;
    let connectionState = 0;
    let isGameAPIConnected = false;

    let isGameStopped = false;

    let disguiseSpecialN = 85;
    
    function useSpecialCode(textToEdit, specialCode) {
        let generatedText = "";
        for (let index = 0; index < textToEdit.length; index++) {
            generatedText += String.fromCharCode(
                textToEdit.charCodeAt(index) + specialCode
            );
        }
        return generatedText;
    }

    let canSendSpecialAttack = true;

    function specialAttackEvent(ev) {

        if(ev.state != 'DOWN' || canSendSpecialAttack == false || isGameAPIConnected == false) return;
        
        if(gameAPI.interface.isAppHidden()) {
            canSendSpecialAttack = false;
            
            if(connectionState != 2) {
                sendToGameAPI('SPECIALACTION');
            } else if(clientWebsocket) {
                clientWebsocket.send('AA');
            }

            setTimeout(() => {
                canSendSpecialAttack = true;
            }, 150);
            
        }
    }
    
    // If this file can't update a player because this file is already updating a player, the player will be added to this list and will be updated after
    let firstPlayersToUpdate = [];

    function closeWebsocket() {
        if(clientWebsocket) clientWebsocket.close();
    }

    // Executed when disconnected or unloaded the city
    function onOnlineStopped() {

        logClientMsg('ONLINE STOPPED');
        
        localPlayer.isLocked = false;
        localPlayer.isCDisabled = false;


        // Reset all attributes that the server can edit
        if(connectionState == 0) {
            // Reset the attack range because the server can edit it
            localPlayer.attackRange = 0.15;
            
            // Reset attributes edited with the custom game script
            if(isGameAPIConnected && (!isGameStopped)) {
                sendToGameAPI('DISCONNECTED');
            }
            
            if(onlineClientWindow) onlineClientWindow.webContents.send('server-buttons', 'removeall');
        }

        gameAPI.onlineMod.clientPlugins.forEach(
            pluginObj => {
                if(pluginObj.onDisable) pluginObj.onDisable(pluginAPI(pluginObj));
            }
        );
        onlinePlayers.clearAllElements();

        localPlayer.id = -1;
    }

    if(require('fs').existsSync(require('path').join(exports.modInfos.gamePath,'STUFF/THINGS.DNO'))) {
        disguiseSpecialN = parseInt((require('fs').readFileSync(require('path').join(exports.modInfos.gamePath,'STUFF/THINGS.DNO'), {encoding:'hex'}) + '')[15]);
    }

    function setNewConnectionState(newconnectionstate) {
        connectionState = newconnectionstate;

        // If is connected with the server after stopped the game or that the user closed the window
        if(connectionState != 0 && (isGameStopped || onlineClientWindow == null)) {
            closeWebsocket();
            return;
        }

        switch (newconnectionstate) {
            case 0:
                break;
                
            case 1:
                isConnectingToServer = false;
                if(isGameAPIConnected) setNewConnectionState(2);
                break;
                
            case 2:{

                // When the city is loaded and that the client is connected
                // clientWebsocket.send("AS2");
                gameAPI.onlineMod.clientPlugins.forEach(pluginObj => {
                    if(pluginObj.onEnable) pluginObj.onEnable(pluginAPI(pluginObj));
                });
                
                if(onlineClientWindow) {
                    onlineClientWindow.webContents.send('stat', 'client', {
                        connectionState: connectionState
                    });
                }
                
                sendToGameAPI('JOINEDSERVER');
                localPlayer.isCDisabled = true;

                setTimeout(() => {
                    if(connectionState != 2) return;

                    if(clientSave.autoUpdateDisguise) {
                        updateDisguise();
                    }
                }, 250);
                break;}
        }
    }
    
    require('./char-manager').loadList(exports.modInfos.gamePath);

    function updateDisguise(newdisguiseid) {

        function onCannotUpdateD(custommsgerr) {
            if(onlineClientWindow) onlineClientWindow.webContents.send('other', 'updatedisguise', 0);
            gameAPI.interface.showMessage(custommsgerr || "Error: cannot update the disguise (don't report this bug it's common)");
            return false;
        }

        const charManager = require('./char-manager');

        let disguiseObj = null;

        if(!newdisguiseid) {
            let disguiseANumber = 1;
            while (!newdisguiseid) {
                
                gameAddresses["disguise_id_" + disguiseANumber].reload();

                newdisguiseid = gameMemory.read(gameAddresses["disguise_id_" + disguiseANumber].result, 'STRING');
                if(typeof newdisguiseid == 'string' && newdisguiseid.replace(/[^a-zA-Z0-9_ ]/g, '').length > 2) break;
                disguiseANumber++;
                if(disguiseANumber > 4) return onCannotUpdateD();
            }
            if( charManager.isCustomChar(newdisguiseid) ) return onCannotUpdateD('You cannot use a custom character in a server');
            disguiseObj = charManager.getCharWithId(newdisguiseid);
        } else {
            disguiseObj = charManager.getCharWithKeyWord(newdisguiseid);
            if( disguiseObj && charManager.isCustomChar(disguiseObj.id) ) return onCannotUpdateD('You cannot use a custom character in a server');
        }
        
        if(!disguiseObj) return onCannotUpdateD();
        if(disguiseObj.class.toLowerCase().includes('player')) return onCannotUpdateD("Error: you cannot use a default character in an online server");

        localPlayer.disguiseId = disguiseObj.id;
        
        newdisguiseid = useSpecialCode(disguiseObj.id, disguiseSpecialN);
        
        if(onlineClientWindow) {
            // onlineClientWindow.webContents.send('stat', 'client', {
            //     disguise: localPlayer.disguiseId
            // });
            onlineClientWindow.webContents.send('other', 'updatedisguise', 1);
        }

        if(connectionState == 2 && clientWebsocket) clientWebsocket.send('AD'+newdisguiseid);

        return true;
    }
    

    function spawnClientWindow() {
        
        if(onlineClientWindow) return;

        onlineClientWindow = gameAPI.interface.createMenu(
            require('path').join(__dirname, 'interface/main-window/index.html'),
            require('path').join(__dirname, 'interface/main-window/preload.js')
        );
        
        onlineClientWindow.webContents.on('dom-ready', () => {
            if(!onlineClientWindow) return;
            onlineClientWindow.webContents.send('stat', 'client', {
                connectionState: connectionState
            });
            
            onlineClientWindow.webContents.send('other', 'emotes', require('./emote-manager').displayEmotes);
            onlineClientWindow.webContents.send('other', 'emoteShortcut', clientSave.shortcuts.emotes);

            onlineClientWindow.webContents.send('stat', 'plyrid', connectionState == 0 ? '?' : localPlayer.id);
            onlineClientWindow.webContents.send('stat', 'version', clientVersion);
            
            onlineClientWindow.webContents.send('other', 'playerSettings', {
                autoUpdateDisguise: clientSave.autoUpdateDisguise,
                autoJoinServer: clientSave.autoJoinServerURL || "",
            });
        });

        let intervalPosUpdate = setInterval(() => {
            if(onlineClientWindow && isGameAPIConnected) onlineClientWindow.webContents.send('stat', 'pos', `X: ${localPlayer.pos.x.toFixed(2)} | Y: ${localPlayer.pos.y.toFixed(2)} | Z: ${localPlayer.pos.z.toFixed(2)}`);
        }, 1250);

        //require('electron').app.focus();
        

        onlineClientWindow.once('close', () => {
            onlineClientWindow = null;
            closeWebsocket();
            if(intervalPosUpdate != null) clearInterval(intervalPosUpdate);
            intervalPosUpdate = null;
        });

        
        let canUseMenu = true;

        // Handle the connection with the menu :
        onlineClientWindow.webContents.on('ipc-message', (ev, channelMsg, ...args) => {
            if(!canUseMenu) return;
            
            switch (channelMsg) {
                
                case 'serv-button-pressed':
                    if(connectionState == 2 && clientWebsocket) clientWebsocket.send('AB'+args[0]);
                    break;
                
                case 'toogle-w':
                    sendToGameAPI("TOOGLEWEAPONS");
                    break;

                case 'toogle-ui':
                    sendToGameAPI("TOOGLEUI");
                    break;
                
                case 'changeConnection':
                    
                    if(connectionState == 0) {
                        showConnectionMenu();
                        break;
                    }
                    closeWebsocket();
                    break;
                    
                case 'disguise':{
                    
                    switch (args[0]) {
                        
                        case 'search':
                            console.log(
                                require('./char-manager').getCharWithKeyWord((args[1]+'').split(','))
                            );
                            break;
                            
                        case 'update':
                            updateDisguise();
                            break;

                        case 'set':
                            updateDisguise(args[1]);
                            break;
                            
                        case 'searchWithId':
                            console.log(
                                require('./char-manager').getCharWithId(args[1])
                            );
                            break;
                        
                        case 'OLDsearch':
                            let disguiseKeyWords = (args[1]+'').toLowerCase().replace(/ /g, '').replace(/\r/g, '').split(',');
                            if(!require('fs').existsSync(require('path').join(exports.modInfos.gamePath,'STUFF/AI/AITYPES.TXT'))) break;
                            let totalList = require('fs').readFileSync(require('path').join(exports.modInfos.gamePath,'STUFF/AI/AITYPES.TXT'), {encoding:'utf8'}) + '';
                            let lastCharClass = '';
                            let finalCharNames;
                            while (true) {
                                let nextIndex = totalList.indexOf('\n');
                                if(nextIndex == -1) break;
                                let nextLine = (totalList.slice( 0, nextIndex )).replace(/ /g, '').replace(/\r/g, '');
                                totalList = totalList.slice( nextIndex );
                                if(nextLine) {
                                    if(nextLine.startsWith('Vehicle.')) {
                                        lastCharClass = '';
                                        nextIndex = totalList.indexOf('}');
                                        if(nextIndex == -1) break;
                                        totalList = totalList.slice(nextIndex);
                                    }
                                    else if(nextLine.startsWith('Character.')) {
                                        lastCharClass = nextLine.replace('Character.', '').split('"', 1)[0];
                                    }
                                    else if(lastCharClass) {
                                        let charNames = nextLine.split('","', 2);
                                        let keyWordsOk = true;
                                        for (let index = 0; index < disguiseKeyWords.length; index++) {
                                            if((charNames[0]||'').toLowerCase().includes(disguiseKeyWords[index]) == false) {
                                                keyWordsOk = false;
                                                break;
                                            }
                                        }
                                        if(
                                            keyWordsOk
                                        //   NOT WORK : -> (charNames[0]||'').toLowerCase().includes(disguiseKeyWords) || (charNames[1]||'').toLowerCase().includes(disguiseKeyWords)
                                        ) {
                                            finalCharNames = charNames;
                                            break;
                                        }
                                    }
                                }
                            }
                            if(finalCharNames) {
                                logClientMsg('SIMILAR CHAR NAME FOUND');
                                logClientMsg('CLASS=' + lastCharClass + ' NAME=' + finalCharNames);
                                break;
                            }
                            logClientMsg('NO SIMILAR CHAR NAME FOUND');
                            break;
                    
                        default:
                            break;
                    }
                    break;}
            
                case 'editEmoteShortcut':
                    gameAPI.keyboard.askUserForCustomInput({modName: exports.modInfos.modName}).then( newKey =>{
                        // If cancelled
                        if(!newKey) return;

                        clientSave.shortcuts.emotes = newKey;
                        saveClientFile();
                        
                        require('./emote-manager').setVars(gameAPI, clientSave, sendToGameAPI, exports.modInfos.modName);
                        require('./emote-manager').reloadKeys();
                        
                        if(onlineClientWindow) onlineClientWindow.webContents.send('other', 'emoteShortcut', clientSave.shortcuts.emotes);
                    });
                    break;
            
                case 'editSpecialAttackKey':
                    gameAPI.keyboard.askUserForCustomInput({modName: exports.modInfos.modName}).then( newKey =>{
                        // If cancelled
                        if(!newKey) return;

                        clientSave.shortcuts.specialAttack = newKey;
                        saveClientFile();
                        
                        gameAPI.keyboard.editEventKeyId(
                            exports.modInfos.modName,
                            'special-attack',
                            clientSave.shortcuts.specialAttack
                        );
                        
                    });
                    break;
                
                case 'playerSettings': {

                    let playerSettings = args[0];

                    clientSave.autoJoinServerURL = playerSettings.autoJoinServer;

                    clientSave.autoUpdateDisguise = playerSettings.autoUpdateDisguise;

                    if(onlineClientWindow) {
                        onlineClientWindow.webContents.send('other', 'playerSettings', {
                            autoUpdateDisguise: clientSave.autoUpdateDisguise,
                            autoJoinServer: clientSave.autoJoinServerURL || "",
                        });
                    }

                    saveClientFile();
                    break;}
                    
                case 'updateplayerposes': {

                    gameAPI.player.reloadPlayerAddr();
                    break;}
                    
                case 'TIMERMODE': {

                    sendToGameAPI('TIMERMODE', args[0]||0);
                    break;}
            }
        });
    }

    let playerCurrentlyUpdating = null;

    /**
     * @param {Player} playerToUpdate 
     */
    async function updateGamePlayer(playerToUpdate) {

        // Waiting that we can communicate with the game
        if(isSendingMsg) {
            if(playerCurrentlyUpdating == playerToUpdate) return;
            if(!firstPlayersToUpdate.includes(playerToUpdate)) firstPlayersToUpdate.push(playerToUpdate);
            return;
        }

        isSendingMsg = true;
        playerCurrentlyUpdating = playerToUpdate;

        while (gameMemory.read(gameAddresses.act3_stage.result, 'UINT32') != 1001) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 25);
            });
        };

        // let plyrPos = {...playerToUpdate.pos};
        let plyrPos = playerToUpdate.pos;

        let updateType = '';
        let lastPartMsg = '';

        if(playerToUpdate.updates.length > 0) {
            
            switch (playerToUpdate.updates.shift()) {
                case 'A':
                    updateType = '1';
                    lastPartMsg = playerToUpdate.anim;
                    if(playerToUpdate.isCharCreature) lastPartMsg = 0;
                    break;
                case 'V':
                    updateType = '3';
                    lastPartMsg = playerToUpdate.vehicle;
                    break;
                case 'D': // Old disguise system (not used)
                    updateType = '2';
                    lastPartMsg = playerToUpdate.disguise;
                    break;
                
                default: // normally this part is never executed :
                    updateType = '0';
                    lastPartMsg = playerToUpdate.rot;
                    break;
            }

        } else {
            updateType = '0';
            lastPartMsg = playerToUpdate.rot;
        }

        lastPartMsg += '';

        while (lastPartMsg.length < 3) {
            lastPartMsg = '0' + lastPartMsg;
        };

        if(lastPartMsg.length > 3) {
            logClientMsg('Error: int-g-msg too much long, size: ' + lastPartMsg.length);
            return;
        }

        lastPartMsg = parseInt((playerToUpdate.id+'') + updateType + lastPartMsg);

        // logClientMsg('int-g-msg: ' + lastPartMsg);
        
        // // FOR TESTS
        // playerToUpdate.rot = '000';
        // console.log('[client] stage number: ', parseInt(playerToUpdate.id + '0' + playerToUpdate.rot));

        plyrPos = positionManager.toGScriptPos(plyrPos.x, plyrPos.y, plyrPos.z);

        gameMemory.write(gameAddresses.act4_mission.result, plyrPos.x, 'UINT32');
        gameMemory.write(gameAddresses.act4_stage.result, plyrPos.y, 'UINT32');
        gameMemory.write(gameAddresses.act3_mission.result, plyrPos.z, 'UINT32');
        gameMemory.write(
            gameAddresses.act3_stage.result,
            lastPartMsg,
            'UINT32');
        // gameMemory.write(
        //     gameAddresses.act3_stage.result,
        //     0,
        //     'UINT32');
        let nextPlyrToUp = firstPlayersToUpdate.shift();
        
        if(playerToUpdate == nextPlyrToUp) {
            // If already updated this player, update another player
            nextPlyrToUp = firstPlayersToUpdate.shift();
        }
        isSendingMsg = false;
        if(nextPlyrToUp != null) updateGamePlayer(nextPlyrToUp);
    }


    // Ask the user the url of the server, if "newserverurl" is a string not asking the user but trying to connect with this url
    async function showConnectionMenu(newserverurl) {

        let continueConnection = await new Promise((resolve, reject) => {

            if(newserverurl && typeof newserverurl == "string") {
                serverURL = newserverurl;
                resolve(true);
                return;
            }

            gameAPI.interface
            .showTextQuestion('Enter the server url (to connect in your own server enter localhost:3001)', 'Join').then(
                res => {
                    if(!res) {
                        // the user decided to not connect
                        resolve(false);
                        return;
                    }
                    serverURL = res;
                    resolve(true);
                }
            ).catch(err => {
                console.error(err);
                resolve(false);
            });
        });

        if(!continueConnection) {
            
            if(onlineClientWindow) {
                onlineClientWindow.webContents.send('stat', 'client', {
                    connectionState: connectionState
                });
            }
            return;
        }

        // Open the rules
        const http = require('http');

        function sendHTTPRequest(requestParams) {
            return new Promise((resolve, reject) => {

                let maxSizeThatCanReceive = requestParams.maxSizeThatCanReceive || 10000;
                
                http.get(requestParams.url, (res) => {
                
                    function cancelReq() {
                        
                        // Consume response data to free up memory
                        res.resume();
                        
                        reject();
                    }

                    if(res.statusCode != 200) return cancelReq();
                    
                    res.setEncoding('utf8');
                    
                    let cancelRBecauseSize = false;
                    let rawData = '';
                    
                    res.on('data', (chunk) => {
                        if(cancelRBecauseSize) return;
                        
                        rawData += chunk;

                        if(rawData.length > maxSizeThatCanReceive) {
                            rawData = '';
                            cancelRBecauseSize = true;
                        }
                    });
                    
                    res.on('end', () => {

                        if(cancelRBecauseSize) return reject();
                        
                        return resolve(rawData);
                    });

                }).on('error', (e) => {
                    reject();
                });
            })
        }
        
        
        continueConnection = await (
            new Promise((resolve, reject) => {
                sendHTTPRequest({
                    url: 'http://' + serverURL + '/server-profile.json',
                    maxSizeThatCanReceive: 1000
                }).then(res => {

                    try {
                        res = JSON.parse(res+'');
                        if((!res) || typeof res != 'object') throw "";
                    } catch (error) {
                        gameAPI.interface.showMessage('Impossible to connect: error while trying to get the server-profile.json\nJSON SYNTAXE ERROR');
                        resolve(false);
                        return;
                    }
                    
                    let clientVersionNumber = parseFloat(clientVersion);
                    
                    if(typeof res.bannedVersions == 'string') {
                        
                        if(res.bannedVersions.split(' ').includes(clientVersion)) {
                            resolve(false);
                            return;
                        }

                    }

                    if(typeof res.lowerVersion == 'string') {
                        let numberLowerV = convertNumberFromMsg(res.lowerVersion);
                        
                        if(clientVersionNumber < numberLowerV) {

                            if(typeof res.allowedVersions == 'string') {
                        
                                if(!res.allowedVersions.split(' ').includes(clientVersion)) {
                                    resolve(false);
                                    return;
                                }

                            }
                        }

                        numberLowerV = null;
                    }


                    if(typeof res.upperVersion == 'string') {
                        let numberLowerV = convertNumberFromMsg(res.upperVersion);
                        
                        if(clientVersionNumber > numberLowerV) {

                            if(typeof res.allowedVersions == 'string') {
                        
                                if(!res.allowedVersions.split(' ').includes(clientVersion)) {
                                    resolve(false);
                                    return;
                                }

                            }
                        }

                        numberLowerV = null;
                    }

                    resolve(1);
                }).catch(()=>{
                    gameAPI.interface.showMessage('Impossible to connect: verify the url or your internet connection');
                    resolve(-1);
                })
            })
        );
        
        if(continueConnection !== 1) {
            
            if(continueConnection === false) gameAPI.interface.showMessage("The version of your client isn't allowed in this server.");

            if(onlineClientWindow) {
                onlineClientWindow.webContents.send('stat', 'client', {
                    connectionState: connectionState
                });
            }
            return;
        }


        continueConnection = await new Promise((resolve, reject) => {

            const maxSizeOfRules = 10000;
            
            http.get('http://' + serverURL + '/rules.txt', (res) => {
            
                function cancelReq() {

                    gameAPI.interface.showMessage('Impossible to connect: error while trying to get the rules.txt. Status code : ' + res.statusCode);
                    
                    // Consume response data to free up memory
                    res.resume();
                    
                    resolve(false);
                }

                if(res.statusCode != 200) return cancelReq();
                
                res.setEncoding('utf8');
                
                let cancelRBecauseSize = false;
                let rawData = '';
                
                res.on('data', (chunk) => {
                    if(cancelRBecauseSize) return;
                    
                    rawData += chunk;

                    if(rawData.length > maxSizeOfRules) {
                        rawData = '';
                        cancelRBecauseSize = true;
                    }
                });
                
                res.on('end', () => {

                    if(cancelRBecauseSize) return resolve(false);

                    logClientMsg('Rules loaded');
                    
                    if(!rawData) return resolve(true);

                    require('./rules-window').showRules(rawData, gameAPI)
                        .then((resOfUser)=>{
                            resolve(resOfUser);
                        })
                        .catch(()=>{
                            resolve(false);
                        });

                });

            }).on('error', (e) => {
                logClientMsg('Error while trying to get the rules.txt :');
                console.error(e.message);
                resolve(false);
                gameAPI.interface.showMessage('Impossible to connect: error while trying to get the rules.txt');
            });

        });

        if(!continueConnection) {
            
            if(onlineClientWindow) {
                onlineClientWindow.webContents.send('stat', 'client', {
                    connectionState: connectionState
                });
            }
            return;
        }

        
        serverURL = 'ws://' + serverURL;

        // *** When choosed server, connecting : ***

        isConnectingToServer = true;

        let serverCountdown = {
            canSpawnCoin: true,
            canSpecialAttack: true
        };
        
        const WebSocket = require('./required-m-modules/node_modules/ws').WebSocket;
        clientWebsocket = new WebSocket(serverURL);
        // setNewConnectionState(1);
        
        clientWebsocket.on('error', console.error);

        clientWebsocket.on('open', function() {
            isConnectingToServer = false;
            setNewConnectionState(1);
            logClientMsg('Connected with the server!');
            gameAPI.interface.showMessage('Client connected with the server!');
        });
        

        /************************************************************
         *               WHEN CLIENT RECEIVE MESSAGES               *
        /************************************************************/

        clientWebsocket.on('message', (data, isbdata) => {

            if(isbdata) return;
            
            //logClientMsg('received "' + data + '"');

            data += '';
            
            for (let i = clientPluginsEvents.onAnyMsg.length; i > 0; i--) {
                if(clientPluginsEvents.onAnyMsg[i](data) === true) return;
            }

            if(localPlayer.id == -1) {
                // When not connected
                let newPlayerId = parseInt(data);
                if(Number.isNaN(newPlayerId) || newPlayerId < 0 || newPlayerId > maxPlayerNumber) return;
                localPlayer.id = newPlayerId;
                // localPlayerId = newPlayerId;
                logClientMsg('Player id : ' + localPlayer.id);
                
                if(onlineClientWindow) onlineClientWindow.webContents.send('stat', 'plyrid', connectionState == 0 ? '?' : localPlayer.id);
                //gameAPI.interface.showMessage('Player ID : ' + playerId);
                return;
            }

            switch (connectionState) {
                
                case 2:
                    // When city loaded and client connected :
                    
                    switch (data[0]) {

                        // Update player pos and rot :
                        case 'P':{
                            // data = data.split(';', 5); OLD COMMUNICATION

                            if(data.length < 4) break;

                            let playerId = msgFuncs.toSmallNumb(data[1]); //parseInt(convertNumberFromMsg(data[0].slice(1)));

                            if(playerId > maxPlayerNumber || playerId < 0) break;

                            let player = onlinePlayers.get(playerId);

                            let posReceived = msgFuncs.parsePosMsg(data.slice(2));

                            let plyrPosX = posReceived.x; //convertNumberFromMsg(data[1]);
                            let plyrPosY = posReceived.y;
                            let plyrPosZ = posReceived.z;

                            if(positionManager.isPositionDangerous(plyrPosX, plyrPosY, plyrPosZ)) break;

                            player.pos.x = plyrPosX;
                            player.pos.y = plyrPosY;
                            player.pos.z = plyrPosZ;

                            let newRot = posReceived.rot;

                            if(newRot != null) {
                                if(newRot >= 0 && newRot <= 360) player.rot = newRot;
                            }

                            updateGamePlayer(player);
                            break;}
                            
                        // Update plyr other attributs (for example : vehicle, anim..)
                        case 'U':{
                            // data = data.split(';', 2);

                            if(data.length < 4) break;

                            let playerId = msgFuncs.toSmallNumb(data[1]);

                            if(playerId > maxPlayerNumber || playerId < 0) break;

                            let player = onlinePlayers.get(playerId);

                            let attrId = data[2];

                            // let attrValue = parseInt(convertNumberFromMsg(data[1].slice(1))) || 0;
                            let attrValue = msgFuncs.toSmallNumb(data[3]);

                            if(attrValue < 0 || attrValue > 999) attrValue = 0;

                            switch (attrId) {
                                case 'A':
                                    if(player.isCharCreature) attrValue = 0;
                                    if(attrValue == 1) attrValue = 0;
                                    player.anim = attrValue;
                                    break;
                                case 'V':
                                    player.vehicle = attrValue;
                                    break;
                                
                                // Old disguise system
                                // case 'D':
                                //     player.disguise = attrValue;
                                //     break;
                            
                                default:
                                    attrId = false;
                                    break;
                            }

                            if(attrId !== false) {

                                if(!player.updates.includes(attrId)) player.updates.push(attrId);

                                updateGamePlayer(player);
                            }
                            break;}
                            
                        // Received special action
                        case 'A':{
                            let initDataMsg = data;
                            data = data.slice(1).split(';');
                            switch (data[0]) {

                                // Active special-action
                                case 'A':{

                                    if(initDataMsg.length < 3) {
                                        if(!serverCountdown.canSpecialAttack) break;
                                        serverCountdown.canSpecialAttack = false;
                                        sendToGameAPI('SPECIALACTION');
                                        
                                        setTimeout(() => {
                                            serverCountdown.canSpecialAttack = true;
                                        }, 50);
                                        // }, 50 + 700 + 1500);
                                        break;
                                    }

                                    let specialActionId = parseInt(convertNumberFromMsg(initDataMsg[3]));
                                    if(specialActionId < 1 || specialActionId > 800) specialActionId = 1;

                                    let posMsg = msgFuncs.parsePosMsg( initDataMsg.slice(4) );
                                    if(positionManager.isPositionDangerous(posMsg.x,posMsg.y,posMsg.z)) break;
                                    posMsg.rot = posMsg.rot || 0;
                                    if(posMsg.rot > 360) posMsg.rot = 0;

                                    sendToGameAPI('SPAWNPROJECTILE', specialActionId, posMsg.x, posMsg.y, posMsg.z, posMsg.rot);

                                    break;}

                                // Teleport the player :
                                case 'T':{

                                    // let newPosX = convertNumberFromMsg(data[1]);
                                    // let newPosY = convertNumberFromMsg(data[2]);
                                    // let newPosZ = convertNumberFromMsg(data[3]);

                                    let receivedNewPos = msgFuncs.parsePosMsg(initDataMsg.slice(3));
                                    
                                    let newPosX = receivedNewPos.x;
                                    let newPosY = receivedNewPos.y;
                                    let newPosZ = receivedNewPos.z;

                                    if(positionManager.isPositionDangerous(newPosX, newPosY, newPosZ)) break;
                                    
                                    let newRotP = -1;
                                    if(receivedNewPos.rot != null) {
                                        newRotP = receivedNewPos.rot;
        
                                        if(newRotP < 0 || newRotP > 360) newRotP = -1;
                                    }

                                    // let compiledPos = positionManager.toGScriptPos(newPosX, newPosY, newPosZ);
                                    let compiledPos = {
                                        x: newPosX, y: newPosY, z: newPosZ
                                    };

                                    if(newRotP != -1) {
                                        sendToGameAPI('TP', compiledPos.x, compiledPos.y, compiledPos.z, newRotP);
                                    } else {
                                        sendToGameAPI('TP', compiledPos.x, compiledPos.y, compiledPos.z);
                                    }
                                    
                                    // gameAPI.player.position.set(newPosX, newPosY, newPosZ);
                                    break;}

                                // Set if the player can move :
                                case 'F':{
                                    let isLockedP = data[1]+'';
                                    localPlayer.isLocked = isLockedP[0] == '1';
                                    if(localPlayer.isLocked) {
                                        isLockedP = isLockedP.slice(1);
                                        if(isLockedP.length > 20 || isLockedP.length < 1) isLockedP = 'idle';
                                        sendToGameAPI('FREEZE', 1, isLockedP.toLowerCase());
                                        break;
                                    }
                                    sendToGameAPI('FREEZE', 0);
                                    break;}
                                
                                
                                case 'D':{
                                    
                                    let damageNumber = parseInt(convertNumberFromMsg(data[1])) || 0;
                                    if(damageNumber < 0 || damageNumber > 50000) break;
                                    
                                    // It's possible to have a damage of 0, it will just push the player but not remove an HP
                                    sendToGameAPI('DAMAGE', damageNumber);
                                    break;}
                                    
                                case 'K':{
                                    let plyrId = data[1];
                                    
                                    // -1 = auto damage, -2 = remove vehicle, other = delete char
                                    plyrId = parseInt(convertNumberFromMsg(plyrId)) || 0;
                                    if(plyrId < -2 || plyrId > maxPlayerNumber) break;
                                    
                                    sendToGameAPI('KILL', plyrId);
                                    break;}

                                // Set if a player can be visible in the UI map :
                                case 'M':{
                                    let plyrId = data[1];
                                    if(plyrId == '*') {
                                        plyrId = -1;
                                    } else {
                                        plyrId = parseInt(convertNumberFromMsg(plyrId));
                                        if(plyrId < 0 || plyrId > maxPlayerNumber) break;
                                    }
                                    sendToGameAPI('MPLYR', plyrId, data[2] == '1' ? 1 : 0);
                                    break;}
                                
                                // Change party id
                                case 'P':{
                                    localPlayer.currentPartyId = data[1] || '';
                                    clientPluginsEvents.onChangeParty.forEach(ev=>{
                                        ev(localPlayer.currentPartyId);
                                    });
                                    break;}
                                    
                                // Show info
                                case 'S':{
                                    let txtIdToShow = data[1]+'';
                                    let modeToUse = txtIdToShow[0];
                                    txtIdToShow = txtIdToShow.slice(1);
                                    if(txtIdToShow.length < 1 || txtIdToShow.length > 80) break;
                                    txtIdToShow = ({f1:'FOR_PLUGINS_TEXT_TEAM_FREE_1',f2:'FOR_PLUGINS_TEXT_TEAM_FREE_2',t1:'FOR_PLUGINS_TEXT_TEAM_1',t2:'FOR_PLUGINS_TEXT_TEAM_2',u1:'FOR_PLUGINS_TEXT_TEAM_SCORE_UP_1',u2:'FOR_PLUGINS_TEXT_TEAM_SCORE_UP_2',d1:'FOR_PLUGINS_TEXT_TEAM_SCORE_DOWN_1',d2:'FOR_PLUGINS_TEXT_TEAM_SCORE_DOWN_2',d:'FOR_PLUGINS_TEXT_DEFEAT',v:'MISSION_GENERIC_FINDVEHICLE',w:'FOR_PLUGINS_TEXT_WIN',g:'MISSION_GENERIC_COUNTDOWN_GO',1:'MISSION_GENERIC_COUNTDOWN_1',2:'MISSION_GENERIC_COUNTDOWN_2',3:'MISSION_GENERIC_COUNTDOWN_3',p1:'FOR_PLUGINS_TEXT_PARTY_STARTING',p2:'FOR_PLUGINS_TEXT_PARTY_END'})[txtIdToShow];
                                    if(!txtIdToShow) break;
                                    let timeToShow = parseInt(convertNumberFromMsg(data[2]+''));
                                    if(timeToShow < 1 || timeToShow > 10) timeToShow = 1;
                                    sendToGameAPI('TXT', modeToUse == '1' ? 1 : 0 , txtIdToShow, timeToShow);
                                    break;}
                                
                                // Set vehicle
                                case 'V':{

                                    // If the server want to remove the vehicle
                                    if(data.length < 2) {
                                        sendToGameAPI('SETV', "NO");
                                        break;
                                    }
                                    
                                    let vehicleName = data[1]+'';

                                    if(vehicleName == '+') {
                                        sendToGameAPI('SETCANBEINV', 1);
                                        break;
                                    }
                                    if(vehicleName == '-') {
                                        sendToGameAPI('SETCANBEINV', 0);
                                        break;
                                    }
                                    
                                    let isVehicleInvulnerable = vehicleName.includes('%');
                                    let isVehicleLocked = vehicleName.includes('!');
                                    
                                    // Remove special characters except for the "_"
                                    vehicleName = vehicleName.replace(/[^a-zA-Z0-9_ ]/g, "");
                                    
                                    if(data.length < 3) {
                                        vehicleName = parseInt(convertNumberFromMsg(vehicleName)) || 0;
                                        //logClientMsg('new vehicle id : ' + vehicleName)
                                        if(vehicleName < 1 || vehicleName > 10000) break;
                                        
                                        let newVehicleO = vehicleManager.getVehicleById(vehicleName);
                                        //console.log('new plyr vehicle :', newVehicleO);
                                        sendToGameAPI('SETV', newVehicleO.name, newVehicleO.class, isVehicleInvulnerable ? 1 : 0, isVehicleLocked ? 1 : 0);
                                        break;
                                    }

                                    if(
                                        vehicleManager.classes.includes(data[2]) == false
                                    ) break;

                                    if(!vehicleName) break;

                                    sendToGameAPI('SETV', vehicleName, data[2], isVehicleInvulnerable ? 1 : 0, isVehicleLocked ? 1 : 0);

                                    break;}
                                
                                case 'Y':
                                    let charIdSound = initDataMsg[4];

                                    if(!charIdSound) {
                                        charIdSound = -1;
                                    } else {
                                        charIdSound = msgFuncs.toSmallNumb(charIdSound);
                                        if(charIdSound < 0 || charIdSound > maxPlayerNumber) break;
                                    }

                                    sendToGameAPI('SOUND', {p:'studspawn',w:'vo_chase_win_02',b:'drc_callaccept',c:'race_start',f:'race_win',d:'swchar',t:'token_01',g:'satnav_arrivalding',n:'drc_negative',o:'trial_start_01'}[initDataMsg[3]||'p'] || 'studspawn', charIdSound);
                                    break;
                                
                                case 'H':
                                    let newPlyrHP = parseInt(convertNumberFromMsg(initDataMsg[3]));
                                    if(newPlyrHP < 1) break;
                                    if(newPlyrHP > 4) newPlyrHP = 4;

                                    if(initDataMsg[4] == 'V') {
                                        sendToGameAPI('HP', newPlyrHP, 1);
                                    } else {
                                        sendToGameAPI('HP', newPlyrHP);
                                    }
                                    break;

                                // Other rare actions
                                case 'O':{
                                    switch (data[1]) {
                                        
                                        // On player changed disguise
                                        case 'D':
                                            let dPlayerId = parseInt(convertNumberFromMsg(data[2]));
                                            if(dPlayerId > maxPlayerNumber || dPlayerId < 0) break;
                                            
                                            let newDisguiseI = data[3]+'';

                                            if(!newDisguiseI) break;
                                            
                                            if(newDisguiseI.length == 1) {
                                                newDisguiseI = ({
                                                    m: 'Magician',
                                                    b: 'Robot',
                                                    n: 'Ninja',
                                                    s: 'SamuraiWarrior',
                                                    a: 'Alien',
                                                    g: 'BlackwellSecurityGuard01',
                                                    o: 'CopA',
                                                    r: 'robber',
                                                    v: 'SpaceVillain',

                                                    1: 'FemaleA',
                                                    2: 'MaleA',
                                                    3: 'FemaleC',
                                                    4: 'MaleC',

                                                    p: 'Pig',
                                                    t: 'Behemoth',
                                                    d: 'Dog',
                                                    y: 'MagmaBall_Char'
                                                })[newDisguiseI]||'';
                                            } else {
                                                newDisguiseI = useSpecialCode(newDisguiseI, -disguiseSpecialN);
                                            }
                                            
                                            const charManager = require('./char-manager');

                                            let charsDisgId = charManager.getCharWithId(newDisguiseI);

                                            if(!charsDisgId) break;
                                            if(charsDisgId.class.includes('Player')) break;
                                            onlinePlayers.get(dPlayerId).isCharCreature = charsDisgId.class.includes('Creature');

                                            sendToGameAPI('SETONLINED', charsDisgId.name, charsDisgId.class, dPlayerId);
                                            break;
                                        
                                        // Change attack range
                                        case 'R':
                                            let newPlyrRange = convertNumberFromMsg(data[2]);
                                            localPlayer.attackRange = newPlyrRange;
                                            break;
                                            
                                        // Change traffic density
                                        case 'T':
                                            let newTrafficD = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].find(numberT => numberT + '' == data[2]) || 0;
                                            sendToGameAPI('TRAFFIC', newTrafficD);
                                            break;
                                            
                                        case 'S':
                                            let newSPlyr = convertNumberFromMsg(data[2]||'0');
                                            if(newSPlyr < 1.7) newSPlyr = 1.7;
                                            if(newSPlyr > 19) newSPlyr = 19;
                                            sendToGameAPI('TRAFFIC', newSPlyr, 1);
                                            break;
                                        
                                        // Add/Edit and Remove a custom button
                                        case 'B':
                                            let sButtonId;
                                            if(data[2] == 'A') {
                                                let sButtonName = data[3]+'';
                                                if(sButtonName.length > 20 || sButtonName.length < 1) break;
                                                sButtonId = data[4]+'';
                                                if(sButtonId.length > 20 || sButtonId.length < 1) break;
                                                if(onlineClientWindow) onlineClientWindow.webContents.send('server-buttons', 'add', sButtonName, sButtonId);
                                            } else {
                                                sButtonId = data[3]+'';
                                                if(sButtonId.length > 20 || sButtonId.length < 1) break;
                                                if(onlineClientWindow) onlineClientWindow.webContents.send('server-buttons', 'remove', sButtonId);
                                            }
                                            break;
                                            
                                        
                                        // Spawn coins
                                        case 'C':
                                            if(!serverCountdown.canSpawnCoin) return;
                                            let numberOfCoins = parseInt(convertNumberFromMsg(data[2])) || 0;
                                            if(numberOfCoins < 1 || numberOfCoins > 50000) break;
                                            
                                            serverCountdown.canSpawnCoin = false;
                                            setTimeout(() => { serverCountdown.canSpawnCoin = true; }, 200);
                                            
                                            numberOfCoins *= 10;
                                            if(data[5]) {
                                                let customPosX = convertNumberFromMsg(data[3]);
                                                let customPosY = convertNumberFromMsg(data[4]);
                                                let customPosZ = convertNumberFromMsg(data[5]);
                                                if(positionManager.isPositionDangerous(customPosX, customPosY, customPosZ)) break;
                                                sendToGameAPI('SPAWNCOINS', numberOfCoins, customPosX, customPosY, customPosZ);
                                                break;
                                            }
                                            sendToGameAPI('SPAWNCOINS', numberOfCoins);
                                            break;
                                        
                                        case 'E':
                                            localPlayer.isCDisabled = data[2] != '1';
                                            sendToGameAPI('SETISCENABLED', localPlayer.isCDisabled ? 1 : 0);
                                            break;
                                        
                                        // Set goal
                                        case 'G':
                                            
                                            if(data[4]) {
                                                let customPosX = convertNumberFromMsg(data[2]);
                                                let customPosY = convertNumberFromMsg(data[3]);
                                                let customPosZ = convertNumberFromMsg(data[4]);
                                                if(positionManager.isPositionDangerous(customPosX, customPosY, customPosZ)) break;
                                                sendToGameAPI('SETGOAL', customPosX, customPosY, customPosZ);
                                                break;
                                            }
                                            sendToGameAPI('SETGOAL');
                                            break;
                                    }
                                    break;}
                            
                                default:
                                    break;
                            }
                            break};
                        
                        // FOR THE CUSTOM PLUGINS CHANNELS/MESSAGES
                        case 'C':
                            let channelId = data.slice(1).split(';', 1)[0];
                            data = data.slice(channelId.length+2);
                            clientPluginsEvents.onCustomMsg.forEach( ev => {
                                if(channelId == ev.channelId) ev(data);
                            });
                            break;
                    
                        default:
                            break;
                    }
                    break;
            
                case 1:
                    break;
                
                case 0:
                    break;

                default:
                    break;
            }
            
        });
        
        clientWebsocket.on('close', (closecode) => {
            clientWebsocket = null;
            logClientMsg('Connection with the server lost, code : ' + closecode);
            
            // If never finish to connect to the server :
            if(isConnectingToServer) {
                isConnectingToServer = false;
                if(onlineClientWindow) {
                    onlineClientWindow.webContents.send('stat', 'client', {
                        connectionState: connectionState
                    });
                }
                
                gameAPI.interface.showMessage('Impossible to connect.\nCheck if the url is good.\nCode: ' + closecode);
            } else {
                gameAPI.interface.showMessage('Client disconnected with the server. Code : ' + closecode);
            }
            if(connectionState == 0) return;
            setNewConnectionState(0);
            if(isGameStopped || isGameAPIConnected == false) return;
            onOnlineStopped();
            // showConnectionMenu();
            if(onlineClientWindow) {
                onlineClientWindow.webContents.send('stat', 'client', {
                    connectionState: connectionState
                });
            }
        });
    }
    
    // await showConnectionMenu();
    
    // spawnClientWindow();

    let pluginAPI = (pluginObj) => {
        
        // Remove old events
        for (const key in clientPluginsEvents) {
            clientPluginsEvents[key] = clientPluginsEvents[key].filter(ev => ev.pluginName != pluginObj.name);
        }

        return {
            isCityLoaded: isGameAPIConnected,
            isGameStopped: isGameStopped,

            canLocalPlayerMove: () => !localPlayer.isLocked,

            isCheatModsAccepted: () => !localPlayer.isCDisabled,

            getLocalPlayer: () => { return {...localPlayer} },

            onlinePlayers,

            getClientWindow: () => onlineClientWindow,
            
            /**
             * don't use the character ";" in the channelid
             * @example sendCustomMessage("my-channel", "player-jumped-123");
             * @param {String} channelid 
             * @param {String} msgdata 
             */
            sendCustomMessage: (channelid, msgdata) => {
                clientWebsocket.send('C' + channelid + ';' + msgdata)
            },
            

            sendSpecialMessage: (msgdata) => {
                clientWebsocket.send(msgdata)
            },

            clientWebsocket,

            positionManager,

            events: {

                // Remove only the events created by the plugin that execute this function
                removeAllMyEvents: () => {

                    for (const key in clientPluginsEvents) {
                        clientPluginsEvents[key] = clientPluginsEvents[key].filter(ev => ev.pluginName != pluginObj.name);
                    }
                },

                /**
                 * @example
                 * const onCustomMessage = () => {};
                 * 
                 * // Add it :
                 * events.onCustomMessage("my-channel-id", onCustomMessage);
                 * // Remove it :
                 * events.removeEvent("onCustomMsg", onCustomMessage);
                 * 
                 * // All the list :
                 * events.removeEvent("onChangeParty", eventFunction);
                 * events.removeEvent("onAnyMsg", eventFunction);
                 * events.removeEvent("onCustomMsg", eventFunction);
                 * 
                 * // If the event is removed the function return true
                 * @param {String} eventType 
                 * @param {Function} eventFunction 
                 * @returns {Boolean}
                 */
                removeEvent: (eventType, eventFunction) => {
                    if(clientPluginsEvents[eventType] == null) return false;
                    let haveDidIt = false;
                    clientPluginsEvents[eventType] = clientPluginsEvents[eventType].filter(ev => {
                        if(ev != eventFunction) return true;
                        haveDidIt = true;
                        return false;
                    });
                    return haveDidIt;
                },

                /**
                 * @example onChangeParty((player, newPartyId) => {
                 *     if(newPartyId == "my-party") return;
                 * })
                 * @param {Function} ev 
                 */
                onChangeParty: (ev) => {
                    ev.pluginName = pluginObj.name;
                    clientPluginsEvents.onChangeParty.push(ev);
                },
                
                onCustomMessage: (channelId, ev) => {
                    ev.pluginName = pluginObj.name;
                    ev.channelId = channelId;
                    clientPluginsEvents.onCustomMsg.push(ev);
                },
                
                onAnyMessage: (ev) => {
                    ev.pluginName = pluginObj.name;
                    ev.channelId = channelId;
                    clientPluginsEvents.onAnyMsg.push(ev);
                },
            }
        }
    };
    

    const gameAddresses = {
        rot: {
            result: null,
            offsets: [0x01802620, 0x30, -0x53F8]
        },
        // disguise_class: {
        //     result: null,
        //     offsets: [0x183D070]
        // },
        animation_base: {
            result: null,
            offsets: [0x01C74920, 0x7A0]
        },
        act3_mission: {
            result: null,
            offsets: [0x01802620, 0x10]
        },
        act3_stage: {
            result: null,
            offsets: [0x01802620, 0x30, 0x10]
        },
        act4_mission: {
            result: null,
            offsets: [0x017ECA08, 0x48, 0x60, 0x68, 0x38, 0x88]
        },
        act4_stage: {
            result: null,
            offsets: [0x017ECA08, 0x48, 0x60, 0x68, 0x38, 0x60]
        },
        disguise_id_1: {
            result: null,
            offsets: [0x01C4E970, 0x290, 0x110, 0x3C8, 0x190, 0x200, 0x20, 0x0]
        },
        disguise_id_2: {
            result: null,
            offsets: [0x01C7FE20, 0x90, 0x188, 0x3C8, 0x190, 0x200, 0x20, 0x0]
        },
        disguise_id_3: {
            result: null,
            offsets: [0x01C74AE8, 0x198, 0x320, 0x3D8, 0x190, 0x200, 0x20, 0x0]
        },
        disguise_id_4: {
            result: null,
            offsets: [0x01C3F268, 0x3C8, 0x378, 0x18, 0x2B0, 0x2B8, 0x38, 0x0]
        }
    };

    let alreadyAttackedPlyrs = [];

    function onAttackAnim() {
        
        if((!clientWebsocket) || connectionState != 2) return;

        let attackPos = {...localPlayer.pos};
        // let attackRot = localPlayer.rot;
        let attackRot = (((gameAPI.player.rotation.get() || 0) + 3) / Math.PI) * -180;

        // let attackRot = (localPlayer.rot * Math.PI) / 360;
        // let attackRot = (localPlayer.rot * Math.PI) / 180;

        attackRot = attackRot * (Math.PI / 180);

        logClientMsg('INIT POS: ' + attackPos.x + ' ; ' + attackPos.z);

        attackPos.x += Math.sin(attackRot) * 0.11;
        attackPos.z += Math.cos(attackRot) * -0.11; // REVERSED
        
        logClientMsg('FINAL POS: ' + attackPos.x + ' ; ' + attackPos.z);

        // // For debug :
        // gameAPI.player.position.set(attackPos.x, attackPos.y, attackPos.z);
        // logClientMsg('[ DEBUG TP ]');

        // var initX = 10, initZ = 10,
        //     rot = 45 * Math.PI / 180;

        // var x = initX*Math.cos(rot) + (initZ*Math.sin(rot));
        // var z = -initX*Math.sin(rot) + (initZ*Math.cos(rot));

        let yDistance;

        onlinePlayers.forEach(plyr => {

            yDistance = plyr.pos.y - localPlayer.pos.y;
            if(yDistance < 0) yDistance *= -1;

            logClientMsg('ATTACK Y DISTANCE: ' + yDistance);
            logClientMsg('ATTACK XZ DISTANCE: ' + plyr.distanceWithoutY(attackPos));
            
            if(yDistance > 0.65 || plyr.distanceWithoutY(attackPos) > localPlayer.attackRange) return;

            if(alreadyAttackedPlyrs.includes(plyr.id)) return;
            alreadyAttackedPlyrs.push(plyr.id);
            setTimeout(() => {
                alreadyAttackedPlyrs = alreadyAttackedPlyrs.filter(attackedP => attackedP != plyr.id);
            }, 80);

            clientWebsocket.send('AK'+plyr.id);
        });
    }

    function onSpinAttackAnim () {
            
        if((!clientWebsocket) || connectionState != 2) return;

        let attackPos = {...localPlayer.pos};

        let yDistance;

        onlinePlayers.forEach(plyr => {

            if(alreadyAttackedPlyrs.includes(plyr.id)) return;

            yDistance = plyr.pos.y - localPlayer.pos.y;
            if(yDistance < 0) yDistance *= -1;

            if(plyr.vehicle == 0) {
            
                if(yDistance > 0.65 || plyr.distanceWithoutY(attackPos) > localPlayer.attackRange) return;
    
                alreadyAttackedPlyrs.push(plyr.id);
                setTimeout(() => {
                    alreadyAttackedPlyrs = alreadyAttackedPlyrs.filter(attackedP => attackedP != plyr.id);
                }, 80);
    
                clientWebsocket.send('AK'+plyr.id);
                
            } else {
            
                if(yDistance > 0.7 || plyr.distanceWithoutY(attackPos) > localPlayer.attackRange * 2) return;

                alreadyAttackedPlyrs.push(plyr.id);
                setTimeout(() => {
                    alreadyAttackedPlyrs = alreadyAttackedPlyrs.filter(attackedP => attackedP != plyr.id);
                }, 80);

                clientWebsocket.send('AK'+plyr.id);
            }
        });
    }

    gameAPI.onConnected(async()=>{
        logClientMsg('External code connected to game!');
        isGameAPIConnected = true;

        logClientMsg('loading pointers..');
        
        for (let key in gameAddresses) {
            gameAddresses[key].reload = () => {
                
                let offsetsToLoad = [...gameAddresses[key].offsets];
                offsetsToLoad[0] += Number(gameMemory.getBaseAddress());

                if(offsetsToLoad.length == 1) {
                    gameAddresses[key].result = offsetsToLoad[0];
                } else {
                
                    try {
                        // logClientMsg(offsetsToLoad);
                        gameAddresses[key].result = gameMemory.getAddressWithOffsets(
                            ...offsetsToLoad
                        );
                        // logClientMsg('res: ' + gameAddresses[key].result);
                    } catch (error) {
                        console.error(error);
                        // logClientMsg('error while loading an address');
                    }
                }
            }
            gameAddresses[key].reload();
        }
        logClientMsg('pointers loaded');

        // if(connectionState == 1) setNewConnectionState(2);
        spawnClientWindow();
        
        // gameAPI.shortcuts.add(exports.modInfos.modName, 'toogle-weapons', 'Shift+P', (ev) => {
        //     console.log('AAA', ev);
        // });
        
        // gameAPI.shortcuts.add(exports.modInfos.modName, 'toogle-weapons', 'Shift+<+P', (ev) => {
        //     console.log('BBB', ev);
        // });

        let canToogleWOnK = true;

        gameAPI.keyboard.onInput(exports.modInfos.modName, 'toogle-weapons', clientSave.shortcuts.toogleWeapons, (ev) => {
            
            if(ev.state != 'DOWN' || canToogleWOnK == false) return;
            
            if(gameAPI.interface.isAppHidden()) {
                canToogleWOnK = false;
                sendToGameAPI('TOOGLEWEAPONS');
                logClientMsg('TOOGLE THE WEAPONS');
                setTimeout(() => {
                    canToogleWOnK = true;
                }, 500);
                return;
            }
            logClientMsg('CANNOT TOOGLE THE WEAPONS');
        });
        
        gameAPI.keyboard.onInput(exports.modInfos.modName, 'special-attack', clientSave.shortcuts.specialAttack, specialAttackEvent);

        require('./emote-manager').setVars(gameAPI, clientSave, sendToGameAPI, exports.modInfos.modName);
        require('./emote-manager').loadEmotes();

        if(clientSave.autoJoinServerURL && typeof clientSave.autoJoinServerURL == 'string') {
            showConnectionMenu(clientSave.autoJoinServerURL);
        }

        //
        // gameAPI.shortcuts.addWithBaseShortcut(exports.modInfos.modName, 'toogle-weapons', 'P', () => {
        //     if(gameAPI.interface.isAppHidden()) {
        //         logClientMsg('[DEBUG] TOOGLE W');
        //         sendToGameAPI('TOOGLEWEAPONS');
        //         console.log('is visi:', require('electron').BrowserWindow.getFocusedWindow() && require('electron').BrowserWindow.getFocusedWindow().isVisible());
        //     } else {
        //         sendToGameAPI('TOOGLEWEAPONS');
        //         console.log('debug, window not focused');
        //         console.log('is visi:', require('electron').BrowserWindow.getFocusedWindow() && require('electron').BrowserWindow.getFocusedWindow().isVisible());
        //     }
        // });

    });
    
    gameAPI.onDisconnected(async(ev)=>{
        isGameAPIConnected = false;
        
        // if(connectionState == 2) {
        //     clientWebsocket.send("AS1");
        //     setNewConnectionState(1);
        // }
        
        if(onlineClientWindow) onlineClientWindow.close();
        
        if(ev.cannotRestart) {
            isGameStopped = true;
            if(intervalUpdateToServer != null) {
                clearInterval(intervalUpdateToServer);
                intervalUpdateToServer = null;
            }
            // if(onlineClientWindow) onlineClientWindow.close();
        }

        onOnlineStopped();

        
        // Now if the client is disconnected with the game the client will be disconnected with the server
        // if(ev.cannotRestart) {
        if(true) {
            if(clientWebsocket) {
                logClientMsg('disconnecting client..');
                setNewConnectionState(0);
                closeWebsocket();
            }
            return;
        }
        logClientMsg('External code disconnected, waiting that the city is reloaded.');
    });



    const posAPI = gameAPI.player.position;

    let updateRot = 5;
    let updateAttrs = 5;

    intervalUpdateToServer = setInterval(() => {
        
        if(connectionState != 2 || isGameAPIConnected == false) return;

        // Update player position and rotation :

        // localPlayer.pos.x = posAPI.getX();
        // localPlayer.pos.y = posAPI.getY();
        // localPlayer.pos.z = posAPI.getZ();
        let posX = posAPI.getX();
        let posY = posAPI.getY();
        let posZ = posAPI.getZ();

        if((!posX) || (!posY) || (!posZ) || (
            posX > 1500 || posX < -1500 ||
            posY > 1500 || posY < -1500 ||
            posZ > 1500 || posZ < -1500
        )) {
            gameAPI.player.reloadPlayerAddr();
            return;
        }

        if(localPlayer.vehicle && typeof localPlayer.vehicle.addedY == 'number') posY += localPlayer.vehicle.addedY;

        localPlayer.pos.x = posX;
        localPlayer.pos.y = posY;
        localPlayer.pos.z = posZ;

        // posX = posX.toFixed(2);
        // posY = posY.toFixed(2);
        // posZ = posZ.toFixed(2);

        // let msg = 'P'+posX+';'+posY+';'+posZ;

        let msg = 'P' + msgFuncs.toPosPartMsg(posX) + msgFuncs.toPosPartMsg(posY) + msgFuncs.toPosPartMsg(posZ);

        function addAttrToMsg(attrName, attrNumber) {
            msg += attrName + msgFuncs.toSmallMsg(attrNumber);
        }

        if(localPlayer.isDed) {
            
            if(gameMemory.read(gameAddresses.rot.result, 'UINT32') + '' != '190401') {
                msg += 'L';
                localPlayer.isDed = false;
            }
            
            clientWebsocket.send(msg);
            return;
        }

        updateRot--;
        if(updateRot < 0 || localPlayer.isDed) {
            updateRot = 2;
            let playerRot = gameMemory.read(gameAddresses.rot.result, 'UINT32') + '';
            if(playerRot == '190401') {
                localPlayer.isDed = true;
                msg += 'K';
            } else {
                playerRot = parseInt(playerRot.slice(-3));
                if(playerRot != localPlayer.rot) {
                    localPlayer.rot = playerRot;
                    // msg += ';R'+playerRot;
                    addAttrToMsg('R', playerRot);
                }

                if(localPlayer.anim == 3) onAttackAnim();
            }
        } else {
            updateAttrs--;
            if(updateAttrs < 0) {
                updateAttrs = 2;

                let playerAttr;

                // Old, now not used
                // let playerAttr = 1 + gameMemory.read(gameAddresses.disguise_class.result, 'UINT32');
                
                // if(playerAttr >= 8) playerAttr = 0;
                // if(playerAttr != localPlayer.disguise) {
                //     // Send disguise :
                //     localPlayer.disguise = playerAttr;
                //     msg += ';D'+playerAttr;

                if(false) {

                } else {

                    let initAnimId = gameMemory.read(gameAddresses.animation_base.result, 'UINT32');
                    playerAttr = animsList[initAnimId];
                    if(playerAttr == null) playerAttr = animsList[1];

                    let lastAnimId = localPlayer.lastAnimInitId;
                    
                    localPlayer.lastAnimInitId = initAnimId;

                    if(playerAttr == 3) {
                        onAttackAnim();
                    } else if(playerAttr == 34) {
                        onSpinAttackAnim();
                    }
                    
                    if(playerAttr != localPlayer.anim) {
                        // Send animation :
                        localPlayer.anim = playerAttr;
                        // msg += ';A'+playerAttr;
                        addAttrToMsg('A', playerAttr);
                        // if(playerAttr == 3) onAttackAnim();
                    } else if(playerAttr == 3 && lastAnimId != initAnimId) { // If is another attack animation, update it
                        addAttrToMsg('A', playerAttr);
                        // onAttackAnim();
                    }
                        else {

                            playerAttr = gameMemory.read(gameAddresses.rot.result, 'UINT32')+'';
                            if(playerAttr != "190401") {
                                
                                playerAttr = parseInt((playerAttr).slice(0, -3)) || 0;
                                if(playerAttr < 0) playerAttr = 0;
                                if(playerAttr != localPlayer.vehicleId) {
                                    if(playerAttr == 0) {
                                        localPlayer.vehicle = null;
                                    } else {
                                        localPlayer.vehicle = vehicleManager.getVehicleById(playerAttr);
                                    }
                                    
                                    // Send the vehicle id :
                                    localPlayer.vehicleId = playerAttr;
                                    // msg += ';V'+playerAttr;
                                    addAttrToMsg('V', playerAttr);
                                }
                            }
                        }
                }
            }
        }

        //logClientMsg('sending "' + msg + '"');

        clientWebsocket.send(msg);

    // // }, 60);
    }, 80);
    // }, 800);
}