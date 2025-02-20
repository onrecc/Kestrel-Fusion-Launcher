// this is the id used in the custom game script
const modId = 'ultimate_remote';

function convertToNumber(numberstr, maxvalue, minvalue) {
    numberstr = parseFloat(numberstr);
    if( Number.isNaN(numberstr) ) return null;
    if(numberstr > Number.MAX_SAFE_INTEGER) return null;
    if(numberstr < Number.MIN_SAFE_INTEGER) return null;
    if(maxvalue != null && numberstr > maxvalue) return maxvalue;
    if(minvalue != null && numberstr < minvalue) return minvalue;
    return numberstr;
}


exports.loadActions = () => {
    
    let actionsTotal = [];

    let posManagerVars = {};

    actionsTotal.push(
        {
            id: 'player',
            exec: (gameAPI, rtype, ...args) => {

                const playerPos = gameAPI.player.position;

                switch (rtype) {
                    case 'tp':{
                        for (let index = 0; index < 3; index++) {
                            if(!args[index]) args[index] = 0;
                            let argInt = convertToNumber(args[index], 800, -800);
                            if(argInt == null) argInt = 0;
                            args[index] = argInt;
                        }
                        
                        let playerX = playerPos.getX();
                        let playerY = playerPos.getY();
                        let playerZ = playerPos.getZ();

                        if(playerX == null || playerY == null || playerZ == null) break;

                        playerPos.set(playerX + args[0], playerY + args[1], playerZ + args[2]);
                        break;}
                    
                    case 'setvel':{
                        const playerVel = gameAPI.player.velocity;
                        
                        for (let index = 0; index < 3; index++) {
                            if(!args[index]) args[index] = 0;
                            let argInt = convertToNumber(args[index], 500, -500);
                            if(argInt == null) argInt = 0;
                            args[index] = argInt;
                        }
                        
                        let playerX = playerVel.getX();
                        let playerY = playerVel.getY();
                        let playerZ = playerVel.getZ();

                        if(playerX == null || playerY == null || playerZ == null) break;

                        playerVel.set(playerX + args[0], playerY + args[1], playerZ + args[2]);
                        break;}
                    
                    case 'getpos':{
                        let playerX = playerPos.getX();
                        let playerY = playerPos.getY();
                        let playerZ = playerPos.getZ();
                        //console.log('show x: ' + playerX + '\ny: ' + playerY + '\nz: ' + playerZ + '\nrotation: ' + gameAPI.player.rotation.get());
                        return 'show x: ' + playerX + '\ny: ' + playerY + '\nz: ' + playerZ + '\nrotation: ' + gameAPI.player.rotation.get();
                        break;}
                        
                    case 'collisions':
                        gameAPI.sendMessage(modId, 'player', 'collisions');
                        break;
                    
                    case 'anim':
                        gameAPI.sendMessage(modId, 'player', 'lockanim', args[0] || "idle");
                        break;
                        
                    case 'controls':
                        gameAPI.sendMessage(modId, 'player', args[0] == '1' ? 'unlock' : 'lock');
                        break;
                        
                    case 'jump':
                        gameAPI.sendMessage(modId, 'player', 'jump');
                        break;
                    
                    case 'clearv':
                        gameAPI.sendMessage(modId, 'player', 'clearv');
                        break;
                    
                    case 'toogleinterface':{
                        gameAPI.sendMessage(modId, 'player', 'toogleinterface');
                        break;}

                    case 'tooglevisibility':{
                        gameAPI.sendMessage(modId, 'player', 'tooglevisibility');
                        break;}
                       
                    case 'settraffic':{
                        // Note: the user can give numbers like 500 or -156.123 without having to edit the front-end code
                        let newTrafficD = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].find(numberT => numberT + '' == args[0]) || 0;
                        console.log('new density: ' + newTrafficD);
                        gameAPI.sendMessage(modId, 'traffic', newTrafficD);
                        break;}
                    
                    case 'givecoins':{
                        let newStuds = convertToNumber(args[0]);
                        if(!newStuds) break;
                        if(newStuds < 1) break;
                        gameAPI.sendMessage(modId, 'player', 'givecoins', newStuds);
                        break;}
                    
                    case 'posmanager':{
                        switch (args[0]) {
                            case 'save':
                                posManagerVars.lastPos = {
                                    x: playerPos.getX(),
                                    y: playerPos.getY(),
                                    z: playerPos.getZ()
                                };
                                break;
                                
                            case 'undo':
                                let lastPos = posManagerVars.lastPos;
                                if(!lastPos) break;
                                if(!lastPos.x) break;
                                if(!lastPos.y) break;
                                if(!lastPos.z) break;
                                
                                playerPos.set(lastPos.x, lastPos.y, lastPos.z);

                                break;
                        
                            default:
                                break;
                        }
                        break;}
                        
                    case 'test1':{
                        let stringToSend = args[0]+'';
                        if(stringToSend.length > 70) break;
                        gameAPI.sendMessage(modId, 'player', 'test1', stringToSend);
                        break;}
                        
                    case 'test2':{
                        let stringToSend = args[0]+'';
                        if(stringToSend.length > 70) break;
                        gameAPI.sendMessage(modId, 'player', 'test2', stringToSend);
                        break;}

                        
                    case 'testsound':{
                        let stringToSend = args[0]+'';
                        if(stringToSend.length > 70) break;
                        gameAPI.sendMessage(modId, 'player', 'testsound', stringToSend);
                        break;}
                        
                        
                    case 'test3':{
                        let stringToSend = args[0]+'';
                        if(stringToSend.length > 70) break;
                        gameAPI.sendMessage(modId, 'player', 'test3', stringToSend);
                        break;}
                        
                    case 'test4':{
                        let stringToSend = args[0]+'';
                        if(stringToSend.length > 70) break;
                        gameAPI.sendMessage(modId, 'player', 'test4', stringToSend);
                        break;}
                
                    default:
                        break;
                }
            }
        }
    );

    actionsTotal.push(
        {
            id: 'spawn',
            exec: (gameAPI, rtype, charname, chartype, chardistance) => {

                chardistance = convertToNumber(chardistance, 100, -100);
                if(chardistance == null) chardistance = 0;

                if(rtype == 'v') {
                    gameAPI.sendMessage(modId, 'spawnCar', charname, chartype, chardistance);
                } else {
                    gameAPI.sendMessage(modId, 'spawnNPC', charname, chartype, chardistance);
                }
            }
        }
    );
    
    actionsTotal.push(
        {
            id: 'editchar',
            exec: (gameAPI, rtype, ...args) => {

                if(rtype == 'anim') {
                    gameAPI.sendMessage(modId, 'editChar', 'anim', (args[0]+'') || 'talk');
                }
            }
        }
    );

    return actionsTotal;
}