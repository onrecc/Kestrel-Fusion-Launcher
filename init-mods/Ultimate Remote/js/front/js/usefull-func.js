const sleep = (sleeptime) => new Promise((resolve) => {
    setTimeout(() => {
        resolve();
    }, sleeptime);
});

function setIsPageFrozen(isfrozen) {
    document.querySelector('#freeze-box').style.display = isfrozen ? '' : 'none';
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function showStateMessage(messagetxt) {
    if(!messagetxt) {
        document.querySelector('#state-display').style.display = 'none';
        return;
    }
    document.querySelector('#state-display').style.display = '';
    document.querySelector('#state-display > div > p').innerText = messagetxt;
}

window.addEventListener("keydown", e => {
    e = e.key + '';
    if (e == 'Enter' || e == ' ' || e == 'Spacebar') {
        if(!document.activeElement) return;
        document.activeElement.click();
    }
});