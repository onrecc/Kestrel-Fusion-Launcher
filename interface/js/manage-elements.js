const modContainer = document.getElementById('mod-container');
const freezePageElement = document.getElementById('lock-page');
const modParam = document.getElementById('mod-param');

let totalEnabledMods = 0;
const enabledModsLabelElement = document.querySelector('#total-enabled-mods');

setTimeout(() => {
    enabledModsLabelElement.style.display = '';
}, 350);

function addMod(modinfo, isused) {

    if(isused) {
        totalEnabledMods++;
        enabledModsLabelElement.innerText = totalEnabledMods + ' mods enabled';
    }
    

    let el = document.createElement('div');

    el.className = 'mod-display';

    let modNameID = modinfo.name;

    el.setAttribute('data-mod-id', modNameID);

    el.innerHTML = `
    <span></span>
    <div class="checkbox-box">
        <input type="checkbox" ${isused ? 'checked="true"' : '' }>
        <div class="input-skin"></div>
    </div>
    <label></label>
    `;

    //<input type="checkbox" ${isused ? 'checked="true"' : '' }">
    el.querySelector('span').innerText = (modinfo.displayName || modNameID) + '';
    if(modinfo.subLine) {
        if(modinfo.author) {
            el.querySelector('label').innerText = 'made by ' + modinfo.author + ' ' + modinfo.subLine;
        } else {
            el.querySelector('label').innerText = '' + modinfo.subLine;
        }
    } else if(modinfo.author) {
        el.querySelector('label').innerText = 'made by ' + modinfo.author;
    }

    el.querySelector('input').onchange = () => {
        let isNowUsed = el.querySelector('input').checked;
        setIsActivatedMod( modNameID, isNowUsed );
    }

    el.onmouseenter = () => {
        el.appendChild( modParam );
        modParam.style.display = '';
        
        // Show mod infos :
        modParam.querySelector('div > button').onclick = () => {

            let textInfo;

            if(modinfo.description && typeof(modinfo.description) == 'string') {
                textInfo = "Description :\n" + modinfo.description;
            } else {
                textInfo = "This mod has no description";
            }

            if(Object.entries( modinfo.addons ).length != 0) {
                textInfo += '\nThe mod uses :';

                for (const key in modinfo.addons) {
                    if (Object.hasOwnProperty.call(modinfo.addons, key) && modinfo.addons[key]) {
                        textInfo += '\n' + key;
                    }
                }
            } else {
                textInfo += "\nThe mod don't use anything, it can be an error.\nIf you are the mod creator check if you have correctly named your folders";
            }

            showPopup(textInfo);
        }

        // Open mod folders :
        modParam.querySelectorAll('div > button')[1].onclick = () => {
            window.electronAPI.viewMod( modNameID );
        }

        // Uninstall/delete a mod :
        modParam.querySelectorAll('div > button')[2].onclick = () => {
            isOkTo( `Are you sure you want to delete the mod "${modNameID}"`, (wanttoremove) => {
                if(!wanttoremove) return;
                if(isPageFrozen) return;
                setIsPageFrozen(true);

                el.remove();

                window.electronAPI.removeMod( modNameID );
            });
        }
    }
    el.onmouseleave = () => {
        modParam.style.display = 'none';
    }

    modContainer.appendChild( el );

}

window.electronAPI.setAddMod( addMod );



function setIsActivatedMod(modname, isenable) {

    if(isPageFrozen) return;
    setIsPageFrozen(true); // the page will be unfreeze by the main process when the main process finish the modifications

    window.electronAPI.setModIsActivated(modname, isenable);

    totalEnabledMods += isenable ? 1 : -1;

    enabledModsLabelElement.innerText = totalEnabledMods + ' mods enabled';
}


// Code of the "..." button at the right of the mod profile
(()=>{

    modParam.querySelectorAll('button').forEach(
        el => {
            el.style = `
            padding: 5px 15px;
            border: 0.4px solid black;
            border: none;
            border-top: 1px solid gray;
            border-bottom: 1px solid gray;
            background: white;
            font-size: 20px;
            cursor: pointer;
            `;
        }
    );

    // Events to show/hide mod actions :
    
    modParam.onmouseenter = () => {
        
        const modActionStyle = modParam.querySelector('div').style;

        if(modActionStyle.display == 'flex') return;

        modActionStyle.display = 'flex';
    }

    modParam.onmouseleave = () => {
        
        const modActions = modParam.querySelector('div');

        if(modActions.style.display == 'none') return;

        modActions.style.display = 'none';
    }

})()



document.querySelector('#add-mod').onclick = () => {
    if(isPageFrozen) return;

    setIsPageFrozen(true);
    window.electronAPI.addMod();
};

document.querySelector('#launch-game button').onclick = () => {
    if(isPageFrozen) return;
    setIsPageFrozen(true);

    window.electronAPI.launchGame();
}