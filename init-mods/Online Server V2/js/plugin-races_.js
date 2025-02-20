
// TO EDIT THIS CONFIG EDIT THE FILE NAMED "config-plugin-racing.txt" IN THE SAME FOLDER OF THIS FILE
let configParties = {
    
    maxTimeToRace: 14 * 60, // The limit of a race is 14 minutes max, after the race will be stopped
    
    canVehiclesBeDestroyed: true, // If set to "false", in a race the vehicles cannot take damages

    distanceToWin: 0.9, // The maximum distance with the goal to win the races

    maxPlayersInARace: 6, // The maximum of players in the same race
    minPlayersInARace: 2, // The minimum of players in the same race (don't put something lower than 2)

    isPlayersVisibleInRaces: true, // If is "false", in a race the players can't see other players that are racing and so there is collisions

    trafficDensity: 0.3, // From 0 to 1, 1 is the normal density

    coinsGived: 5585, // Coins gived to the winner
    
    canLogInConsole: false
};


const allRaces = [
    
{
    start:[
       {
            x: 275.8778687,
            y: 2.99,
            z: -30.10530281,
    
            rot: 221,
       },
       {
            x: 275.3236084,
            y: 2.965140581,
            z: -29.56941223,
    
            rot: 222,
       },
       {
            x: 274.9829712,
            y: 2.965140581,
            z: -29.04594994,
    
            rot: 221,
       },
       {
            x: 274.4006653,
            y: 2.965140581,
            z: -28.58811378,
    
            rot: 221,
       },
    ],
 
    end: {
        x: 143.0941315,
        y: 1.819044828,
        z: 272.960083,
    }

    },
    
    {

        start: [
            {
                x: 217.8976135,
                y: 1.988623142,
                z: -276.861969,
                rot: 295
            },
            {
                x: 218.2425385,
                y: 1.988623142,
                z: -276.2298584,
                rot: 292
            },
            {
                x: 217.5270538,
                y: 1.988623142,
                z: -277.5974731,
                rot: 309
            },
            {
                x: 216.9838,
                y: 1.988623142,
                z: -278.2042542,
                rot: 322
            },
            {
                x: 216.24,
                y: 1.988623142,
                z: -279.26,
                rot: 348
            },
        ],
    
        end: {
            x: 243.2829,
            y: 2.59346,
            z: 63.18
        },
    },
    
    {
    start:[
       {
            x: 237.8410645,
            y: 2.765685797,
            z: 154.2814636,
    
            rot: 181,
       },
       {
            x: 238.7890778,
            y: 2.765685797,
            z: 153.7121429,
    
            rot: 178,
       },
       {
            x: 239.4813843,
            y: 2.8,
            z: 153.7287445,
    
            rot: 180,
       },
       {
            x: 240.1493835,
            y: 2.8,
            z: 153.7768707,
    
            rot: 180,
       },
       {
            x: 240.7720795,
            y: 2.8,
            z: 153.7494354,
    
            rot: 179,
       },
       {
            x: 241.5931549,
            y: 2.8,
            z: 153.8197,
    
            rot: 179,
       },
    ],
 
    end: {
        x: 113.3608093,
        y: 4.253366947,
        z: -167.0903473,
    }

    },
 
    {
        start:[
        {
            x: 103.1121674,
            y: 2.796575069,
            z: -217.5992126,
    
            rot: 78,
        },
        {
            x: 102.8629684,
            y: 2.796575069,
            z: -218.5861053,
    
            rot: 78,
        },
        {
            x: 102.6151505,
            y: 2.796575069,
            z: -217.1305389,
    
            rot: 80,
        },
        {
            x: 102.735672,
            y: 2.796575069,
            z: -216.1136322,
    
            rot: 77,
        },
        {
            x: 102.4436188,
            y: 2.796575069,
            z: -215.3236847,
    
            rot: 179,
        }
        ],
    
        end: {
            x: 64.34387207,
            y: 4.273118019,
            z: 23.18499184,
        }
    },
 
 
    {
    start: [
        {
            x: 134.5338,
            y: 2.10222,
            z: -325.911,
            rot: 341
        },
        {
            x: 133.5865631,
            y: 2.10176158,
            z: -325.3305054,
            rot: 337
        },
        {
            x: 132.6382599,
            y: 2.10176158,
            z: -325.9583435,
            rot: 341
        },
        {
            x: 131.8339,
            y: 2.10176158,
            z: -326.468811,
            rot: 340
        }
    ],
    end: {
        x: 67.81729126,
        y: 2.463097095,
        z: 193.0315247
    }

    },
    
    
    {
    start: [
        {
            x: 34.12174606,
            y: -4.180845737,
            z: 175.5773163,
            rot: 67
        },
        {
            x: 34.531,
            y: -4.180845737,
            z: 174.7817841,
            rot: 68
        },
        {
            x: 34.531,
            y: -4.180845737,
            z: 174.7817841,
            rot: 68
        },
        {
            x: 34.860,
            y: -4.180845737,
            z: 173.9365997,
            rot: 67
        },
        {
            x: 35.05654907,
            y: -4.180845737,
            z: 173.0475769,
            rot: 65
        }
    ],
    end: {
        x: 247.5186005,
        y: 2.377583265,
        z: -142.3651276
    }

    },
    
    
    {
    start: [
        {
            x: 209.1713715,
            y: 2.361807657,
            z: -187.3614807,
            rot: 78
        },
        {
            x: 207.3947906,
            y: 2.361874819,
            z: -186.3208466,
            rot: 80
        },
        {
            x: 211.6417847,
            y: 2.362729549,
            z: -187.2966461,
            rot: 82
        },
        {
            x: 34.860,
            y: -4.180845737,
            z: -190.03685,
            rot: 67
        },
        {
            x: 215.7037659,
            y: 2.359288454,
            z: -190.03685,
            rot: 45
        }
    ],
    end: {
            x: -184.6360474,
            y: 1.246663809,
            z: -22.45766068
        }
    },    
    
    {
    start: [
        {
            x: -152.5152435,
            y: 1.423783183,
            z: -21.5440197,
            rot: 241
        },
        {
            x: -153.3183441,
            y: 1.423783183,
            z: -20.86188889,
            rot: 242
        },
        {
            x: -153.8384399,
            y: 1.423783183,
            z: -20.12264061,
            rot: 241
        },
        {
            x: -154.40271,
            y: -4.180845737,
            z: -18.5485878,
            rot: 241
        }
        ],
        end: { //BRIDGE
            x: -235.1669922,
            y: 12.21174526,
            z: -34.24365997
        }
    },


    {
        start:[
            {
                x: -180.6138611,
                y: 6.654243469,
                z: -65.69094849,
        
                rot: 140,
            },
            {
                x: -181.2848663,
                y: 6.654243469,
                z: -66.16821289,
        
                rot: 140,
            },
            {
                x: -182.0231476,
                y: 6.654243469,
                z: -66.12026215,
        
                rot: 140,
            },
            {
                x: -182.7439423,
                y: 6.654243469,
                z: -66.912117,
        
                rot: 140,
            },
        ],
     
        end: {
            x: -90.87328339,
            y: 3.358975172,
            z: -220.9045563,
        }
    },
    
    
    
    
    {
        start:[
            {
                x: 124.1202011,
                y: 1.865845561,
                z: 278.3029175,
        
                rot: 94,
            },
            {
                x: 124.0764999,
                y: 1.865845561,
                z: 277.5875854,
        
                rot: 90,
            },
            {
                x: 124.0991211,
                y: 1.865845561,
                z: 276.9455566,
        
                rot: 88,
            },
            {
                x: 124.1428757,
                y: 1.865845561,
                z: 276.0248718,
        
                rot: 68,
            },
        ],
     
        end: {
            x: 38.19619751,
            y: -4.301249981,
            z: 177.5842743,
        }
    },

    
{
	start: [
		{
			x: -102.0803833,
			y: 3.602787256,
			z: -226.2879028,

			rot: 2
		},
		{
			x: -102.9195633,
			y: 3.602787256,
			z: -226.2912903,

			rot: 2
		},
		{
			x: -103.6632614,
			y: 3.602787256,
			z: -226.2732086,

			rot: 2
		},
		{
			x: -101.0576706,
			y: 3.602787256,
			z: -226.3387146,

			rot: 0
		},
		{
			x: -104.4415436,
			y: 3.602787256,
			z: -226.2507782,

			rot: 2
		},
		],
	end:{
		x:-219.2472382,
		y:13.60281086,
		z:395.0375061
	}
},

{
	start: [
		{
			x: -103.1007004,
			y: 3.607980967,
			z: 376.9058838,

			rot: 114
		},
		{
			x: -103.0965805,
			y: 3.607980967,
			z: 378.7869263,

			rot: 114
		},
		{
			x: -102.5086212,
			y: 3.607980967,
			z: 380.1643066,

			rot: 114
		},
		{
			x: -102.5086212,
			y: 3.607980967,
			z: 380.9822083,

			rot: 114
		}
		],
	end:{
		x: 80.602211,
		y: 1.876295567,
		z: -34.39144135,
	}
}
];


let gameAPI;
let pluginAPI;

let isPluginEnabled = false;

function logAnyMsg(msg) {
    console.log('[server-plugin:Custom-Races]', msg);
}

function showMessage(msg) {
    gameAPI.interface.showMessage('Plugin Custom-Races: ' + msg);
}


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

const customPluginPartyId = 'custom-race';
const customTagId = 'customRaces';
const serverButtonIds = {
    join: 'customraces-j'
};

let onPlayerPressedButton;

/**
 * @type [PluginParty]
 */
let pluginParties = [];

class PluginParty {
    constructor(allPlayingPlayers) {

        if(allPlayingPlayers.length < 2) return;

        this.state = 0;

        this.isStarted = false;
        this.isStopped = false;

        this.totalPlayingPlayers = allPlayingPlayers;

        allPlayingPlayers.forEach(plyr => {
            plyr.setParty(customPluginPartyId);
        });

        this.raceData = null;
        this.vehicleType = null;

        pluginParties.push(this);
    }

    wait(funcToExec, timeToWait) {
        if(typeof funcToExec == 'number' || typeof funcToExec == 'bigint') {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if(this.isStopped || this.state == -2) return;
                    resolve();
                }, funcToExec);
            });
        }
        setTimeout(() => {
            if(this.isStopped || this.state == -2) return;
            funcToExec();
        }, timeToWait);
    }

    waitInEnd(funcToExec, timeToWait) {
        if(typeof funcToExec == 'number' || typeof funcToExec == 'bigint') {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    //if(this.isStopped || this.state == -2) return;
                    resolve();
                }, funcToExec);
            });
        }
        setTimeout(() => {
            //if(this.isStopped || this.state == -2) return;
            funcToExec();
        }, timeToWait);
    }

    async start() {
        if(this.state != 0 || this.isStarted) return;
        
        if(this.totalPlayingPlayers.length < 2) {
            this.end(false);
            return;
        }

        this.state = 1;
        this.isStarted = true;


        // Choosing the race:

        let closestRace1 = {race:null,distance:60};
        let closestRace2 = {race:null,distance:60}; // 60 is the max distance accepted
        let closestRace3 = {race:null,distance:60};
        
        for (let posIndex = 0; posIndex < allRaces.length; posIndex++) {
            let goalPos = allRaces[posIndex];

            if(closestRace1.race == null) {

                closestRace1.distance = this.totalPlayingPlayers[0].distanceWithoutY(goalPos.start[0]);
                
                closestRace1.race = goalPos;
                
                // closestRace2 = goalPos;
                // closestRace3 = goalPos;

            } else {

                let newDistancePos = this.totalPlayingPlayers[0].distanceWithoutY(goalPos.start[0]);

                if(newDistancePos < closestRace1.distance) {
                    
                    // The race 3 is replaced by the race 2
                    Object.assign(closestRace3, closestRace2);

                    // The race 2 is replaced by the race 1
                    Object.assign(closestRace2, closestRace1);
                    
                    // Save the race 1
                    closestRace1.distance = newDistancePos;
                    closestRace1.race = goalPos;
                }
                else if(newDistancePos < closestRace2.distance) {
                    
                    // The race 3 is replaced by the race 2
                    Object.assign(closestRace3, closestRace2);

                    // Save the race 2
                    closestRace2.distance = newDistancePos;
                    closestRace2.race = goalPos;
                }
                else if(newDistancePos < closestRace2.distance) {
                    
                    // Save the race 3
                    closestRace3.distance = newDistancePos;
                    closestRace3.race = goalPos;
                }
            }
        }


        if(closestRace2.race != null && Math.random() > 0.5) {

            if(closestRace3.race != null && Math.random() > 0.4) {
                this.raceData = closestRace3.race;
            } else {
                this.raceData = closestRace2.race;
            }
        } else {
            this.raceData = closestRace1.race;
        }

        // CHOOSING VEHICLE

        let possibleVehicles = this.totalPlayingPlayers.map(plyr => plyr.vehicle);

        this.vehicleType = possibleVehicles[Math.floor(Math.random() * possibleVehicles.length)];

        if((!this.vehicleType) || this.vehicleType < 1) {
            this.vehicleType = [
                1, 2, 15, 17, 18, 19, 20, 21, 22, 24, 25, 26, 27, 30
            ];
            this.vehicleType = this.vehicleType[Math.floor(Math.random() * this.vehicleType.length)];
        }

        this.log('teleporting players..');

        this.totalPlayingPlayers.forEach((plyr, plyrIndex) => {
            plyr.setIsVisible(configParties.isPlayersVisibleInRaces);
            plyr.setTrafficDensity(configParties.trafficDensity);
            // plyr.setCanMove(false); // let the players free for letting them see the goal
            plyr.setGoal(this.raceData.end);
            let startPosToTp = this.raceData.start[ this.raceData.start.length < plyrIndex ? 0 : plyrIndex ];
            plyr.teleport(startPosToTp.x, startPosToTp.y + 0.1, startPosToTp.z, startPosToTp.rot);
        });
        
        // WAIT 15s FOR THAT EVERYONE IS TELEPORTED
        await this.wait(15 * 1000);
        
        this.totalPlayingPlayers.forEach((plyr, plyrIndex) => {
            // plyr.setIsVisible(configParties.isPlayersVisibleInRaces);
            // plyr.setTrafficDensity(configParties.trafficDensity);
            plyr.setCanMove(false);
            let startPosToTp = this.raceData.start[ this.raceData.start.length < plyrIndex ? 0 : plyrIndex ];
            plyr.teleport(startPosToTp.x, startPosToTp.y + 0.1, startPosToTp.z, startPosToTp.rot);
        });
        
        await this.wait(2 * 1000);

        this.log('Everyone teleported');

        this.totalPlayingPlayers.forEach(plyr => {
            if(plyr.vehicle != this.vehicleType) plyr.setVehicle(this.vehicleType, !configParties.canVehiclesBeDestroyed, true);
        });

        await this.wait(3 * 1000);

        this.totalPlayingPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS[3], 1, 1);
        });
        await this.wait(1000);
        this.totalPlayingPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS[2], 1, 1);
        });
        await this.wait(1000);
        this.totalPlayingPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS[1], 1, 1);
        });

        await this.wait(700);
        this.totalPlayingPlayers.forEach(plyr => {
            plyr.setCanMove(true);
        });
        await this.wait(300);
        this.totalPlayingPlayers.forEach(plyr => {
            // TODO IF CRASH AGAIN ITS BECAUSE OF THIS:
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.GO, 3, 1);
            // pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.GO, 2);
        });
        
        this.state = 2;

        let goalEndPos = this.raceData.end;

        let mainIntervalDetection = setInterval(() => {
            if(this.state != 2) {
                if(mainIntervalDetection != null) clearInterval(mainIntervalDetection);
                mainIntervalDetection = null;
                return;
            }

            for (let pIndex = 0; pIndex < this.totalPlayingPlayers.length; pIndex++) {
                
                let plyr = this.totalPlayingPlayers[pIndex];

                if(plyr.distanceTo(goalEndPos) < configParties.distanceToWin) {
                    this.end(true, plyr);
                    break;
                }

                if(
                    plyr.vehicle != this.vehicleType && (!plyr.isDed) && (!plyr.tags[customTagId].editingVehicle)
                    ) {
                    plyr.tags[customTagId].editingVehicle = true;
                    plyr.setVehicle(this.vehicleType, !configParties.canVehiclesBeDestroyed, true);
                    this.waitInEnd(()=>{
                        plyr.tags[customTagId].editingVehicle = false;
                    }, 1400);
                    // break;
                }
                
            }
            
        }, 40);



        await this.wait(()=>{
            
            if(this.state == 2) this.end(false);

        }, (configParties.maxTimeToRace) * 1000);
        
    }


    resetPlayerAttributes(plyr) {
        if(plyr.tags[customTagId] != null) {

            // For the button :
            plyr.tags[customTagId].state = 0;
            plyr.tags[customTagId].canReUseTheButtonNow = false;
            
            function setRButtonName(newButtonName) {
                if(!isPluginEnabled) return;
                pluginAPI.buttonsManager.editButtonOfPlayer(plyr, {
                    id: serverButtonIds.join,
                    name: newButtonName,
                    onclick: onPlayerPressedButton
                });
            }
            
            setRButtonName('Race left.');
            setTimeout(() => {
                if(!(plyr && plyr.connectionState != 0 && plyr.tags[customTagId] != null)) return;
                setRButtonName('Join race');
                plyr.tags[customTagId].canReUseTheButtonNow = true;
            }, 800);
        }

        if(plyr.currentPartyId != customPluginPartyId) return;

        // plyr.resetToDefaultAttributes();
        plyr.setParty('');
        plyr.setGoal(null);
        plyr.setTrafficDensity(pluginAPI.initPlyrAttr.trafficDensity);
        plyr.setIsVisible(true);
        if(!plyr.canMove) plyr.setCanMove(true);
        if(plyr.vehicle != 0) plyr.removeVehicle();
    }

    onPlyrDed(plyr) {
        if(this.state != 2) return;

    }

    onPlayerDisconnected(plyr) {

        let haveEditedList = false;
        this.totalPlayingPlayers = this.totalPlayingPlayers.filter(rPlyr => {
            if(rPlyr != plyr) return true;
            haveEditedList = true;
            return false;
        });

        
        if(haveEditedList == false) return;

        // If player only leaved the party :
        if(plyr.connectionState != 0) {
            this.resetPlayerAttributes(plyr);
        }        

        if(this.state != 2 && this.state != 1) return;
        
        if(this.totalPlayingPlayers.length > 1) return;

        if(this.totalPlayingPlayers.length < 1) {
            this.end(false);
        } else {
            this.end(true, this.totalPlayingPlayers[0]);
        }
    }

    async end(haveWinner, plyrWinner) {

        if(this.isStopped || this.state == -2) return;
        this.state = -2;

        if(!haveWinner) {
            this.stop();
            return;
        }
        
        // await this.waitInEnd(2000);

        this.totalPlayingPlayers.forEach(plyr => {
            if(plyr == plyrWinner) {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.WON, 3);
                plyr.spawnCoins(configParties.coinsGived);
                pluginAPI.soundAPI.playSoundToPlayer( plyr, pluginAPI.soundAPI.WON );
            } else {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.LOST, 3);
            }
        });
        
        await this.waitInEnd(4000);

        this.stop();
    }

    stop() {

        if(this.isStopped) return;

        this.state = -1;

        this.isStopped = true;

        this.totalPlayingPlayers.forEach(plyr => {
            if(plyr.currentPartyId != customPluginPartyId) return;
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.PARTY_IS_END, 3);
            this.resetPlayerAttributes(plyr);
        });

        this.totalPlayingPlayers = [];

        pluginParties = pluginParties.filter(party => party != this);
        this.log('party stopped');
    }

    log(msg) {
        if(configParties.canLogInConsole) logAnyMsg('[Party]: ' + msg);
    }
}


/****************************************
 *       When the game is started       *
 ****************************************/
exports.onStart = async () => {
    gameAPI = exports.modInfos.gameScriptToJSAPI;

    let playersWaitingForARace = [];
    let intervalCreateRaces;

    gameAPI.onlineMod.createServerPlugin({
        name: 'Custom Races',
        onActive: (newPluginAPI) => {

            isPluginEnabled = true;

            pluginAPI = newPluginAPI;
            
            logAnyMsg('Loading config-plugin-racing.txt..');
            (()=>{
                const configPath = require('path').join(__dirname, 'config-plugin-racing.txt');
                const fsForConfig = require('fs');
                
                if(!fsForConfig.existsSync(configPath)) {
                    logAnyMsg('ERROR: There is no config-plugin-racing.txt');
                    showMessage('ERROR: There is no config-plugin-racing.txt');
                    return;
                }

                let pluginConfigData;
                try {
                    pluginConfigData = fsForConfig.readFileSync(configPath, 'utf8');
                    pluginConfigData = pluginConfigData.replace( /(\/\/[^\n\r]*[\n\r]+)/g , '');
                    pluginConfigData = JSON.parse(pluginConfigData);
                    if(typeof pluginConfigData != 'object') throw "ERROR, config-plugin-racing.txt DON'T CONTAIN AN OBJECT. TYPE=" + (typeof pluginConfigData);
                } catch (error) {
                    console.error(error);
                    logAnyMsg('ERROR: config-plugin-racing.txt JSON syntaxe error');
                    showMessage('ERROR: config-plugin-racing.txt JSON syntaxe error');
                    return;
                }

                configParties = pluginConfigData;
                logAnyMsg('config-plugin-racing.txt loaded');
            })();

            pluginAPI.pluginElementAPI.addCustomButton({
                name: 'Stop all races',
                id: 'stop-all-races',
                run: () => {
                    logAnyMsg('Stopping races..');
                    pluginParties.forEach(party => party.stop());
                }
            });
            
            pluginAPI.events.onPlayerDed((plyr) => {
                pluginParties.forEach(party => party.onPlyrDed(plyr));
            });

            pluginAPI.events.onPlayerDisconnected(plyr => {
                pluginParties.forEach(party => party.onPlayerDisconnected(plyr));
            });


            if(intervalCreateRaces != null) {
                clearInterval(intervalCreateRaces);
                intervalCreateRaces = null;
            }

            // Create race when some players are waiting
            intervalCreateRaces = setInterval(() => {
                
                if(playersWaitingForARace.length < configParties.minPlayersInARace) return;

                let playersThatWillRace = [];
                
                playersWaitingForARace.forEach(plyr => {
                    if(plyr.connectionState == 0) return;
                    if(plyr.tags[customTagId].state != 1 || playersThatWillRace.length >= configParties.maxPlayersInARace || (!plyr.canJoinNewParty())) return;
                    plyr.tags[customTagId].state = 2;
                    playersThatWillRace.push(plyr);
                });

                if(playersThatWillRace.length < configParties.minPlayersInARace) return;
                
                playersWaitingForARace = playersWaitingForARace.filter(waitingPlyr => !playersThatWillRace.includes(waitingPlyr));

                new PluginParty(playersThatWillRace).start();
            }, 2250);

            onPlayerPressedButton = (plyr) => {
                if(plyr.connectionState == 0) return;
                if(!plyr.tags[customTagId]) return;
                if(!plyr.tags[customTagId].canReUseTheButtonNow) return;
                plyr.tags[customTagId].canReUseTheButtonNow = false;

                function setPlyrButtonName(newButtonName) {
                    if(!isPluginEnabled) return;
                    pluginAPI.buttonsManager.editButtonOfPlayer(plyr, {
                        id: serverButtonIds.join,
                        name: newButtonName,
                        onclick: onPlayerPressedButton
                    });
                }


                switch (plyr.tags[customTagId].state) {
                    
                    // Search a party:
                    case 0:{
                        if(!plyr.canJoinNewParty()) {
                            setPlyrButtonName('Error: cannot join a race');
                            setTimeout(() => {
                                if(!(plyr && plyr.connectionState != 0 && plyr.tags[customTagId] != null)) return;
                                setPlyrButtonName('Join race');
                                plyr.tags[customTagId].canReUseTheButtonNow = true;
                            }, 3500);
                            break;
                        }
                        plyr.tags[customTagId].state = 1;
                        setPlyrButtonName('Cancel');
                        if(!playersWaitingForARace.includes(plyr)) playersWaitingForARace.push(plyr);
                        plyr.tags[customTagId].canReUseTheButtonNow = true;
                        break;}
                
                    // Cancelling the search 
                    case 1:{
                        playersWaitingForARace = playersWaitingForARace.filter(plyrWaiting => plyrWaiting != plyr);
                        plyr.tags[customTagId].state = 0;
                        setPlyrButtonName('Cancelled.');
                        setTimeout(() => {
                            if(!(plyr && plyr.connectionState != 0 && plyr.tags[customTagId] != null)) return;
                            setPlyrButtonName('Join race');
                            plyr.tags[customTagId].canReUseTheButtonNow = true;
                        }, 750);
                        break;}
                    
                    // Cancelling the race of the player:
                    case 2:{
                        pluginParties.forEach(party => party.onPlayerDisconnected(plyr));
                        break;}

                    default:
                        setPlyrButtonName('Error');
                        plyr.tags[customTagId].canReUseTheButtonNow = true;
                        break;
                }

            }

            let addInitAttrsToPlayer = plyr => {
                
                plyr.tags[customTagId] = {state: 0, canReUseTheButtonNow: true};

                pluginAPI.buttonsManager.addButtonToPlayer(plyr, {
                    id: serverButtonIds.join,
                    name: 'Join race',
                    onclick: onPlayerPressedButton
                });
            };

            pluginAPI.events.onPlayerConnected(addInitAttrsToPlayer);
            pluginAPI.players.forEach(addInitAttrsToPlayer);

            return;

            if(pluginAPI.players.length < 2) {
                showMessage("This mini-game need 2 players or more.");
                return;
            }

            let totalPlayingParty = pluginAPI.players.filter(plyr => plyr.canJoinNewParty());

            if(totalPlayingParty.length < 2) {
                showMessage("Actually there is only " + totalPlayingParty.length + ' players that are not in a party so leave the parties first and restart this plugin.');
                return;
            }

            new PluginParty(totalPlayingParty).start();
            
        },
        
        onDisable: (pluginAPI) => {
            isPluginEnabled = false;
            playersWaitingForARace = [];
            if(intervalCreateRaces != null) {
                clearInterval(intervalCreateRaces);
                intervalCreateRaces = null;
            }
            pluginParties.forEach(party => party.stop());
            pluginAPI.players.forEach(plyr => {
                plyr.tags[customTagId] = undefined;
            });
        }
    });


}