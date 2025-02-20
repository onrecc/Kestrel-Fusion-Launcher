const sleep = (time) => new Promise((resolve) => {
    setTimeout(() => {
        resolve();
    }, time);
});

const logMessage = msg => console.log('[Ultimate-Remote] : ' + msg);

const portUsed = 4837;
const codeLength = 7;



exports.onStart = async () => {

    logMessage('loading custom actions..');
    
    // To get the communication API :
    const gameAPI = exports.modInfos.gameScriptToJSAPI;

    let customActions = require('./custom-actions/custom-actions').loadActions();

    logMessage('custom actions loaded');

    let express;
    let app;
    let server;
    let wsServer;

    let isURemoteAccepted = () => true;
    gameAPI.onlineMod.createClientPlugin({
        name: 'ultimate-remote',
        onEnable: (pluginAPI) => {
            isURemoteAccepted = () => pluginAPI.isCheatModsAccepted();
        },
        onDisable: (pluginAPI) => {
            isURemoteAccepted = () => true;
        }
    });

    try {

        express = require('./express-js/node_modules/express/index');

        app = express();

        // // Using express-ws :
        // require('./express-js/node_modules/express-ws/index')(app);

        const WebSocket = require('./express-js/node_modules/ws/index');

        wsServer = new WebSocket.Server({ noServer: true });

        app.use('/front', express.static(require('path').join(__dirname, 'front')));

        app.get('/', (req, res) => {
            res.sendFile(require('path').join(__dirname, 'front/index.html'));
        });

        await new Promise((resolve) => {
            server = app.listen(portUsed, (ev) => {
                logMessage('Server openned at the port ' + portUsed);
                resolve();
            });
        });

        server.on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
            });
        });
        
    } catch (error) {
        console.error(error);

        try {
            
            const showMessage = exports.modInfos.showMessage;

            showMessage('Error : cannot create server for the remote');
        } catch (error) {
            console.error(error);
        }
    }

    // this is the id used in the custom game script
    const modId = 'ultimate_remote';

    // Get the function for show messages in the launcher
    const showMessage = exports.modInfos.showMessage;

    // Generate the secret code :
    let secretCode = '';
    
    const codeChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    while (secretCode.length < codeLength) {
        secretCode += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
    }

    console.log('code : ' + secretCode);

    let isVerifyingCode = false;

    async function verifyIfCodeWorks(codegived) {

        while (isVerifyingCode) {
            await sleep(350);
        };
        isVerifyingCode = true;

        await sleep(5000);

        isVerifyingCode = false;

        return secretCode === codegived + '';
    }

    // **********************************************************************************
    // *********************** Manage the websocket connections : ***********************
    // **********************************************************************************

    //app.ws('/', function(ws, req) {
    wsServer.on('connection', ws => {

        // 0 = connection started, 1 = entered code and wait for map loaded, 2 = totally connected
        let connectionState = 0;

        let isCheckingCode = false;
        
        ws.on('error', console.error);

        ws.on('message', (msg) => {

            if(!msg.toString) return;
            msg = msg.toString('utf8');

            switch (connectionState) {

                // When totally connected
                case 2:
                    
                    switch (msg.split(' ', 1)[0]) {
                        case "do":

                            if(!isURemoteAccepted()) break;

                            const actionId = msg.split(' ', 2)[1];
                            
                            let actionObj = customActions.find(action => action.id == actionId);
                            if(actionObj == null) break;
                            
                            const msgArgs = msg.replace('do ' + actionId, '').replace(' ', '').split(' ');

                            let actionRes = actionObj.exec(gameAPI, ...msgArgs);

                            if(typeof actionRes != 'string') break;

                            ws.send(actionRes);

                            break;
                    
                        default:
                            break;
                    }

                    break;

                // When waiting for JS connection
                case 1:
                    //
                    break;
                
                // When user enter the code :
                case 0:
                    if(isCheckingCode) break;
                    isCheckingCode = true;
                    verifyIfCodeWorks(msg).then(
                        (isCodeCorrect) => {
                        
                            if(isCodeCorrect) {
                                isCheckingCode = true;

                                function sendStateByI() {
                                    ws.send('state ' + connectionState);
                                }

                                gameAPI.onConnected(()=>{
                                    isCheckingCode = false;
                                    connectionState = 2;
                                    sendStateByI();
                                });
                                
                                gameAPI.onDisconnected((ev)=>{
                                    
                                    isCheckingCode = false;
                                    connectionState = 1;
                                    if(ev.cannotRestart) {
                                        // ws.close();
                                        return;
                                    }
                                    sendStateByI();
                                });
                            } else {
                                ws.send('0');
                                isCheckingCode = false;
                            }
                        }
                    );
                    break;
            
                default:
                    break;
            }
        });
    });

    await sleep(2500);

    let remoteURL = '';
    try {
        
        if(process.platform != 'win32') throw "";

        // Find and show to the user the ip for using the remote :
        let responseCmd = require('child_process').execSync('ipconfig').toString('utf8');

        responseCmd = responseCmd.replace(/\r/g, '');

        responseCmd = responseCmd.slice( responseCmd.indexOf('IPv4') );
        responseCmd = responseCmd.slice( 0, responseCmd.indexOf('\n') );

        let resCmdSplited = responseCmd.split(' ');

        responseCmd = resCmdSplited[resCmdSplited.length-1];

        if(responseCmd.split('.').length < 3) throw "";

        remoteURL = responseCmd.replace(/ /g, '') + ':' + portUsed;

    } catch (error) {
        logMessage('cannot get remote ip');

        remoteURL = 'localhost:' + portUsed;
    }

    showMessage('To use the remote go to ' + remoteURL + ' and enter this code : ' + secretCode);
    
    // When connection stopped
    gameAPI.onDisconnected(async(ev)=>{

        if(ev.cannotRestart && server) server.close();
    });

}