
let configParties = {
    timeToHide: 45, // Let 45s to the runners to be hidden
    timeToHunt: 5 * 60, // Let 5 minutes to the hunters to hunt
    
    hunterAttackRange: 0.8,
    hunterAttackRangeOnVehicles: 1.8,
    damageOnRunnersVehicles: 2,

    runnersSpeed: 2.2,
    huntersSpeed: 3,
    
    canLogInConsole: true
};

const startPositions = [

    {
        x: -181.3274384,
        y: 1.244710207,
        z: -17.70763969
    },
    {
        x: -93.06044006,
        y: 18.17063141,
        z: -194.0016174
    },
    {
        x: -204.3252258,
        y: 10.74843597,
        z: -91.76707458
    },



    {
        x: 68.43013763,
        y: 2.24249053,
        z: 10.8716259
    },
    {
        x: 83.2653656,
        y: 3.250453949,
        z: 43.74817276
    },
    {
        x: -253.6222382,
        y: 9.03164196,
        z: 273.1995239
    },
    {
        x: 244.9623718,
        y: 9.963,
        z: 143.5636
    },
    {
        x:  264.9617615,
        y: 2.912429094,
        z: 28.69444084
    },
    {
        x: 247.7401581,
        y: 6.806455135,
        z: 156.4425049
    },
    {
        x: 161.4382019,
        y: 1.846759081,
        z: 268.2208862
    },
    {
        x: 27.26073265,
        y: 2.611015797,
        z: 260.7025146
    },
    {
        x: 66.66268158,
        y: 2.296512365,
        z: 193.7849579
    },
    {
        x: -176.9912415,
        y: 13.27281857,
        z: 359.4463501
    },
    {
        x: -227.7219543,
        y: 8.412146568,
        z: 247.2592773
    },
    {
        x: -235.0300293,
        y: 8.924141884,
        z: 58.77086258
    },
    {
        x: -188.4042816,
        y: 1.247903824,
        z: 20.43675423
    },
    {
        x: -116.6808701,
        y: 3.562484026,
        z: 214.3553467
    }
];


let gameAPI;
let pluginAPI;

function logAnyMsg(msg) {
    console.log('[server-plugin:HunterVSRunners]', msg);
}

function showMessage(msg) {
    gameAPI.interface.showMessage('Plugin HunterVSRunners: ' + msg);
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

const customPluginPartyId = 'hunterVSrunners';
const customTagId = 'hVSr';

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
            plyr.tags[customTagId] = {};
            plyr.setParty(customPluginPartyId);
        });

        this.numberOfHunter = 1;

        if(allPlayingPlayers.length > 3) {
            this.numberOfHunter = 2;

            if(allPlayingPlayers.length > 6) {
                this.numberOfHunter = 3;

                if(allPlayingPlayers.length > 9) {
                    this.numberOfHunter = 4;
                }
            }
        }

        this.hunterPlayers = [];

        while (this.hunterPlayers.length < this.numberOfHunter) {
            let nextPlyrs = allPlayingPlayers.filter(plyr => !this.hunterPlayers.includes(plyr));
            nextPlyrs = nextPlyrs[Math.floor(Math.random() * nextPlyrs.length)];
            if(!nextPlyrs) {
                logAnyMsg('Err, weird bug when choosing the hunters');
                break;
            }
            this.hunterPlayers.push(nextPlyrs);
        }

        this.runnerPlayers = allPlayingPlayers.filter(plyr => {
            if(this.hunterPlayers.includes(plyr)) return false;
            plyr.tags[customTagId].hp = 1;
            return true;
        });

        this.numberOfRunners = this.runnerPlayers.length;

        this.log('Hunters: ' + this.hunterPlayers.length);
        this.log('Runners: ' + this.runnerPlayers.length);

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

    async start() {
        if(this.state != 0 || this.isStarted || this.totalPlayingPlayers.length == 0) return;
        this.state = 1;
        this.isStarted = true;


        let closestStartPos;
        let distanceOfLastPos;
        
        for (let posIndex = 0; posIndex < startPositions.length; posIndex++) {
            let startPos = startPositions[posIndex];

            if(closestStartPos == null) {
                distanceOfLastPos = this.totalPlayingPlayers[0].distanceWithoutY(startPos);
                closestStartPos = startPos;
            } else {
                let newDistancePos = this.totalPlayingPlayers[0].distanceWithoutY(startPos);
                if(newDistancePos < distanceOfLastPos) {
                    distanceOfLastPos = newDistancePos;
                    closestStartPos = startPos;
                }
            }
        }

        this.log('start pos choosed: ' + closestStartPos);

        this.log('teleporting players..');

        this.runnerPlayers.forEach(plyr=>{
            plyr.setCanMove(false);
            if(plyr.vehicle != 0) plyr.removeVehicle();
            plyr.teleport(closestStartPos.x, closestStartPos.y + 0.1, closestStartPos.z);
        });

        this.hunterPlayers.forEach((plyr, plyrIndex) => {
            plyr.setCanMove(false);
            if(plyr.vehicle != 0) plyr.removeVehicle();
            plyr.teleport(closestStartPos.x - (plyrIndex * 0.5), closestStartPos.y + 0.1, closestStartPos.z);
        });
        
        // WAIT 15s FOR THAT EVERYONE IS TELEPORTED
        await this.wait(15 * 1000);

        this.log('Everyone teleported');

        this.hunterPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.JOINED_TEAM_2, 5);
            plyr.setCanMove(false, 'RockingChair_Idle');
        });

        this.runnerPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.JOINED_TEAM_1, 3);
            plyr.setIsVisible(false);
            plyr.setIsVisibleOnMap(false);
        });

        this.wait(()=>{
            
            this.hunterPlayers.forEach(plyr => {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.TEAM_1_IS_FREE, 4);
            });
            
            this.runnerPlayers.forEach(plyr => {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.GO, 2);
                plyr.setCanMove(true);
                plyr.setSpeed(configParties.runnersSpeed);
            });
        }, 2500);

        
        
        await this.wait((configParties.timeToHide - 4) * 1000);


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
        await this.wait(2000);

        this.totalPlayingPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.TEAM_2_IS_FREE, 5);
        });
        
        this.hunterPlayers.forEach(plyr => {
            plyr.setCanMove(true);
            plyr.setSpeed(configParties.huntersSpeed);
        });
        this.runnerPlayers.forEach(plyr => {
            plyr.setIsVisible(true);
        });
        
        this.state = 2;

        let mainIntervalDetection = setInterval(() => {
            if(this.state != 2 || this.isStopped) {
                if(mainIntervalDetection != null) clearInterval(mainIntervalDetection);
                mainIntervalDetection = null;
                return;
            }

            this.runnerPlayers.forEach(runnerPlyr => {
                
                if((!runnerPlyr.tags[customTagId]) || (!runnerPlyr.tags[customTagId].hp)) return;

                for (let hIndex = 0; hIndex < this.hunterPlayers.length; hIndex++) {
                    
                    if(runnerPlyr.vehicle == 0) {
                        if((this.hunterPlayers[hIndex].distanceTo(runnerPlyr) < configParties.hunterAttackRange)) {
                            this.onPlyrDed(runnerPlyr);
                            runnerPlyr.kill();
                            break;
                        }
                    } else if(this.hunterPlayers[hIndex].distanceTo(runnerPlyr) < configParties.hunterAttackRangeOnVehicles) {
                        runnerPlyr.applyDamage(configParties.damageOnRunnersVehicles);
                        break;
                    }
                    
                }
                
            });
        }, 40);



        await this.wait(((configParties.timeToHunt - 4) * 1000) / 2);

        // AFTER SOME MINUTES THE RUNNERS ARE VISIBLE ON THE MAP
        this.runnerPlayers.forEach(plyr => {
            plyr.setIsVisibleOnMap(true);
        });
        this.totalPlayingPlayers.forEach(plyr => {
            pluginAPI.soundAPI.playSoundToPlayer(plyr, pluginAPI.soundAPI.CHANGE_CHAR);
        });
        
        await this.wait(((configParties.timeToHunt - 4) * 1000) / 2);
        if(this.state != 2) return;

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
        await this.wait(2000);

        if(this.state == 2) this.end(false);
    }

    onPlyrDed(plyr) {
        if(this.state != 2) return;

        // if(!this.totalPlayingPlayers.includes(player)) return;

        if(!this.runnerPlayers.includes(plyr)) return;

        if((!plyr.tags[customTagId]) || (!plyr.tags[customTagId].hp)) return;
        plyr.tags[customTagId].hp--;
        
        // this.runnerPlayers = this.runnerPlayers.filter(plyr => plyr != player);
        this.numberOfRunners--;

        if(this.numberOfRunners <= 0) {
            this.end(true);
            return;
        }
        
        if(plyr.connectionState != 0) {
            plyr.setIsVisible(false);
        }
        this.totalPlayingPlayers.forEach(plyr => {
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.TEAM_2_WON_A_POINT, 3);
        });

        this.hunterPlayers.forEach(plyr => {
            pluginAPI.soundAPI.playSoundToPlayer(plyr, pluginAPI.soundAPI.WON_SOMETHING);
        });

    }

    async end(isHuntersWon) {
        
        if(this.isStopped || this.state == -2) return;

        this.state = -2;
        
        await this.wait(2000);

        this.runnerPlayers.forEach(plyr => {
            if(plyr.connectionState == 0) return;
            if(isHuntersWon) {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.LOST, 3);
            } else {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.WON, 3);
                pluginAPI.soundAPI.playSoundToPlayer(plyr, pluginAPI.soundAPI.WON);
            }
        });
        
        this.hunterPlayers.forEach(plyr => {
            if(plyr.connectionState == 0) return;
            if(isHuntersWon) {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.WON, 3);
                pluginAPI.soundAPI.playSoundToPlayer(plyr, pluginAPI.soundAPI.WON);
            } else {
                pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.LOST, 3);
            }
        });
        
        await this.wait(4000);

        this.stop();
    }

    stop() {

        if(this.isStopped) return;

        this.state = -1;

        this.isStopped = true;

        this.totalPlayingPlayers.forEach(plyr => {
            if(plyr.connectionState == 0 || plyr.currentPartyId != customPluginPartyId) return;
            pluginAPI.showTextWithTextId(plyr, pluginAPI.TEXTALLOWEDS.PARTY_IS_END, 3);

            plyr.tags[customTagId] = undefined;
            plyr.resetToDefaultAttributes();
            plyr.setParty('');
        });

        this.totalPlayingPlayers = [];

        this.hunterPlayers = [];
        this.runnerPlayers = [];

        pluginParties = pluginParties.filter(party => party != this);
        this.log('party stopped');
    }

    log(msg) {
        if(configParties.canLogInConsole) logAnyMsg('[Party]:', msg);
    }
}



/****************************************
 *       When the game is started       *
 ****************************************/
exports.onStart = async () => {
    gameAPI = exports.modInfos.gameScriptToJSAPI;

    gameAPI.onlineMod.createServerPlugin({
        name: 'Hunter VS Runners',
        onActive: (newPluginAPI) => {

            pluginAPI = newPluginAPI;
            
            //TODO DETECTER SI PARTY EN COUR MAIS NORMALEMENT QUAND DISABLED ELLE S'AUTO REMOVE DEJA

            // pluginAPI.events.onPlayerConnected((plyr) => {
                
            // });
            
            pluginAPI.events.onPlayerDed((plyr) => {
                pluginParties.forEach(party => party.onPlyrDed(plyr));
            });
            
            pluginAPI.events.onPlayerDisconnected((plyr) => {
                pluginParties.forEach(party => party.onPlyrDed(plyr));
            });

            if(pluginAPI.players.length < 2) {
                showMessage("This mini-game need 2 players or more.");
                return;
            }

            let totalPlayingParty = pluginAPI.players.filter(plyr => plyr.isFakePlayer == false && plyr.canJoinNewParty());

            if(totalPlayingParty.length < 2) {
                showMessage("Actually there is only " + totalPlayingParty.length + ' players that are not in a party so leave the parties first and restart this plugin.');
                return;
            }

            new PluginParty(totalPlayingParty).start();
            
        },
        
        onDisable: (pluginAPI) => {
            pluginParties.forEach(party => party.stop());
        }
    });


}