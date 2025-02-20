const fs = require('fs');
const path = require('path');
const config = require('../config-manager');
const backupManager = require('../backup-manager');
const modManager = require('../mod-manager');
const cpjEditor = require('./cpj-editor');
const globalVars = require('../global-variables');
require('./ipc-char-editor'); // <-- Communication between node process and window process


const charListId = 'KF';
// const customCharsDirPath = path.join(config['game-location'], '/CHARS/MINIFIGS/', charListId);


// IF THE INIT FILES AREN'T BACKUPED, BACKUP IT
backupManager.backupFile('CHARS/COLLECTION.TXT');
backupManager.backupFile('STUFF/AI/AITYPES.TXT');
backupManager.backupFile('CHARS/LEG' + 'OCITY_GENERIC.CPJ');
// backupManager.backupFile('CHARS/MINIFIGS/CIVILIAN/CIVILIAN_CHAS'+'EMC'+'CAIN/CIVILIAN_CHAS'+'EMC'+'CAIN.CD');
// backupManager.backupFile('CHARS/MINIFIGS/CIVILIAN/CIVILIAN_CHAS'+'EMC'+'CAIN/CIVILIAN_CHAS'+'EMC'+'CAIN.TXT');
backupManager.backupFile(`CHARS/MINIFIGS/COP/COP_DOORLOCKHOMES/COP_DOORLOCKHOMES.CD`);
backupManager.backupFile('CHARS/MINIFIGS/COLLECT/COLLECT_1-06_SKATER/COLLECT_1-06_SKATER.TXT');

cpjEditor.customCharacterCategorieId = charListId;
//cpjEditor.customCharacterCategorieId = 'Cop';

let addedCharList = [];




const characterClasses = {
    
    GENERIC: {
        id: 'generic',
        cat: 0,
        fileid: 'Police'
    },
    COP: {
        id: 'cop',
        cat: 1,
        fileid: 'Police'
    },
    ROBBER: {
        id: 'robber',
        cat: 2,
        fileid: 'Police'
    },
    MINER: {
        id: 'miner',
        cat: 3,
        fileid: 'Police'
    },
    ASTRONAUT: {
        id: 'astronaut',
        cat: 4,
        fileid: 'Space'
    },
    FARMER: {
        id: 'farmer',
        cat: 5,
        fileid: 'Farmer'
    },
    FIREMAN: {
        id: 'fireman',
        cat: 6,
        fileid: 'Police'
    },
    WORKER: {
        id: 'construction',
        cat: 7,
        fileid: 'Construction'
    },
    SPECIAL1: {
        id: 'special01',
        cat: 8,
        fileid: 'Police'
    },
    SPECIAL2: {
        id: 'special02',
        cat: 9,
        fileid: 'Police'
    },
    CIVILIAN_SERVICE: {
        id: 'service',
        cat: 10,
        fileid: 'Police'
    }
}

const initCharacterProps = {

    hat_layer_index: 4,

    tiptoe_speed: 0.256,
    walk_speed: 0.6,
    run_speed: 1.4,
    sprint_speed: 2.0,
    
    jump_speed: 2.182,

    radius: 0.1,
    miny: 0,
    maxy: 0.42,

    air_gravity: -6.25
}

/**
 * 
 * @param {CustomCharacter} initobj 
 * @returns CustomCharacter
 */
function toValidCustomCharObject(initobj) {
    return initobj;
}


class CustomCharacter {
    constructor(props) {

        this.id = 'ID' + Math.floor(Math.random() * 8) + Math.floor(Math.random() * 8) + Math.floor(Math.random() * 8);
        this.name = 'Name';
        this.cheatcode = null;
        // this.class = characterClasses.COP;
        this.class = characterClasses.GENERIC;
        this.otherClasses = [];
        this.hasChicken = false;
        this.addedToCustomer = false;
        this.price = 10000;

        // Game Attributs :
        this.props = {...initCharacterProps};

        if(props) {
            for (const key in props) {
                if (Object.hasOwnProperty.call(props, key)) {
                    this.props[key] = props[key];
                }
            }
        }
    }

    // setVar(varname, varvalue) {
    //     this[varname] = varvalue;
    //     return this;
    // }
}



function toCamecaseString(initstring, separator) {
    initstring = initstring.toLowerCase();

    if(!separator) return initstring.replace(initstring[0], initstring[0].toUpperCase());

    let strArr = initstring.split(separator);

    initstring = '';

    strArr.forEach(
        word => initstring += separator + word[0].toUpperCase() + word.slice(1)
    );
    
    if(initstring[0] == separator) initstring = initstring.replace(separator, '');

    return initstring;
}



// Add character to the lists game files
function addCharacter(customchar, canshowinfo) {

    customchar = toValidCustomCharObject(customchar);

    if(addedCharList.find( char => char.id == customchar.id ) != null) {
        return;
    }

    addedCharList.push( customchar );

    updateCharsListFile(canshowinfo);
}


// Remove custom character from the lists game files
function removeCharacter(charid) {

    addedCharList = addedCharList.filter(char => char.id != charid);

    updateCharsListFile();
}


function updateCharsListFile(canshowinfo) {

    // *** Editing the .cpj list : ***
    
    let {finallyAddedChars: addedCharsInCPJ, totalCharactersSlotUnused} = cpjEditor.generateNewFile( addedCharList );


    // *** Editing the collection.txt : ***

    // This is the text added to the characters list
    let addedText = `
; -------------------------------------------------------;
; ${globalVars.app.getName()}
; -------------------------------------------------------;
`;

    if(addedCharsInCPJ.length > 0) addedText += '\n; Characters generated :\n';

    addedCharsInCPJ.forEach(
        customchar => {
            addedText += `\ncollect ${toCamecaseString(customchar.id)}    token  ${customchar.price > 0 ? 'buy_in_shop      ' + customchar.price : ''}   cat ${customchar.class.cat}     ${customchar.addedToCustomer ? 'customiser_parts' : ''}                                         ${customchar.cheatcode == null ? '' : 'cheat_code ' + customchar.cheatcode}`;

            if(customchar.otherClasses) {
                customchar.otherClasses.forEach(
                    otherClassCharCat => {
                        if(customchar.class.cat == otherClassCharCat) return;
                        
                        addedText += `\ncollect ${toCamecaseString(customchar.id)}    token  ${customchar.price > 0 ? 'buy_in_shop      ' + customchar.price : ''}   cat ${otherClassCharCat}     ${customchar.addedToCustomer ? 'customiser_parts' : ''}                                         ${customchar.cheatcode == null ? '' : 'cheat_code ' + customchar.cheatcode}`;
                    }
                );
            }
            
            console.log(`"${customchar.id}" added in the collection.txt`);
        }
    );

    
    // Load the custom text in the "collection" mods folders

    let textsReplacers = [];

    let firstNewLines = '';

    let vehiclesCatLines = '';

    let haveAddedTextWithCFolder = false;

    modManager.getModsLoaded().forEach(
        mod => {
            if(!mod.addons.collection) return;

            if(!config['activated-mods'].includes(mod.name)) return;

            const collectionLinesPath = path.join(modManager.modsFolder, mod.name, 'collection');

            if(!haveAddedTextWithCFolder) {
                addedText += '\n\n;Added with the "collection" folder:\n';
                haveAddedTextWithCFolder = true;
            }

            fs.readdirSync(collectionLinesPath).forEach(
                collectionLineFile => {

                    if(path.extname(collectionLineFile).toLowerCase() != '.txt') return;


                    const charJSONPath = path.join(collectionLinesPath, collectionLineFile);

                    fs.readFileSync(charJSONPath, {encoding: 'utf8'}).split('\n').forEach(
                        line => {

                            if(!line) return;
                            if(line.replace(/[^a-zA-Z0-9/]/g, '').startsWith('//')) return;

                            if( line.startsWith('>') ) {

                                textsReplacers.push({
                                    r: line.slice(1, line.indexOf('=')),
                                    v: line.slice(line.indexOf('=') + 1)
                                });
                            } else if(line.startsWith('!')) {
                                firstNewLines += line.slice(1) + '\n';
                            } else if(line.startsWith('vehiclecat')) {
                                vehiclesCatLines += line + '\n';
                            } else {
                                addedText += '\n' + line;
                            }
                    });
                }
            );

        }
    );

    // Modify initial file :
    backupManager.loadBackupFile('CHARS/COLLECTION.TXT', (initfiledata) => {
        
        let newTextList = initfiledata.toString('utf8') + addedText;

        if(vehiclesCatLines) {
            vehiclesCatLines = '\n; Custom mods vehicle categories :\n' + vehiclesCatLines;
            let vehicleCatsDefIndex = newTextList.indexOf('iclecate');
            vehicleCatsDefIndex += 8 + 4 + 642;
            newTextList = newTextList.slice(0, vehicleCatsDefIndex) + vehiclesCatLines + newTextList.slice(vehicleCatsDefIndex);
        }

        newTextList = firstNewLines + newTextList;

        if(textsReplacers.length != 0) {
            newTextList.split('\n').forEach(
                line => {

                    let lineReplacer = textsReplacers.find(t => line.startsWith(t.r));

                    if(!lineReplacer) return;

                    newTextList = newTextList.replace(line, lineReplacer.v);
                }
            );
        }

        return newTextList;
    }, {
        new: {encoding: 'utf8'},
        init: {encoding: 'utf8'}
    });


    if(canshowinfo) {
    
        // If there are characters that can't be added alert the user
        if(addedCharList.length != addedCharsInCPJ.length) {
            globalVars.mainWindow.webContents.send('alert', "Problem :\nThere are characters that haven't be added to the list.\nThat can be because you added to much characters or a character ID are to much long.\nTo fixe this problem try to remove characters by disable mods.");
        } else {
            globalVars.mainWindow.webContents.send('alert',
            "Characters updated, you now have " + totalCharactersSlotUnused + " places left to add new characters.\n" +
            "*IMPORTANT :*\nIf you add characters and you launch a save, your save can only be re-launched with the characters you added before, so make a backup of your save before launch the game."
            , true
            );
        }
    }

}



function openCharEditorWindow() {
    
    // function sendJSCode(codetoinject) {
    //     globalVars.mainWindow.webContents.executeJavaScript(codetoinject);
    // }

    const editorWindow = globalVars.createWindow(
        require('../window-types.json').CHAR_EDITOR,
        'character-builder/preload.js',
        true
    );
    
    editorWindow.webContents.on('dom-ready', () => {
        
        editorWindow.webContents.send('initCharClass', new CustomCharacter(), characterClasses);

    });
}




function loadAllCharacters() {

    addedCharList = [];
    
    modManager.getModsLoaded().forEach(
        mod => {
            if(!mod.addons.chars) return;

            if(!config['activated-mods'].includes(mod.name)) return;

            const charsMPath = path.join(modManager.modsFolder, mod.name, 'chars');

            fs.readdirSync(charsMPath).forEach(
                charfolder => {

                    const charJSONPath = path.join(charsMPath, charfolder, 'char.json');

                    if(fs.existsSync(charJSONPath)) {
                        addedCharList.push(JSON.parse(
                            fs.readFileSync(charJSONPath, {encoding: 'utf8'})
                        ));
                    }
                }
            );

        }
    );


    // Remove characters with the same id :
    const listDupliIds = [];
    addedCharList = addedCharList.filter((char) => {
        
        if(listDupliIds.includes(char.id)) return false;
        
        listDupliIds.push(char.id);
        return true;
    });

}


loadAllCharacters();


exports.updateCharsListFile = updateCharsListFile;

exports.CustomCharacter = CustomCharacter;
//exports.initCustomCharactersFiles = initCustomCharactersFiles;
exports.addCharacter = addCharacter;
exports.removeCharacter = removeCharacter;
exports.characterClasses = characterClasses;
exports.openCharEditorWindow = openCharEditorWindow;
exports.charFolderId = charListId;