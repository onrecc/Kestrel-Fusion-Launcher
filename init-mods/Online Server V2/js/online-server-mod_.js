let vehicleManager = require('./v-server-manager');

// Can be edited
let serverAttr = {
    pvpEnabled: true,
    acceptNewPlayers: true,
    specialActionReloadTime: 3000,
    killProtectionTime: 4500, // The time when you can't be killed after be killed
    damagesProtectionTime: 500, // The time when you can't take a damage after taking a damage
    canChangeDisguises: true,
    rangeProtectionMultiplier: 8, // Before to allow a player to attack another player the server check if the distance is correct : if( distance > player-range * rangeProtection ) { cancel() }
    attackPowerMultiplierOnVehicles: 2, // When attack a vehicle: damages = player.attackPower * serverAttr.attackPowerMultiplierOnVehicles
    isCheatsAllowed: false // Some mods will not working if this is set to "false", it depend of the mod
};



let isInTest = false; // For testing the online with only one player (don't work very well). Recommanded to set it to false
let spawnServerWindow;


function logServerMsg(msg) {
    console.log('[Server]:', msg);
}
function logServerError(errmsg) {
    console.log('[ SERVER ERROR ] :');
    console.error(errmsg);
}


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

const positionFuncs = {
    
    getPosWithRotation: (rotation, rangeGived = 1) => {

        let attackRot = rotation * (Math.PI / 180);

        return {
            x: Math.sin(attackRot) * rangeGived,
            z: Math.cos(attackRot) * rangeGived,
            y: 0
        }
    }
}

// Don't edit these variables, if you want to edit them use the functions of the "Player" class
let initPlyrAttr = {
    isInvulnerable: false,
    isVisible: true,
    isVisibleOnMap: false,
    canMove: true,
    // attackRange: 0.125,
    attackRange: 2,
    trafficDensity: 1,
    attackPower: 1 // number of HP remove to the attacked player
};

// Editable in the config json file
let maxPlayerNumber = 6;


/**
 * @type [Player]
 */
let serverPlayers = [];
let server;

let pluginsEvents = {
    msg: [],
    anyMsg: [],
    connect: [],
    tryToConnect: [],
    disconnect: [],
    onChangeParty: [],
    playerAttacked: [],
    plyrDed: [],
    disguiseChange: [],
    specialAction: []
};


function triggerEvents(eventId, ...evDatas) {
    let eventResponses = false;
    pluginsEvents[eventId].forEach(ev => {
        if(ev(...evDatas) === true) eventResponses = true;
    });
    return eventResponses;
}


/**
 * @param {Player} playerObj 
 */
function onPlayerDed(playerObj) {
    
    triggerEvents('plyrDed', playerObj);

    if(playerObj.canReceiveDamage) {
        playerObj.canReceiveDamage = false;
        setTimeout(() => {
            playerObj.canReceiveDamage = true;
        }, serverAttr.killProtectionTime);
    }
}


class Player {
    constructor(socket, playerid) {
        if(playerid == null) {
            playerid = 0;
            while (serverPlayers.find(p => p.id == playerid) != null) {
                playerid++;
            }
        }
        this.id = playerid;
        this.connectionState = 1; // 0 = disconnected, 1 = connected

        // Don't change these variables :
        this.isDed = false;
        this.canReceiveDamage = true;
        this.canUseSpecialAction = true;

        
        this.isVisible = initPlyrAttr.isVisible;
        this.isVisibleOnMap = initPlyrAttr.isVisibleOnMap;
        
        this.isInvulnerable = initPlyrAttr.isInvulnerable;
        this.canMove = initPlyrAttr.canMove;
        this.attackRange = initPlyrAttr.attackRange;
        this.attackPower = initPlyrAttr.attackPower;
        this.canBeInVehicle = true;
        this.canUseCheats = false; // Edited after connected if serverAttr.isAnyModAllowed is on true
        this.currentPartyId = '';
        this.tags = {}; // for that the plugins can save custom infos in the player instances
        this.isFakePlayer = false; // for plugins
        
        this.pos = {
            x:0,
            y:0,
            z:0
        };
        this.rot = 0;
        
        this.anim = 0;
        this.vehicle = 0;
        // this.disguise = 0;
        this.disguiseId = '';
        this.charSpeed = 2;

        // this.updates = '';
        // this.updatesCompiled = false;
        // this.updateMsg = "";

        this.serverButtons = [];
        
        this.socket = socket;
        serverPlayers.push(this);
    }

    sendMessage(msg) {
        if(this.socket) this.socket.send(msg);
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

    teleport(x, y, z, rot) {
        this.pos.x = x;
        this.pos.y = y;
        this.pos.z = z;
        
        this.sendMessage('AT;' + msgFuncs.toPosMsg(x, y, z, rot));

        // if(rot == null) {
        //     this.sendMessage('AT;'+x.toFixed(2)+';'+y.toFixed(2)+';'+z.toFixed(2));
        // } else {
        //     this.rot = rot;
        //     this.sendMessage('AT;'+x.toFixed(2)+';'+y.toFixed(2)+';'+z.toFixed(2)+';'+rot);
        // }
    }

    /**
     * @example 
     * @param {Boolean} canmovenow 
     * @param {String|undefined} lockedAnim 
     */
    setCanMove(canmovenow, lockedAnim) {
        this.canMove = canmovenow;
        
        // Send that the player is frozen
        this.sendMessage('AF;'+ (canmovenow? '0' : ('1' + (typeof lockedAnim == 'string' ? lockedAnim : '')) ));

        // finally not doing this because some plugins don't need this and it can make some bugs:
        // // be sure that the player have a syncronised position :
        // if(!canmovenow) this.teleport(this.pos.x, this.pos.y, this.pos.z);
    }

    canJoinNewParty() {
        return this.currentPartyId == '';
    }

    /**
     * // If no party, add in the party :
     * if( player.canJoinNewParty() ) player.setParty("my-mini-game");
     *
     * // Eject the player from the party :
     * player.setParty("");
     * @param {String} newpartyid 
     */
    setParty(newpartyid) {
        newpartyid = newpartyid || '';
        this.currentPartyId = newpartyid;
        
        this.sendMessage('AP;'+newpartyid);
        
        pluginsEvents.onChangeParty.forEach(ev=>{
            ev(this, newpartyid);
        });
    }

    /**
     * 
     * @param {Number} newvehicleid 
     * @param {Boolean} isvehicleinvulnerable 
     * @param {Boolean} islockedinvehicle 
     */
    setVehicle(newvehicleid, isvehicleinvulnerable, islockedinvehicle) {
        
        //if(typeof newvehicleid != 'string') this.vehicle = newvehicleid;

        // If isn't equal to 0 or ""
        if(newvehicleid) {

            this.canBeInVehicle = true;

            if(typeof newvehicleid == 'string') {
                this.sendMessage(
                    'AV;'+newvehicleid.split(' ')[0]
                    + (isvehicleinvulnerable ? '%' : '')
                    + (islockedinvehicle ? '!' : '')
                    +';'+newvehicleid.split(' ')[1]
                );
            } else {
                this.sendMessage(
                    'AV;'+newvehicleid
                    + (isvehicleinvulnerable ? '%' : '')
                    + (islockedinvehicle ? '!' : '')
                );
            }
        } else {
            // Send to remove the vehicle
            this.sendMessage('AV');
        }

        // let vehicleStats = vehicleManager.getVehicleById(newvehicleid);

        // if(newvehicleid != 0 && vehicleStats) {
        //     this.sendMessage(
        //         'AV;'+vehicleStats.name
        //         + (isvehicleinvulnerable ? '%' : '')
        //         + (islockedinvehicle ? '!' : '')
        //         +';'+vehicleStats.class
        //     );
        // } else {
        //     // Send to remove the vehicle
        //     this.sendMessage('AV');
        // }
        
        // the player will update all automaticly
        // OLD, use msgFuncs.toUpdateMsg
        // serverPlayers.forEach(
        //     player => {
        //         if(player == this) {
        //             if(isInTest) {
        //                 this.sendMessage('U'+(this.id+1)+';V'+this.vehicle);
        //             }
        //             return;
        //         }

        //         player.sendMessage('U'+this.id+';V'+this.vehicle);
        //     }
        // );
    }

    setCanBeInVehicle(canbeinvnow) {
        canbeinvnow = !!canbeinvnow; // be sure that it's a boolean
        this.canBeInVehicle = canbeinvnow;
        
        this.sendMessage('AV;'+(
            canbeinvnow ? "+" : "-"
        ));

        if(!canbeinvnow) {
            this.vehicle = 0;
            serverPlayers.forEach(
                player => {
                    if(player == this) {
                        if(isInTest) {
                            //this.sendMessage('U'+(this.id+1)+';V0');
                            this.sendMessage(msgFuncs.toUpdateMsg(this.id+1, 'V', 0));
                        }
                        return;
                    }

                    // player.sendMessage('U'+this.id+';V0');
                    this.sendMessage(msgFuncs.toUpdateMsg(this.id, 'V', 0));
                }
            );
        }
    }

    removeVehicle() {
        this.sendMessage('AK;-2');
    }

    applyDamage(numberofdamages) {
        if(this.isDed || (!this.canReceiveDamage)) return;
        this.canReceiveDamage = false;
        if(typeof numberofdamages != 'number') {
            if(typeof numberofdamages != 'bigint') {
                numberofdamages = Number(numberofdamages);
            } else {
                numberofdamages = 1;
            }
        }
        this.sendMessage('AD;' + numberofdamages);
        
        let plyrToEditDamageProtection = this;
        setTimeout(() => {
            plyrToEditDamageProtection.canReceiveDamage = true;
        }, serverAttr.damagesProtectionTime);
    }

    kill() {
        // if(this.isDed) return;
        this.sendMessage('AK;-1');
        onPlayerDed(this);
    }

    setHP(newPlyrHP, isVehicleHP) {
        newPlyrHP = parseInt(newPlyrHP) || 0;
        if(newPlyrHP < 1) {
            if(isVehicleHP) {
                this.removeVehicle();
            } else {
                this.kill();
            }
            return;
        }
        this.sendMessage('AH;'+newPlyrHP+(isVehicleHP ? 'V' : ''));
    }

    ejectFromServer() {
        if(this.socket) this.socket.close();
    }

    /**
     * @example
     * player.spawnCoins(1585); // Spawning coins on the player
     *
     * player.spawnCoins(1585, {x:0, y:50, z:0}); // Spawning coins on a gived position
     * @param {Number} numberOfCoins 
     * @param {undefined|Object} coinsPos 
     */
    spawnCoins(numberOfCoins, coinsPos) {
        if(coinsPos && coinsPos.pos) coinsPos = coinsPos.pos;
        
        this.sendMessage('AO;C;' + numberOfCoins + ( coinsPos ? ';' + coinsPos.x + ';' + coinsPos.y + ';' + coinsPos.z : '' ));
    }

    setCanUseCheats(canUseCheats) {
        this.canUseCheats = canUseCheats;
        this.sendMessage('AO;E;' + (canUseCheats ? 1 : 0));
    }
    
    /**
     * @example
     * // Remove the goal :
     * setGoal(null);
     * 
     * // Add a goal :
     * setGoal({
     * x: 0,  y: 0,  z: 0
     * });
     * @param {null|Object} goalPos 
     */
    setGoal(goalPos) {
        this.sendMessage('AO;G' + ( goalPos ? ';' + goalPos.x + ';' + goalPos.y + ';' + goalPos.z : '' ));
    }
    
    setIsVisible(isvisiblenow) {
        this.isVisible = isvisiblenow;
        if(isvisiblenow) return;

        serverPlayers.forEach(plyr=>{
            
            if(plyr == this) {
                if(isInTest) {
                    plyr.sendMessage('P'+msgFuncs.toSmallMsg(this.id+1)+msgFuncs.toPosMsg(0, 60, 0));
                }
                return;
            }

            plyr.sendMessage('P'+msgFuncs.toSmallMsg(this.id)+msgFuncs.toPosMsg(0, 60, 0));
        });
    }
    
    setIsVisibleOnMap(isvisiblenow) {
        if(isvisiblenow == this.isVisibleOnMap) return;
        this.isVisibleOnMap = isvisiblenow;
        serverPlayers.forEach(plyr=>{
            
            if(plyr == this) {
                if(isInTest) {
                    plyr.sendMessage('AM;'+(this.id+1)+';'+(isvisiblenow? 1 : 0));
                }
                return;
            }

            plyr.sendMessage('AM;'+this.id+';'+(isvisiblenow? 1 : 0));
        });
    }

    setAttackRange(newattackrange) {
        this.attackRange = newattackrange;
        this.sendMessage('AO;R;' + newattackrange)
    }

    setTrafficDensity(newtrafficdensity) {
        this.sendMessage('AO;T;' + newtrafficdensity)
    }

    /**
     * Change the character speed,
     * normal speed = 2
     * @param {Number} newplayerspeed 
     */
    setSpeed(newplayerspeed) {
        this.charSpeed = newplayerspeed;
        this.sendMessage('AO;S;' + newplayerspeed);
    }

    /**
     * WARN : DO NOT USE A LOT THIS FUNCTION BECAUSE IT SEND A LOT OF MESSAGES TO THE PLAYER, USE IT ONLY WHEN YOU FINISHED A CUSTOM GAME MODE AND IF YOU CAN, UPDATE ONLY THE ATTRIBUTES THAT YOU EDITED. FOR EXAMPLE IF YOU JUST EDITED THE TRAFFIC DENSITY OF THE PLAYER JUST DO " player.setTrafficDensity(initPlyrAttr.trafficDensity); "
     */
    resetToDefaultAttributes() {
        this.setIsVisible( initPlyrAttr.isVisible );
        this.setIsVisibleOnMap( initPlyrAttr.isVisibleOnMap );
        
        this.isInvulnerable = initPlyrAttr.isInvulnerable;
        this.setCanMove( initPlyrAttr.canMove );
        this.setCanBeInVehicle(true);
        this.setTrafficDensity(initPlyrAttr.trafficDensity);
        this.attackPower = initPlyrAttr.attackPower;

        if(this.charSpeed != 2) this.setSpeed(2);
    }

    // compileUpdates() {
    //     if(this.updatesCompiled) return;
    //     this.updatesCompiled = true;
        
    //     this.updateMsg = this.id + ";" + this.pos.x + ";" + this.pos.y + ";" + this.pos.z + this.updates;
    // }

    remove() {
        
        let plyrIndex = serverPlayers.indexOf(this);
        if(plyrIndex != -1) serverPlayers.splice(plyrIndex, 1);
        //serverPlayers.findIndex(plyr => plyr == this);
        

        // OLD BAD METHOD BECAUSE THE PLUGINS ARE NOT UPDATED:
        // serverPlayers = serverPlayers.filter(plyr => plyr != this);
    }
}

function convertNumberFromMsg(numbermsg) {
    try {
        let newNumber = parseFloat(numbermsg);
        if(Number.isNaN(numbermsg)) return 0;
        if(Number.MAX_SAFE_INTEGER > newNumber && Number.MIN_SAFE_INTEGER < newNumber) return newNumber;
        newNumber = null;
        return 0;
    } catch (error) {
        logServerError(error);
        return 0;
    }
}

let controlPanelWindow;


function stopServer() {
    if(!server) return;
    
    serverAttr.acceptNewPlayers = false;

    // try {
    //     if(exports.modInfos) {
    //         exports.modInfos.gameScriptToJSAPI.interface.showMessage('Closing the server..');
    //     }
    // }
    // catch (error) {
    //     logServerError(error);
    // }

    serverPlayers.forEach(plyr=>{
        logServerMsg('closing player websockets..');
        plyr.socket.close();
    });

    logServerMsg('closing server..');
    server.close();
    server = null;
    
    logServerMsg('server closed');

    try {
        if(exports.modInfos) {
            exports.modInfos.gameScriptToJSAPI.interface.showMessage('Server closed');
        }
    }
    catch (error) {
        logServerError(error);
    }
}


/**
 * When the launch button is pressed :
 */

exports.onStart = async () => {
    const gameAPI = exports.modInfos.gameScriptToJSAPI;
    
    // Load the server-config.json :
    const configServer = require('./server-config.json') || {};

    maxPlayerNumber = typeof configServer.maxPlayerNumber == "number" ? configServer.maxPlayerNumber : 6;



    const express = require('./required-m-modules/node_modules/express/index');
    const WebSocket = require('./required-m-modules/node_modules/ws/index');

    serverAttr.acceptNewPlayers = true;
    spawnServerWindow = null;

    const app = express();
    
    // Requests API (work if enabled)
    app.get('/api/stats', (req, res) => {

        if(!configServer['public-API']) {
            res.status(403);
            res.send('API NOT ENABLED');
            return;
        }

        res.send(JSON.stringify({
            players: serverPlayers.length
        }));
    });

    let serverProfile;
    
    app.get('/server-profile.json', (req, res) => {
        if(serverProfile == null) {
            serverProfile = require('fs').readFileSync(require('path').join(__dirname, '/public-server-profile.json'), 'utf8');

            serverProfile = JSON.parse(serverProfile);

            if(!serverProfile) serverProfile = {};

            // Convert the array "allowedVersions" to a string with all the versions separated by a space-character
            if(typeof serverProfile.allowedVersions == 'object' && typeof serverProfile.allowedVersions.forEach == 'function') {
                let allowedVersionInText = '';
                serverProfile.allowedVersions.forEach((versionAllowed, versionAllowedIndex) => {
                    allowedVersionInText += (versionAllowedIndex ? ' ' : '') + versionAllowed;
                });
                serverProfile.allowedVersions = allowedVersionInText;
            }
            
            // Convert the array "bannedVersions" to a string with all the versions separated by a space-character
            if(typeof serverProfile.bannedVersions == 'object' && typeof serverProfile.bannedVersions.forEach == 'function') {
                let allowedVersionInText = '';
                serverProfile.bannedVersions.forEach((versionAllowed, versionAllowedIndex) => {
                    allowedVersionInText += (versionAllowedIndex ? ' ' : '') + versionAllowed;
                });
                serverProfile.bannedVersions = allowedVersionInText;
            }

            // Convert versions into a string if it's a number :
            if(typeof serverProfile.lowerVersion == 'number' || typeof serverProfile.lowerVersion == 'bigint') serverProfile.lowerVersion += '';
            if(typeof serverProfile.upperVersion == 'number' || typeof serverProfile.upperVersion == 'bigint') serverProfile.upperVersion += '';
            
            setTimeout(() => {
                serverProfile = null;
            }, 5000);
        }
        res.send(JSON.stringify(serverProfile));
    });

    
    let rulesToSend = null;

    app.get('/rules.txt', (req, res) => {
        
        if(rulesToSend == null) {
            
            const path = require('path');
            const fs = require('fs');

            const rulesFilePath = path.join(__dirname, '../', 'public-rules.txt');

            if(!fs.existsSync(rulesFilePath)) {
                res.send('');
                return;
            }

            rulesToSend = fs.readFileSync(rulesFilePath, {encoding:'utf8'});

            setTimeout(() => {
                rulesToSend = null;
            }, 5000);
        }
        
        res.send( rulesToSend );
    });

    server = app.listen(typeof configServer.port == 'number' ? configServer.port : 3001, () => {
        logServerMsg('Server started at the port ' + (typeof configServer.port == 'number' ? configServer.port : 3001));
        //gameAPI.interface.showMessage('Server started at the port ' + port);
        if(typeof spawnServerWindow == 'function') {
            setTimeout(() => {
                if(typeof spawnServerWindow == 'function') spawnServerWindow();
            }, 250);
        } else {
            spawnServerWindow = -1;
        }
    });
    
    server.on('error', (err) => {

        logServerMsg('Error in http server :');
        logServerError(err);
        
        if (err.code === 'EADDRINUSE') {
            gameAPI.interface.showMessage('Error while starting the server: You can have only 1 server in the same computer\nthe port "' + (typeof configServer.port == 'number' ? configServer.port : 3001) + '" is already used.');
            setTimeout(() => {
                server.close();
            }, 1000);
        }
    });


    function spawnProjectileAt(projPosX, projPosY, projPosZ, projRot = 0, autoDestroy) {
        let projPosObj = {
            x: projPosX,
            y: projPosY,
            z: projPosZ
        };
        let maxUpdateDistance = serverPlayers.length > 3 ? ( serverPlayers.length > 5 ? 9 : 15 ) : 20;

        let msgProjectileToSend = 'AA;' + (autoDestroy ? '2' : '1') + msgFuncs.toPosMsg(projPosX, projPosY, projPosZ, projRot);

        serverPlayers.forEach(plyr => {
            if(plyr.distanceWithoutY(projPosObj) > maxUpdateDistance) return;

            plyr.sendMessage(msgProjectileToSend);
        });
    }
    
    const wsServer = new WebSocket.Server({ noServer: true });

    wsServer.on('connection', function connection(ws, request) {

        if(serverAttr.acceptNewPlayers == false || serverPlayers.length >= maxPlayerNumber) {
            ws.close();
            return;
        }
        
        let updaterInterval = null;

        logServerMsg('new client connected');

        let gamePlayer = new Player(ws);
        
        if(controlPanelWindow) {
            controlPanelWindow.webContents.send('addPlayer', {
                id: gamePlayer.id
            });
            controlPanelWindow.webContents.send('stat', 'player-number', serverPlayers.length);
        }
        
        ws.on('error', logServerError);

        let canSayNotD = true;

        let plyrPos = gamePlayer.pos;
    
        ws.on('message', function(data, isbdata) {
            if(gamePlayer.connectionState == 0) return;
            if(isbdata) return;
            data += '';

            let stopAfter = false;

            pluginsEvents.anyMsg.forEach(ev => {
                if(ev(data) === true) stopAfter = true;
            });

            if(stopAfter) return;

            // On position update message
            if(data[0] == 'P') {
                
                // data = data.slice(1).split(';');

                // if(gamePlayer.canMove) {
                
                //     plyrPos.x = convertNumberFromMsg(data[0]);
                //     plyrPos.y = convertNumberFromMsg(data[1]);
                //     plyrPos.z = convertNumberFromMsg(data[2]);
                // }

                if(gamePlayer.canMove) {
                    plyrPos.x = msgFuncs.toPosNumber(data.slice(1));
                    plyrPos.y = msgFuncs.toPosNumber(data.slice(3));
                    plyrPos.z = msgFuncs.toPosNumber(data.slice(5));
                }

                // if(data.length < 4) return;
                if(data.length < 8) return;

                let lastD = data[7]+'';
                if(data.length > 8) lastD += data[8];

                let dataNameToS = '';
                let dataToS = null;
                let maxDistanceForUpdate = -1;

                switch (lastD[0]) {
                    case 'R':
                        gamePlayer.rot = msgFuncs.toSmallNumb(lastD.slice(1));
                        if(gamePlayer.rot > 360) gamePlayer.rot = 360;
                        break;
                        
                    case 'A':
                        gamePlayer.anim = msgFuncs.toSmallNumb(lastD.slice(1));
                        dataNameToS = 'A';
                        dataToS = gamePlayer.anim;
                        maxDistanceForUpdate = 6.5;
                        break;
                        
                    // Old disguise system
                    // case 'D':
                    //     gamePlayer.disguise = msgFuncs.toSmallNumb(lastD.slice(1));
                    // //     dataToS = 'D' + gamePlayer.disguise;
                    //     dataNameToS = 'D';
                    //     dataToS = gamePlayer.disguise;
                    //     break;
                        
                    case 'V':
                        if(gamePlayer.canBeInVehicle) {
                            gamePlayer.vehicle = msgFuncs.toSmallNumb(lastD.slice(1));
                            dataNameToS = 'V';
                            dataToS = gamePlayer.vehicle;
                        }
                        break;
                        
                    case 'K':
                        
                        if((!gamePlayer.isDed) && canSayNotD) {
                            gamePlayer.isDed = true;
                            onPlayerDed(gamePlayer);
                        
                            dataNameToS = 'A';
                            dataToS = 33;
                            maxDistanceForUpdate = 8.5;

                            canSayNotD = false;
                            
                            setTimeout(() => {
                                canSayNotD = true;
                            }, 600);
                        }
                        break;
                        
                        
                    case 'L':
                        if(gamePlayer.isDed && canSayNotD) {
                            gamePlayer.isDed = false;
                            canSayNotD = false;
                            
                            dataNameToS = 'A';
                            dataToS = 1;

                            maxDistanceForUpdate = 8.5;
                            
                            setTimeout(() => {
                                canSayNotD = true;
                            }, 250);
                        }
                        break;
                }
                
                if(dataToS === null) return;

                serverPlayers.forEach(
                    player => {
                        if(player == gamePlayer) {
                            if(isInTest) {
                                //ws.send('U'+(gamePlayer.id+1)+';'+dataToS);
                                ws.send(msgFuncs.toUpdateMsg(gamePlayer.id+1, dataNameToS, dataToS));
                            }
                            return;
                        }

                        if(maxDistanceForUpdate != -1 && player.distanceTo(gamePlayer) > maxDistanceForUpdate) return;
    
                        // player.sendMessage('U'+gamePlayer.id+';'+dataToS);
                        player.sendMessage(msgFuncs.toUpdateMsg(gamePlayer.id, dataNameToS, dataToS));
                    }
                );
                return;
            }

            // On custom plugin message
            if(data[0] == 'C') {
                let channelid = data.slice(1).split(';', 1)[0];

                let customMsg = data.slice(channelid.length + 2);

                pluginsEvents.msg.forEach(pluginEvObj => {
                    if(pluginEvObj.channelid == channelid) {
                        pluginEvObj.ev(customMsg);
                    }
                });

                return;
            }

            // On player actions
            if(data[0] == 'A') {
                
                switch (data[1]) {
                
                    // attack another player
                    case 'K':{

                        if(!serverAttr.pvpEnabled) break;

                        if(!gamePlayer.canMove) break;

                        /**
                         * @type Player
                         */
                        let plyrAttacked = convertNumberFromMsg(data.slice(2));

                        plyrAttacked = serverPlayers.find(plyr => plyr.id == plyrAttacked);

                        if(!plyrAttacked) break;
                        
                        if(plyrAttacked == gamePlayer || plyrAttacked.isInvulnerable || plyrAttacked.distanceTo(plyrPos) > gamePlayer.attackRange * serverAttr.rangeProtectionMultiplier) break;

                        // If an event return "true" cancel the attack
                        if( triggerEvents('playerAttacked', gamePlayer, plyrAttacked) ) break;

                        if(plyrAttacked.vehicle == 0) {
                            plyrAttacked.applyDamage( gamePlayer.attackPower );
                        } else {
                            plyrAttacked.applyDamage( gamePlayer.attackPower * serverAttr.attackPowerMultiplierOnVehicles );
                        }
                        break;}
                        
                    // When the player pressed a custom-server key
                    case 'A':{

                        if( triggerEvents('specialAction', gamePlayer) ) break;

                        if(gamePlayer.vehicle != 0) {

                            if(!gamePlayer.canUseSpecialAction) break;
                            if( vehicleManager.isBoat(gamePlayer.vehicle) ) break;

                            if( vehicleManager.isPlane(gamePlayer.vehicle) ) {
                                gamePlayer.canUseSpecialAction = false;
                                gamePlayer.removeVehicle();
                                
                                setTimeout(() => {
                                    gamePlayer.canUseSpecialAction = true;
                                }, 500);
                                break;
                            }

                            gamePlayer.canUseSpecialAction = false;

                            let projPos = positionFuncs.getPosWithRotation(gamePlayer.rot, -0.85);
                            
                            projPos.x += gamePlayer.pos.x;
                            projPos.y += gamePlayer.pos.y + 0.5;
                            projPos.z += gamePlayer.pos.z;

                            let projRot = gamePlayer.rot + 90;
                            if(projRot > 360) projRot -= 360;

                            spawnProjectileAt(
                                projPos.x, projPos.y, projPos.z, projRot
                            );

                            setTimeout(() => {
                                gamePlayer.canUseSpecialAction = true;
                            }, serverAttr.specialActionReloadTime);

                        } else {
                            gamePlayer.sendMessage('AA');
                        }
                        break;}

                    // When the player pressed a custom-server button
                    case 'B':
                        let pressedButtonId = data.slice(2);
                        let pressedButtonByPlyr = gamePlayer.serverButtons.find(sButton => sButton.id == pressedButtonId);
                        if(!pressedButtonByPlyr) break;
                        if(pressedButtonByPlyr.onclick) pressedButtonByPlyr.onclick(gamePlayer);
                        break;
                    
                    // Now the player have just 2 connection states (0 and 1)
                    // // change connection state
                    // case 'S':{
                    //     if(gamePlayer.connectionState == 0) break;
                    //     let newCState = data.slice(2);
                    //     gamePlayer.connectionState = newCState == '1' ? 1 : 2;
                    //     break;}
                    
                    // Change disguise
                    case 'D':{

                        if(!serverAttr.canChangeDisguises) break;

                        let newDisguise = data.slice(2);

                        if(newDisguise.length > 41) break;

                        // If an event return "true" don't update the disguise for other players
                        if( triggerEvents('disguiseChange', gamePlayer, newDisguise) ) break;

                        gamePlayer.disguiseId = newDisguise;

                        if(isInTest) {
                            gamePlayer.sendMessage('AO;D;'+(gamePlayer.id+1)+';'+newDisguise);
                        }
                        
                        serverPlayers.forEach(plyr => {
                            if(plyr == gamePlayer) return;

                            plyr.sendMessage('AO;D;'+gamePlayer.id+';'+newDisguise);
                        });
                        break;}
                
                    default:
                        break;
                }
                return;
            }
        });

        ws.on('close', function(){

            if(gamePlayer.connectionState == 0) return;

            gamePlayer.connectionState = 0;

            logServerMsg('client P['+gamePlayer.id+'] disconnected');
            
            serverPlayers.forEach(plyr=>{
                if(plyr == gamePlayer) return;

                plyr.sendMessage('P'+msgFuncs.toSmallMsg(gamePlayer.id)+msgFuncs.toPosMsg(0, 60, 0));
            });
            
            gamePlayer.remove();
            if(updaterInterval != null) clearInterval(updaterInterval);
            updaterInterval = null;
            
            pluginsEvents.disconnect.forEach(ev => {
                ev(gamePlayer);
            });
            if(controlPanelWindow) {
                controlPanelWindow.webContents.send('removePlayer', gamePlayer.id);
                controlPanelWindow.webContents.send('stat', 'player-number', serverPlayers.length);
            }
        });

        ws.send(gamePlayer.id);

        if( triggerEvents('connect', gamePlayer ) ) {
            gamePlayer.ejectFromServer();
            return;
        }
        
        if(serverAttr.isCheatsAllowed) gamePlayer.setCanUseCheats(true);

        // update the players disguises, vehicles and other attributes
        serverPlayers.forEach(
            player => {
                if(player == gamePlayer) return;

                setTimeout(() => {
                    if(gamePlayer.connectionState == 0 || player.connectionState == 0) return;
                    
                    if(player.disguiseId != '') gamePlayer.sendMessage('AO;D;'+player.id+';'+player.disguiseId);
                    // if(player.vehicle != 0) gamePlayer.sendMessage('U'+player.id+';V'+player.vehicle);
                    if(player.vehicle != 0) gamePlayer.sendMessage(msgFuncs.toUpdateMsg(player.id, 'V', player.vehicle));
                    if(player.isVisibleOnMap) {
                        setTimeout(() => {
                            if(player.isVisibleOnMap) gamePlayer.sendMessage('AM'+player.id+';1');
                        }, 200);
                    }
                }, 700);

            }
        );


        let playerToUpdateI = 0;

        // *********************** UPDATING THE CLIENT ***********************

        updaterInterval = setInterval(() => {

            if(gamePlayer.connectionState != 1) return;

            if(serverPlayers.length < 2) {
                if(isInTest) {
                    const posToSTest = gamePlayer.pos;
                    // if(gamePlayer.isVisible) ws.send('P'+(gamePlayer.id+1)+';'+(gamePlayer.pos.x+(gamePlayer.vehicle ? 2 : 0.7)).toFixed(2)+';'+gamePlayer.pos.y.toFixed(2)+';'+gamePlayer.pos.z.toFixed(2)+';R'+gamePlayer.rot);
                    if(gamePlayer.isVisible) gamePlayer.sendMessage('P'+msgFuncs.toSmallMsg(gamePlayer.id+1)+msgFuncs.toPosMsg(posToSTest.x + (gamePlayer.vehicle ? 2 : 0.7), posToSTest.y, posToSTest.z, gamePlayer.rot));
                }
                return;
            }

            // playerToUpdateI > serverPlayers.length is an error because serverPlayers[serverPlayers.length] == null but so it will not use send so many messages so i keep this "error"

            playerToUpdateI++;
            if(playerToUpdateI > serverPlayers.length) playerToUpdateI = 0;
            
            let playerToSend = serverPlayers[playerToUpdateI];
            
            if(playerToSend == gamePlayer) {
                playerToUpdateI++;
                if(playerToUpdateI > serverPlayers.length) playerToUpdateI = 0;
                playerToSend = serverPlayers[playerToUpdateI];
            }

            if(playerToSend == null || playerToSend.isVisible == false) return;

            const posToS = playerToSend.pos;

            // gamePlayer.sendMessage('P'+playerToSend.id+';'+posToS.x.toFixed(2)+';'+posToS.y.toFixed(2)+';'+posToS.z.toFixed(2)+';'+msgFuncs.toSmallMsg(playerToSend.rot));
            gamePlayer.sendMessage('P'+msgFuncs.toSmallMsg(playerToSend.id)+msgFuncs.toPosMsg(posToS.x, posToS.y, posToS.z, playerToSend.rot));
        }, 75);

    });
    
    wsServer.onerror = err => {
        logServerMsg('Error in WebSocket server :');
        logServerError(err);
    };
    
    server.on('upgrade', (request, socket, head) => {
        
        if( triggerEvents('tryToConnect', request) ||

            // For the old client versions because it's not compatible :
        ( request && request.rawHeaders && typeof request.rawHeaders.find == 'function' && request.rawHeaders.find(txt => (txt+'').toLowerCase().includes('python')) )
        ) {
            return;
        }
        wsServer.handleUpgrade(request, socket, head, socket => {
            wsServer.emit('connection', socket, request);
        });
    });


    function addToWindowPluginButton(pluginId, buttonObj) {
        if(controlPanelWindow) controlPanelWindow.webContents.send('addPluginButton', pluginId, {
            id: buttonObj.id,
            name: buttonObj.name
        });
    }

    function removeButtonInitFunc(playerToRemoveButton, buttonId) {
        playerToRemoveButton.sendMessage('AO;B;R;' + buttonId);
        playerToRemoveButton.serverButtons = playerToRemoveButton.serverButtons.filter(sButtonT => sButtonT.id != buttonId);
    }

    // ***************************** The plugin API : *****************************


    let apiObject = (pluginObj) => {

        pluginObj.manageButtons = [];

        // Remove old events
        for (const key in pluginsEvents) {
            pluginsEvents[key] = pluginsEvents[key].filter(ev => ev.pluginName != pluginObj.name);
        }

        // Remove old custom-buttons
        serverPlayers.forEach(plyr => {
            plyr.serverButtons.forEach(servButton => {
                if(servButton.pluginName == pluginObj.name) removeButtonInitFunc(plyr, servButton.id);
            });
        })

        // pluginsEvents.anyMsg = pluginsEvents.anyMsg.filter(ev => ev.pluginName != pluginObj.name);
        // pluginsEvents.msg = pluginsEvents.msg.filter(ev => ev.pluginName != pluginObj.name);
        
        // pluginsEvents.connect = pluginsEvents.connect.filter(ev => ev.pluginName != pluginObj.name);
        // pluginsEvents.disconnect = pluginsEvents.disconnect.filter(ev => ev.pluginName != pluginObj.name);

        return {
            players: serverPlayers,

            serverAttr,
            initPlyrAttr,
            maxPlayerNumber,

            vehicleManager,

            msgFuncs,

            getControlPanelWindow: () => controlPanelWindow,
            
            pluginElementAPI: {
                /**
                 * @example
                 * pluginElementAPI.addCustomButton({
                 *   name: "Example Button"
                 *   id: "button-id",
                 *   run: () => {
                 *      console.log('example');
                 *   }
                 * })
                 * @param {Object} newButton 
                 */
                addCustomButton: (newButton) => {
                    if(!newButton.id) return false;
                    pluginObj.manageButtons.push(newButton);
                    addToWindowPluginButton(pluginObj.name, newButton);
                    return true;
                },
                removeCustomButton: (customButtonId) => {
                    pluginObj.manageButtons = pluginObj.manageButtons.filter(alreadyExistingButton => alreadyExistingButton.id != customButtonId);
                    if(controlPanelWindow) controlPanelWindow.webContents.send('removePluginButton', pluginObj.name, customButtonId);
                }
            },
            
            sendCustomMessage: (playerid, channelid, messagedatas) => {
                let playerToSendMsg;
                if(typeof playerid == 'object' && playerid.sendMessage) {
                    playerToSendMsg = playerid;
                } else {
                    playerToSendMsg = serverPlayers.find(plyr => plyr.id == playerid);
                }
                if(!playerToSendMsg) return false;
                playerToSendMsg.sendMessage('C' + channelid + ';' + messagedatas);
                return true;
            },

            // For sending any types of message like the position messages, not common to use
            sendSpecialMessage: (playerid, messagedatas) => {
                let playerToSendMsg;
                if(typeof playerid == 'object' && playerid.sendMessage) {
                    playerToSendMsg = playerid;
                } else {
                    playerToSendMsg = serverPlayers.find(plyr => plyr.id == playerid);
                }
                if(!playerToSendMsg) return false;
                playerToSendMsg.sendMessage(messagedatas);
                return true;
            },

            positionFuncs,

            characterAPI: {
                safeToCreateNewFakePlayer: () => serverPlayers.length < maxPlayerNumber,

                spawnProjectileAt,

                CHARS: {
                    MAGICIAN: "m",
                    ROBOT: 'b',
                    NINJA: 'n',
                    SAMURAI: 's',
                    ALIEN: 'a',
                    GUARD: 'g',
                    COP: 'o',
                    ROBBER: 'r',
                    ASTRONAUT: 'v',
                    CIVILIAN_1: '1',
                    CIVILIAN_2: '2',
                    CIVILIAN_3: '3',
                    CIVILIAN_4: '4',
                    PIG: 'p',
                    DINOSAUR: 't',
                    DOG: 'd',
                    BALL_RED: 'y'
                },

                /**
                 * @example
                 * pluginAPI.characterAPI.createFakePlayer(pluginAPI.CHATS.ALIEN, {x:0,y:70,z:0});
                 * @param {null | String} characterType 
                 * @param {null | Object} newPlayerPos 
                 * @returns 
                 */
                createFakePlayer: (characterType = "", newPlayerPos) => {
                    let fakePlyr = new Player({send:()=>{}});
                    fakePlyr.isFakePlayer = true;
                    fakePlyr.sendMessage = () => {};

                    let fakePlyrPluginEvents = {
                        onRemoved: null,
                        onDamage: null
                    };

                    fakePlyr.ejectFromServer = () => {

                        if(fakePlyrPluginEvents.onRemoved && fakePlyrPluginEvents.onRemoved(fakePlyr) === true) return;

                        fakePlyr.connectionState = 0;
                        let voidPosMsg = 'P'+msgFuncs.toSmallMsg(fakePlyr.id)+msgFuncs.toPosMsg(0, 60, 0);
                        
                        serverPlayers.forEach(plyr=>{
                            if(plyr.connectionState == 0) return;

                            plyr.sendMessage(voidPosMsg);
                        });

                        fakePlyr.remove();
                        pluginsEvents.disconnect.forEach(ev => {
                            ev(gamePlayer);
                        });
                    }

                    let maxFakePlayerHP = 4;

                    let fakePlayerHP = maxFakePlayerHP;

                    function updateToEveryPlyrs(maxDistanceForUpdate = -1, dataNameToS, dataToS) {

                        serverPlayers.forEach(otherPlyr => {
                            if(maxDistanceForUpdate != -1 && otherPlyr.distanceTo(fakePlyr) > maxDistanceForUpdate) return;
                            
                            otherPlyr.sendMessage(msgFuncs.toUpdateMsg(fakePlyr.id, dataNameToS, dataToS));
                        });
                    }

                    fakePlyr.setHP = (newPlyrHP, isVehicleHP) => {
                        newPlyrHP = parseInt(newPlyrHP) || 0;
                        if(newPlyrHP > maxFakePlayerHP) newPlyrHP = maxFakePlayerHP;
                        
                        if(newPlyrHP < 1) {
                            if(isVehicleHP) {
                                fakePlayerHP.removeVehicle();
                            } else {
                                fakePlayerHP.kill();
                            }
                            return;
                        }

                        fakePlayerHP = newPlyrHP;
                    }

                    fakePlyr.kill = () => {
                        fakePlayerHP = 0;
                        onPlayerDed(fakePlyr);
                        
                        if(fakePlyr.isDed) return;
                        fakePlyr.isDed = true;
                        updateToEveryPlyrs(8, 'A', 33);
                        setTimeout(() => {
                            fakePlyr.isDed = false;
                            updateToEveryPlyrs(8, 'A', 1);
                            fakePlayerHP = maxFakePlayerHP;
                        }, 4500);
                    }

                    function applyVelOnFakePlayer(velX, velY, velZ, unamplifierPower = 2) {
                        let intervalApplyingVel = setInterval(() => {
                            if(
                                (
                                    velX < 0.01 && velX > -0.01
                                 && velY < 0.01 && velY > -0.01
                                 && velZ < 0.01 && velZ > -0.01
                                )
                                || fakePlyr.connectionState == 0 || fakePlyr.isDed) {
                                clearInterval(intervalApplyingVel);
                                return;
                            }
                            fakePlyr.pos.x += velX;
                            velX /= unamplifierPower;
                            fakePlyr.pos.y += velY;
                            velY /= unamplifierPower;
                            fakePlyr.pos.z += velZ;
                            velZ /= unamplifierPower;

                        }, 25);
                    }

                    function onFakePlyrDamage(plyr, damageNumber, damageKnockback = 3) {
                        if(fakePlyrPluginEvents.onDamage && fakePlyrPluginEvents.onDamage(fakePlyr, fakePlayerHP, damageNumber) === true) return;
                        fakePlayerHP -= damageNumber;
                        if(fakePlayerHP <= 0) {
                            fakePlayerHP = 0;
                            plyr.kill();
                            return;
                        }
                        updateToEveryPlyrs(8, 'A', 2);
                        if(damageKnockback) {
                            let velToApply = positionFuncs.getPosWithRotation(plyr.rot, damageKnockback);
                            applyVelOnFakePlayer(velToApply.x, damageKnockback / 17, velToApply.z, 2);
                        }
                        setTimeout(() => {
                            updateToEveryPlyrs(8, 'A', 1);
                        }, 500);
                    }

                    fakePlyr.applyDamage = ((numberofdamages) => {
                        if(this.isDed || (!this.canReceiveDamage)) return;

                        this.canReceiveDamage = false;
                        if(typeof numberofdamages != 'number') {
                            if(typeof numberofdamages != 'bigint') {
                                numberofdamages = Number(numberofdamages);
                            } else {
                                numberofdamages = 1;
                            }
                        }
                        
                        onFakePlyrDamage(this, numberofdamages);

                        setTimeout(() => {
                            this.canReceiveDamage = true;
                        }, serverAttr.damagesProtectionTime);
                    }).bind(fakePlyr);

                    if(newPlayerPos) {
                        fakePlyr.pos.x = newPlayerPos.x;
                        fakePlyr.pos.y = newPlayerPos.y;
                        fakePlyr.pos.z = newPlayerPos.z;
                    }

                    function setCharDisguise(newCharType) {
                        characterType = newCharType;
                        fakePlyr.disguiseId = characterType;
                        serverPlayers.forEach(plyr => {
                            plyr.sendMessage('AO;D;'+fakePlyr.id+';'+characterType);
                        });
                    }

                    if(characterType) setCharDisguise(characterType);

                    //TODO: A SETGOALPOSITION FUNCTION

                    return {
                        character: fakePlyr,
                        setMaxHP: newMaxPlyrHP => maxFakePlayerHP = newMaxPlyrHP,
                        setHP: fakePlyr.setHP,
                        setCharDisguise,
                        fakePlyrPluginEvents,
                        applyVelOnFakePlayer,

                        updateToEveryPlyrs
                    };
                }
            },

            soundAPI: {
                SOUNDS: {
                    BEEP: 'p',
                    WIN_VOICE: 'w',
                    COUNTDOWN: 'c',
                    WON: 'f',
                    WON_SOMETHING: 't',
                    CHANGE_CHAR: 'd',
                    WRONG: 'n',
                    FOUND_GOAL: 'g',
                    TRIAL_START: 'o'
                },

                /**
                 * @example
                 * let player = pluginAPI.players[0];
                 * // Playing the won sound:
                 * pluginAPI.soundAPI.playSoundToPlayer( player, pluginAPI.soundAPI.WON );
                 * // Playing the won sound at the pos of a player:
                 * let otherPlayer = pluginAPI.players[1];
                 * pluginAPI.soundAPI.playSoundToPlayer( player, pluginAPI.soundAPI.WON, otherPlayer.id );
                 * @param {Player} player 
                 * @param {String} soundId 
                 * @param {null|Number} soundPlayerId 
                 */
                playSoundToPlayer: (player, soundId, soundPlayerId) => {
                    if(typeof soundPlayerId != 'number' && soundPlayerId && soundPlayerId.id) soundPlayerId = soundPlayerId.id;

                    player.sendMessage('AY;' + soundId + (soundPlayerId == null ? '' : msgFuncs.toSmallMsg(soundPlayerId)));
                },
                
                /**
                 * @example
                 * // Playing the won sound to any players:
                 * pluginAPI.soundAPI.playSoundToAllPlayers( pluginAPI.soundAPI.WON );
                 * // Playing the won sound to any players at the pos of a player:
                 * let otherPlayer = pluginAPI.players[0];
                 * pluginAPI.soundAPI.playSoundToAllPlayers( pluginAPI.soundAPI.WON, otherPlayer.id );
                 * @param {String} soundId 
                 * @param {null|Number} soundPlayerId 
                 */
                playSoundToAllPlayers: (soundId, soundPlayerId) => {
                    let msgStart = 'AY;' + soundId;
                    
                    if(typeof soundPlayerId != 'number' && soundPlayerId && soundPlayerId.id) soundPlayerId = soundPlayerId.id;

                    if(typeof soundPlayerId == 'number') {
                        msgStart += msgFuncs.toSmallMsg(soundPlayerId);
                        serverPlayers.forEach(plyr => {
                            if(plyr.connectionState == 0) return;
                            plyr.sendMessage(plyr.id == soundPlayerId ? 'AY;' + soundId : msgStart);
                        });
                        return;
                    }

                    serverPlayers.forEach(plyr => {
                        if(plyr.connectionState == 0) return;
                        plyr.sendMessage(msgStart);
                    });
                },
            },

            buttonsManager: {

                /**
                 * @example
                 * addButtonToPlayer(player, { id: "mybutton", name: "My Button", onclick: () => { console.log('clicked'); } })
                 * @param {Player} playerToAddButton 
                 * @param {Object} buttonObj 
                 */
                addButtonToPlayer: (playerToAddButton, buttonObj) => {

                    buttonObj.pluginName = pluginObj.name;

                    playerToAddButton.sendMessage('AO;B;A;' + buttonObj.name + ';' + buttonObj.id);
                    
                    let servButtonToEdit = playerToAddButton.serverButtons.find(servButtonR => servButtonR.id == buttonObj.id);
                    if(servButtonToEdit != null) {
                        if(buttonObj.name) servButtonToEdit.name = buttonObj.name;
                        if(buttonObj.onclick) servButtonToEdit.onclick = buttonObj.onclick;
                    } else {
                        playerToAddButton.serverButtons.push(buttonObj);
                    }
                },

                // Yeah this is the same function because actually the addButtonToPlayer function edit the button if a button already have the same id
                editButtonOfPlayer: (playerToAddButton, buttonObj) => {

                    buttonObj.pluginName = pluginObj.name;

                    playerToAddButton.sendMessage('AO;B;A;' + buttonObj.name + ';' + buttonObj.id);
                    
                    let servButtonToEdit = playerToAddButton.serverButtons.find(servButtonR => servButtonR.id == buttonObj.id);
                    if(servButtonToEdit != null) {
                        if(buttonObj.name) servButtonToEdit.name = buttonObj.name;
                        if(buttonObj.onclick) servButtonToEdit.onclick = buttonObj.onclick;
                    } else {
                        playerToAddButton.serverButtons.push(buttonObj);
                    }
                },

                /**
                 * @example
                 * removeButtonToPlayer(player, "mybutton")
                 * @param {Player} playerToRemoveButton 
                 * @param {String} buttonId 
                 */
                removeButtonToPlayer: (playerToRemoveButton, buttonId) => {
                    removeButtonInitFunc(playerToRemoveButton, buttonId);
                }
            },

            TEXTALLOWEDS: {
                GO: 'g',
                WON: 'w',
                LOST: 'd',
                FIND_VEHICLE: 'v',
                JOINED_TEAM_1: 't1',
                JOINED_TEAM_2: 't2',
                TEAM_1_IS_FREE: 'f1',
                TEAM_2_IS_FREE: 'f2',
                TEAM_1_WON_A_POINT: 'u1',
                TEAM_1_LOST_A_POINT: 'd1',
                TEAM_2_WON_A_POINT: 'u2',
                TEAM_2_LOST_A_POINT: 'd2',
                1: 1,
                2: 2,
                3: 3,
                PARTY_IS_STARTING: 'p1',
                PARTY_IS_END: 'p2'
            },

            /**
             * @example
             * pluginAPI.showTextWithTextId(player, pluginAPI.TEXTALLOWEDS.JOINED_TEAM_1, 5); // 5 = 5 seconds
             */
            showTextWithTextId: (playerToShowText, textId, timeToShow, modeToUseT) => {
                playerToShowText.sendMessage('AS;' + (modeToUseT? modeToUseT+'':'0') + textId + ';' + (timeToShow || 1));
            },

            events: {
                
                onCustomMessage: (channelid, ev) => {
                    pluginsEvents.msg.push({ev, channelid, pluginName: pluginObj.name});
                },
                
                onAnyMessage: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.anyMsg.push(ev);
                },
                
                onPlayerConnecting: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.tryToConnect.push(ev);
                },

                onPlayerConnected: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.connect.push(ev);
                },
                
                onPlayerDisconnected: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.disconnect.push(ev);
                },
                
                /**
                 * @example onChangeParty((player, newPartyId) => {
                 *     if(newPartyId == "my-party") return;
                 * })
                 * @param {Function} ev 
                 */
                onChangeParty: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.onChangeParty.push(ev);
                },
                
                onChangeDisguise: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.disguiseChange.push(ev);
                },

                onPlayerAttacked: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.playerAttacked.push(ev);
                },

                onPlayerDed: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.plyrDed.push(ev);
                },

                onSpecialActionPressedButton: (ev) => {
                    ev.pluginName = pluginObj.name;
                    pluginsEvents.specialAction.push(ev);
                }
            }
        }
    };


 

    // ***************************** Create the control-panel menu : *****************************
    
    if(spawnServerWindow == -1) {
        setTimeout(() => {
            if(typeof spawnServerWindow == 'function') spawnServerWindow();
        }, 250);
    }
    spawnServerWindow = () => {

        controlPanelWindow = gameAPI.interface.createMenu(
            require('path').join(__dirname, 'interface/control-panel/index.html'),
            require('path').join(__dirname, 'interface/control-panel/preload.js')
        );

        controlPanelWindow.once('close', () => {
            controlPanelWindow = null;
            stopServer();
        });
        
        //controlPanelWindow.webContents.once('dom-ready', () => {
        controlPanelWindow.webContents.on('dom-ready', () => {
            if(!controlPanelWindow) return;
            controlPanelWindow.webContents.send('stat', 'port', typeof configServer.port == 'number' ? configServer.port : 3001);
            controlPanelWindow.webContents.send('stat', 'player-number', serverPlayers.length);
            controlPanelWindow.webContents.send('stat', 'is-players-accepted', serverAttr.acceptNewPlayers ? 'yes' : 'no');
            controlPanelWindow.webContents.send('stat', 'is-pvp-enabled', serverAttr.pvpEnabled ? 'yes' : 'no');

            serverPlayers.forEach(plyr=>{

                controlPanelWindow.webContents.send('addPlayer', {
                    id: plyr.id
                });
            });
            
            gameAPI.onlineMod.serverPlugins.forEach( pluginS => {
                controlPanelWindow.webContents.send('addPlugin', pluginS.name);
                controlPanelWindow.webContents.send('pluginSetIsActive', pluginS.name, pluginS.isEnabled);
                
                pluginS.manageButtons.forEach((buttonObjPlugin)=>{
                    addToWindowPluginButton(pluginS.name, buttonObjPlugin);
                });
            });
        });

        let canTooglePlugins = true;


        // Handle the connection with the menu :
        controlPanelWindow.webContents.on('ipc-message', (ev, channelMsg, ...args) => {
            switch (channelMsg) {
                
                // When the user manage the plugins in the menu :
                case 'plugin':

                    switch (args[0]) {
                        
                        case 'button':{

                            let pluginToEdit = gameAPI.onlineMod.serverPlugins.find(plyr=> plyr.id == args[1]);
                            if(!pluginToEdit) break;
                            
                            let pluginButton = pluginToEdit.manageButtons.find(buttonOfPlugin => buttonOfPlugin.id == args[2]);
                            if(pluginButton.run) pluginButton.run();

                            break;}

                        case 'toogle':{
                            if(!canTooglePlugins) break;
                            canTooglePlugins = false;
                            let pluginToToggle = gameAPI.onlineMod.serverPlugins.find(p => p.name == args[1]);
                            if(!pluginToToggle) {
                                canTooglePlugins = true;
                                break;
                            }

                            pluginToToggle.isEnabled = !pluginToToggle.isEnabled;

                            let funcToExecute = pluginToToggle[ pluginToToggle.isEnabled ? 'onActive' : 'onDisable' ];

                            if(typeof funcToExecute != 'function') {
                                gameAPI.interface.showMessage('Error: the plugin have not a function named "' + (pluginToToggle.isEnabled ? 'onActive' : 'onDisable') + '"');
                                canTooglePlugins = true;
                                break;
                            }
                            funcToExecute = funcToExecute(apiObject(pluginToToggle));
                            if(funcToExecute && typeof funcToExecute.then == 'function') {
                                funcToExecute.then(()=>{
                                    logServerMsg('Toogled plugin');
                                    canTooglePlugins = true;
                                    if(controlPanelWindow) controlPanelWindow.webContents.send('pluginSetIsActive', pluginToToggle.name, pluginToToggle.isEnabled);
                                }).catch((err) => {
                                    canTooglePlugins = true;
                                    
                                    console.error(err);
                                    gameAPI.interface.showMessage('Error: cannot toogle the plugin "' + pluginToToggle.name + '"')
                                })
                                break;
                            }
                            logServerMsg('Toogled plugin');
                            canTooglePlugins = true;
                            if(controlPanelWindow) controlPanelWindow.webContents.send('pluginSetIsActive', pluginToToggle.name, pluginToToggle.isEnabled);
                            break;}
                    }
                    break;
                
                case 'toogle-players-accepted':
                    serverAttr.acceptNewPlayers = serverAttr.acceptNewPlayers == false;
                    if(controlPanelWindow) controlPanelWindow.webContents.send('stat', 'is-players-accepted', serverAttr.acceptNewPlayers ? 'yes' : 'no');
                    break;
                
                case 'toogle-pvp':
                    serverAttr.pvpEnabled = serverAttr.pvpEnabled == false;
                    if(controlPanelWindow) controlPanelWindow.webContents.send('stat', 'is-pvp-enabled', serverAttr.pvpEnabled ? 'yes' : 'no');
                    break;
                    
                case 'debug-functions':
                    switch (args[0]) {
                        case 'log-players':
                            console.log(
                                serverPlayers.map(plyrToLog => plyrToLog.id)
                            );
                            break;
                    
                        default:
                            break;
                    }
                    break;
                
                case 'manage-player':{
                    let playerToEdit = serverPlayers.find(plyr=> plyr.id == args[1]);
                    if(!playerToEdit) break;
                    switch (args[0]) {
                        case 'toogle-visibility-on-map':
                            playerToEdit.setIsVisibleOnMap(!playerToEdit.isVisibleOnMap);
                            break;
                            
                        case 'toogle-visibility':
                            playerToEdit.setIsVisible(!playerToEdit.isVisible);
                            break;
                            
                        case 'tp':
                            let newPRotTP = playerToEdit.rot + Math.floor(Math.random() * 40) - 20;
                            while (newPRotTP > 360) {
                                newPRotTP -= 360;
                            }
                            if (newPRotTP < 0) {
                                newPRotTP = 0;
                            }
                            playerToEdit.teleport(
                                playerToEdit.pos.x + Math.floor(Math.random() * 4) - 2,
                                playerToEdit.pos.y + Math.floor(Math.random() * 2),
                                playerToEdit.pos.z + Math.floor(Math.random() * 4) - 2,
                                newPRotTP,
                            );
                            break;
                            
                        case 'instant-damage':
                            playerToEdit.kill();
                            break;
                            
                        case 'apply-damage':
                            playerToEdit.applyDamage(1);
                            break;
                            
                        case 'toogle-canmove':
                            playerToEdit.setCanMove(!playerToEdit.canMove);
                            break;
                            
                        case 'toogle-canuseanymods':
                            playerToEdit.setCanUseCheats(!playerToEdit.canUseCheats);
                            break;
                            
                        case 'toogle-can-v':
                            playerToEdit.setCanBeInVehicle(!playerToEdit.canBeInVehicle);
                            break;
                            
                        case 'set-s':
                            playerToEdit.setSpeed(args[2]);
                            break;
                            
                        case 'spawn-projectile':
                            spawnProjectileAt(playerToEdit.pos.x, playerToEdit.pos.y + 0.8, playerToEdit.pos.z, playerToEdit.rot);
                            break;
                            
                        case 'spawn-instantprojectile':
                            spawnProjectileAt(playerToEdit.pos.x + 0.8, playerToEdit.pos.y, playerToEdit.pos.z, playerToEdit.rot, true);
                            break;

                        case 'setv':
                            playerToEdit.setVehicle(parseInt(args[2]) || 0, args[3]+'' == '1', args[4]+'' == '1');
                            break;
                        
                        case 'disconnect':
                            playerToEdit.ejectFromServer();
                            break;
                        
                        case 'addcoins':
                            if(Math.random() > 0.5) {
                                playerToEdit.spawnCoins(1585);
                            } else {
                                playerToEdit.spawnCoins(1585, {
                                    x: playerToEdit.pos.x + (Math.random() * 3) - 1,
                                    y: playerToEdit.pos.y,
                                    z: playerToEdit.pos.z + (Math.random() * 3) - 1
                                });
                            }
                            break;
                    }
                    break;}
                
            }
        });
        
    }
}