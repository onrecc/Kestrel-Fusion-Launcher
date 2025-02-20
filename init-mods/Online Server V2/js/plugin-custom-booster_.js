const DICTIONNARYLIST = {
    MODES: {
        CLASSIC: 0,
        MULTIPLIER: 1,
        CLASSIC_WITHOUT_Y: 2,
        MULTIPLIER_WITHOUT_Y: 3
    }
};


// EDIT THIS PART FOR THAT WHEN YOU ENABLE THE PLUGIN THE PLAYER HAVE THESE STATS
let playersStats = {
    power: 1.5,
    rlTime: 2000, // For 2s
    boostsByReloads: 8, // Number of boosts gived when the player reloaded the boosts, the minimum is 1 and the maximum is 50000
    
    enabled: true,

    mode: DICTIONNARYLIST.MODES.MULTIPLIER,
    canUseCustom: false, // On "true" the players can edit their stats
};

// Note: if the plugin is disabled nobody can use the custom booster in your server with the original mod




let gameAPI;


function logAnyMsg(msg) {
    console.log('[plugin:custom-booster]:', msg);
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

const pluginChannelId = 'custombooster';



/****************************************
 *       When the game is started       *
 ****************************************/
exports.onStart = async () => {
    gameAPI = exports.modInfos.gameScriptToJSAPI;
    

    gameAPI.onlineMod.createServerPlugin({
        name: 'Custom Booster',
        onActive: (pluginAPI) => {
            
            pluginAPI.events.onPlayerConnected((plyr) => {
                
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'M ' + playersStats.mode);
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'P ' + playersStats.power);
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'T ' + playersStats.rlTime);
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'E ' + (playersStats.enabled ? 1 : 0));
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'B ' + playersStats.boostsByReloads);
                
                // IMPORTANT, MUST BE THE LAST MESSAGE:
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'C ' + (playersStats.canUseCustom ? 1 : 0));
                
            });
            
            pluginAPI.players.forEach(plyr => {
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'M ' + playersStats.mode);
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'P ' + playersStats.power);
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'T ' + playersStats.rlTime);
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'E ' + (playersStats.enabled ? 1 : 0));
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'B ' + playersStats.boostsByReloads);
                
                // IMPORTANT, MUST BE THE LAST MESSAGE:
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'C ' + (playersStats.canUseCustom ? 1 : 0));
            });
        },
        
        onDisable: (pluginAPI) => {
            pluginAPI.players.forEach(plyr => {
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'E 0');
                pluginAPI.sendCustomMessage(plyr, pluginChannelId, 'C 0');
            });
        }
    });


}