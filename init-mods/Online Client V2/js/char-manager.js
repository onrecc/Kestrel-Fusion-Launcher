let isListLoaded = false;
let charClasses = {};
let totalClasses = [];

function logMsg(message) {
    console.log('[client-char-manager]: ' + message);
}

function loadList(gamePath) {
    isListLoaded = false;
    logMsg('loading chars list..');
    //let disguiseKeyWords = (args[1]+'').toLowerCase().replace(/ /g, '').replace(/\r/g, '').split(',');
    if(!require('fs').existsSync(require('path').join(gamePath,'STUFF/AI/AITYPES.TXT'))) return false;
    let totalList = require('fs').readFileSync(require('path').join(gamePath,'STUFF/AI/AITYPES.TXT'), {encoding:'utf8'}) + '';
    let lastCharClass;
    let numberOfClasses = 0;
    charClasses = {};
    totalClasses = [];
    while (true) {
        let nextIndex = totalList.indexOf('\n');
        if(nextIndex == -1) break;
        let nextLine = (totalList.slice( 0, nextIndex )).replace(/ /g, '').replace(/\t/g, '').replace(/\r/g, '');
        totalList = totalList.slice( nextIndex + 1 );
        if(nextLine && nextLine.startsWith('//') == false) {
            if(nextLine.startsWith('Vehicle.')) {
                lastCharClass = '';
                nextIndex = totalList.indexOf('}');
                if(nextIndex == -1) break;
                totalList = totalList.slice(nextIndex + 1);
            }
            else if(nextLine.startsWith('Character.')) {
                let classId = nextLine.replace('Character.', '').split('"', 1)[0];
                if(!totalClasses.includes(classId)) {
                    numberOfClasses++;
                    totalClasses.push(classId);
                    lastCharClass = [];
                    charClasses[ classId ] = lastCharClass;
                } else {
                    lastCharClass = charClasses[ classId ];
                }
            }
            else if(lastCharClass != null) {
                let charNames = nextLine.split('","', 2);
                if(charNames.length == 2) {
                    charNames[0] = charNames[0].slice(1);
                    charNames[1] = charNames[1].slice(0, -1);
                    lastCharClass.push(charNames);
                }
            }
        }
    }
    isListLoaded = true;
    logMsg('chars list loaded, ' + numberOfClasses + ' classes loaded.');

    exports.loadList = () => {};
}


exports.loadList = loadList;

exports.getClassList = () => totalClasses;

exports.isCustomChar = (charId) => (charId+'').toLowerCase().includes('custom_');

exports.getCharWithName = (charname) => {
    charname = (charname+'').replace(/ /g, '').replace(/\r/g, '').toLowerCase();
    
    for (const classId in charClasses) {
        let charObj = charClasses[classId].find(char => char[0].toLowerCase() == charname);
        if(charObj != null) {
            return {
                name: charObj[0],
                id: charObj[1],
                class: classId
            }
            break;
        }
    }

    return null;
}

exports.getCharWithId = (charid) => {
    
    for (const classId in charClasses) {
        let charObj = charClasses[classId].find(char => char[1] == charid);
        if(charObj != null) {
            return {
                name: charObj[0],
                id: charObj[1],
                class: classId
            }
            break;
        }
    }

    return null;
}


exports.getCharWithKeyWord = (disguiseKeyWords) => {

    disguiseKeyWords = disguiseKeyWords.map(str => str.replace(/ /g, '').toLowerCase());
    
    for (const classId in charClasses) {
        let charObj = charClasses[classId].find(char => {
            
            let charNameL = char[0].toLowerCase();
            
            for (let index = 0; index < disguiseKeyWords.length; index++) {
                if(charNameL.includes(disguiseKeyWords[index]) == false) {
                    return false;
                }
            }
            return true;
        });

        if(charObj != null) {
            return {
                name: charObj[0],
                id: charObj[1],
                class: classId
            }
            break;
        }
    }

    return null;
}