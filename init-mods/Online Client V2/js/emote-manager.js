const shortcutStartId = 'emote-';

let gameAPI, clientSave, sendToGameAPI, modName;

exports.setVars = (newGameAPI, newClientSave, newSendToGameAPI, newModeName) => { gameAPI = newGameAPI; clientSave = newClientSave; sendToGameAPI = newSendToGameAPI; modName = newModeName };

let canToogleWOnK = true;

function logClientMsg(txttolog) {
    console.log('[client-emote-manager]: '+ txttolog);
}

exports.displayEmotes = [];

exports.loadEmotes = () => {

    require('./emotes.json').forEach((emote, emoteIndex) => {

        exports.displayEmotes.push({
            name: emote.name,
            shortcut: 'Numpad' + emoteIndex
        });

        emote.generatedId = emote.name.toLowerCase().replace(/ /g, '');

        gameAPI.keyboard.onInput(modName, shortcutStartId + emote.generatedId, [clientSave.shortcuts.emotes, 'NUMPAD ' + emoteIndex],
            
            (ev) => {
                
                if(ev.state != 'DOWN' || canToogleWOnK == false) return;
                
                if(gameAPI.interface.isAppHidden()) {
                    canToogleWOnK = false;
                    let emoteIdToPlay = emote.id;
                    if(typeof emoteIdToPlay != "string") emoteIdToPlay = emoteIdToPlay[Math.floor(Math.random() * emoteIdToPlay.length)];
                    if(emote.autostop) {
                        sendToGameAPI('ANIM', emoteIdToPlay, 1, 1);
                    } else {
                        sendToGameAPI('ANIM', emoteIdToPlay, -1, 0);
                    }
                    logClientMsg('PLAYING EMOTE: ' + emoteIdToPlay);
                    setTimeout(() => {
                        canToogleWOnK = true;
                    }, 500);
                    return;
                }
            }
        );
    });
}

exports.reloadKeys = () => {

    require('./emotes.json').forEach((emote, emoteIndex) => {

        emote.generatedId = emote.name.toLowerCase().replace(/ /g, '');

        let haveEditedEmote = gameAPI.keyboard.editEventKeyId(
            modName,
            shortcutStartId + emote.generatedId,
            [clientSave.shortcuts.emotes, 'NUMPAD ' + emoteIndex]
        );

        if(haveEditedEmote) return;

        logClientMsg('Error while trying to edit the shortcut emote "' + emote.name + '"');
    });
}