const loginContainer = document.querySelector('#login-container');
const controlPanel = document.querySelector('#control-panel');
 const panelButtonsContainer = document.querySelector('#buttons-container');


showStateMessage('Connection..');
let clientSocket = new WebSocket(location.href.replace('http', 'ws'));
let connectionState = 0;
let lastTryCode = '';

clientSocket.onopen = () => {
    showStateMessage('');
    console.log('socket openned');
    document.querySelector('#code-input').focus();
}
clientSocket.onclose = ev => {
    console.log(ev);
    showStateMessage('You are disconnected, reload the page to be connected');
}

async function onNewState(newstate) {
    connectionState = newstate;

    switch (connectionState) {

        case 2:
            
            loginContainer.style.display = 'none';
            showStateMessage('');
            clientSocket.onmessage = onMessageWhenConnected;

            controlPanel.style.display = '';
            loadButtons();
            break;

        case 1:
            
            controlPanel.style.display = 'none';
            loginContainer.style.display = 'none';
            showStateMessage('waiting for map loaded..');
            clientSocket.onmessage = onMessageWhenConnected;
            break;

        case 0:
            controlPanel.style.display = 'none';
            showStateMessage('');
            loginContainer.style.display = '';
            clientSocket.onmessage = onMessageAtLogin;
            break;
    
        default:
            break;
    }
}


function onMessageWhenConnected(ev) {
    
    let message = ev.data;

    let msgArgs = message.split(' ');

    switch (msgArgs[0]) {
        case 'state ':
            onNewState( parseInt(msgArgs[1]) );
            break;
        
        case 'show':
            alert(message.replace('show', '').replace(' ', ''));
            break;
    
        default:
            break;
    }
}

function sendAction(actionid, ...args) {
    
    let msg = 'do ' + actionid;

    args.forEach(
        arg => msg += (' ' + arg)
    );

    clientSocket.send( msg );

    // clientSocket.send( 'do ' + actionid + (
    //     args ? ' ' + JSON.stringify(args) : ''
    // ));
}


const onMessageAtLogin = async (ev) => {

    if((ev.data + '').startsWith('state')) {
        showStateMessage('Code correct!');
        lastTryCode = '';
        await sleep(2000);

        console.log(parseInt ( (ev.data + '').replace('state ', '') ));
        
        onNewState( parseInt ( (ev.data + '').replace('state ', '') ) );

        //setIsPageFrozen(false);
        return;
    }


    if(ev.data == '0') {
        showStateMessage('Code incorrect');
        await sleep(3000);
        showStateMessage('');
        //setIsPageFrozen(false);
        document.querySelector('#code-input').disabled = false;
        return;
    }
}

clientSocket.onmessage = onMessageAtLogin;



document.querySelector('#code-input').onkeyup = (ev) => {
    if(!ev.target) return;

    const inputEl = ev.target;

    if(!inputEl.value) return;

    if(inputEl.value == lastTryCode && ev.key != 'Enter') return;

    if(inputEl.value.length == inputEl.maxLength) {
        lastTryCode = inputEl.value;
        inputEl.disabled = true;
        //setIsPageFrozen(true);
        showStateMessage('Connection..');
        clientSocket.send(inputEl.value);
    }
}