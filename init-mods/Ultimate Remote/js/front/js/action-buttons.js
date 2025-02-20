let buttonsTotal = [];
let totalCategories = [];

// const buttonCouldown = 10000;
const buttonCouldown = 0;

const loadButtons = () => {

    buttonsTotal = [];
    totalCategories = [];

    function addCategorie(id, name) {
        totalCategories.push({id, name});
    }

    function addButton(catid, id, name, exec, actiondescription) {
        
        buttonsTotal.push({
            catid, id, name, exec, actiondescription
        });
    }



    // **************************************************************
    // *********************** Buttons Code : ***********************
    

    // THE PLAYER CATEGORIE

    addCategorie('3d-block', 'Player');
    

    addButton('3d-block', '3d-block', 'get position', ()=>{
        sendAction('player', 'getpos');
    }, 'show the player position');

    // addButton('3d-block', '3d-block', 'set rot', ()=>{
    //     let newRot = prompt('Enter the new rotation');
    //     if(!newRot) return;
    //     newRot = parseFloat(newRot);
    //     if(Number.isNaN(newRot)) return;
    //     sendAction('player', 'setrot', newRot);
    // }, 'set the player rotation');

    addButton('3d-block', '3d-block', 'dancing', ()=>{
        sendAction('player', 'anim', 'dance_01');
    }, 'make the player dancing');
    
    addButton('3d-block', '3d-block', 'set animation', ()=>{
        let newPlyrAnim = prompt('Enter animation id');
        if(!newPlyrAnim) return;
        sendAction('player', 'anim', newPlyrAnim+'');
    }, 'set the player animation');
    
    addButton('3d-block', '3d-block', 'enable controls', ()=>{
        sendAction('player', 'controls', '1');
    }, 'enable the player controls');
    
    addButton('3d-block', '3d-block', 'disable controls', ()=>{
        sendAction('player', 'controls', '0');
    }, 'disable the player controls');
    
    addButton('3d-block', '3d-block', 'trigger collisions', ()=>{
        sendAction('player', 'collisions');
    }, 'switch the player collisions');
    
    addButton('3d-block', '3d-block', 'jumping', ()=>{
        sendAction('player', 'jump');
    }, 'make the player jump');

    addButton('3d-block', '3d-block', 'random TP (small)', ()=>{
        const randomP = (range, notnegative) => Math.floor(Math.random() * range*(notnegative ? 1 : 2)) - (notnegative ? 0 : range);

        sendAction('player', 'tp', randomP(2), randomP(2, true), randomP(2));
    }, 'teleporting randomly the player small version');

    addButton('3d-block', '3d-block', 'random TP (average)', ()=>{
        const randomP = (range, notnegative) => Math.floor(Math.random() * range*(notnegative ? 1 : 2)) - (notnegative ? 0 : range);

        sendAction('player', 'tp', randomP(5), randomP(4, true), randomP(5));
    }, 'teleporting randomly the player average version');

    addButton('3d-block', '3d-block', 'random TP (big)', ()=>{
        const randomP = (range, notnegative) => Math.floor(Math.random() * range*(notnegative ? 1 : 2)) - (notnegative ? 0 : range);

        sendAction('player', 'tp', randomP(8), randomP(6, true), randomP(8));
    }, 'teleporting randomly the player big version');

    addButton('3d-block', '3d-block', 'random TP (extrem)', ()=>{
        const randomP = (range, notnegative) => Math.floor(Math.random() * range*(notnegative ? 1 : 2)) - (notnegative ? 0 : range);

        sendAction('player', 'tp', randomP(25), randomP(10, true), randomP(25));
    }, 'teleporting randomly the player extrem version');

    addButton('3d-block', '3d-block', 'TP +X', ()=>{
        let xPos = prompt('Enter the X pos added to the actual X pos');
        if(!xPos) return;
        xPos = parseFloat(xPos);
        if(Number.isNaN(xPos)) return;
        sendAction('player', 'tp', xPos, 0, 0);
    }, 'increment the X player position');

    addButton('3d-block', '3d-block', 'TP +Y', ()=>{
        let yPos = prompt('Enter the Y pos added to the actual Y pos');
        if(!yPos) return;
        yPos = parseFloat(yPos);
        if(Number.isNaN(yPos)) return;
        sendAction('player', 'tp', 0, yPos, 0);
    }, 'increment the Y player position');

    addButton('3d-block', '3d-block', 'TP +Z', ()=>{
        let zPos = prompt('Enter the Z pos added to the actual Z pos');
        if(!zPos) return;
        zPos = parseFloat(zPos);
        if(Number.isNaN(zPos)) return;
        sendAction('player', 'tp', 0, 0, zPos);
    }, 'increment the Z player position');
    
    addButton('3d-block', '3d-block', 'Toogle Interface', ()=>{
        sendAction('player', 'toogleinterface');
    }, 'toogle the interface visibility');
    
    addButton('3d-block', 'npc', 'Toogle Visibility', ()=>{
        sendAction('player', 'tooglevisibility');
    }, 'toogle the visibility of the player');

    addButton('3d-block', 'vehicle', 'Eject from vehicle', ()=>{
        sendAction('player', 'clearv');
    }, 'eject the player from his vehicle');

    addButton('3d-block', 'vehicle', 'Set Traffic Density', ()=>{
        let trafficDensity = prompt('Give a number from 0 to 1 (like 0.4 for example)');
        if(!trafficDensity) return;
        trafficDensity = parseFloat(trafficDensity);
        if(Number.isNaN(trafficDensity)) return;
        sendAction('player', 'settraffic', trafficDensity);
    }, 'make the player dancing');
    
    addButton('3d-block', '3d-block', 'Save position', ()=>{
        sendAction('player', 'posmanager', 'save');
    }, 'saving the player position');
    
    addButton('3d-block', '3d-block', 'Undo position', ()=>{
        sendAction('player', 'posmanager', 'undo');
    }, 'teleport the player to the last saved position');



    // THE CHARS CATEGORIE

    addCategorie('npc', 'Chars');

    let npcState = 0;

    function getTextByState() {
        
        switch (npcState) {
            case 0:
                return "Action : not moving";
            case 1:
                return "Action : attack";
            case 2:
                return "Action : follow";
            // case 3:
            //     return "Action : flee";
        }
    }

    addButton('npc', '3d-block', getTextByState, (ev, button)=>{
        npcState++;
        if(npcState > 2) npcState = 0;
        button.querySelector('label').innerText = getTextByState();
        button.ariaLabel = 'changing the behavior of the character spawned (actually : ' + getTextByState().replace('Action : ','') + ')';
        button.title = 'changing the behavior of the character spawned (actually : ' + getTextByState().replace('Action : ','') + ')';

    }, 'changing the behavior of the character spawned (actually : not moving)');
    
    addButton('npc', '3d-block', 'set anim', ()=>{
        let newCharAnim = prompt('Enter animation id');
        if(!newCharAnim) return;
        sendAction('editchar', 'anim', newCharAnim+'');
    }, 'set the animation of the last character');

    addButton('npc', 'npc', 'Frank', ()=>{
        sendAction('spawn', 'n', 'FrankHoney', 'Special', npcState);
    }, 'spawn the character named frank');
    
    addButton('npc', 'npc', 'Taxi Driver', ()=>{
        sendAction('spawn', 'n', 'TaxiDriver', 'Pedestrian', npcState);
    }, 'spawn a taxi driver');
    
    addButton('npc', 'npc', 'Zombie', ()=>{
        sendAction('spawn', 'n', 'Zombie', 'Collectable', npcState);
    }, 'spawn a zombie');
    
    addButton('npc', 'npc', 'Clown', ()=>{
        sendAction('spawn', 'n', 'CircusClown', 'Collectable', npcState);
    }, 'spawn a clown');
    
    addButton('npc', 'npc', 'Alien', ()=>{
        sendAction('spawn', 'n', 'GreyAlien', 'Collectable', npcState);
    }, 'spawn an alien');


    addButton('npc', 'npc', 'Pig', ()=>{
        sendAction('spawn', 'n', 'Pig', 'RideableCreature', npcState);
    }, 'spawn a pig');
    
    addButton('npc', 'npc', 'Chicken', ()=>{
        sendAction('spawn', 'n', 'Chicken', 'Creature', npcState);
    }, 'spawn a chicken');

    addButton('npc', 'npc', 'Crocodile', ()=>{
        sendAction('spawn', 'n', 'Crocodile', 'Creature', npcState);
    }, 'spawn a crocodile');
    

    addButton('npc', 'npc', 'Behemoth', ()=>{
        sendAction('spawn', 'n', 'Behemoth', 'RideableCreature', npcState);
    }, 'spawn a behemoth');
    
    addButton('npc', 'npc', 'Rex Behemoth', ()=>{
        sendAction('spawn', 'n', 'Uber_Behemoth', 'RideableCreature', npcState);
    }, 'spawn the rex behemoth');
    
    addButton('npc', 'npc', 'Megafig', ()=>{
        sendAction('spawn', 'n', 'Megafig', 'RideableCreature', npcState);
    }, 'spawn the megafig robot');

    
    // THE VEHICLES CATEGORIE
    
    addCategorie('vehicle', 'Vehicles');
    
    addButton('vehicle', 'vehicle', 'Gersemi (car)', ()=>{
        sendAction('spawn', 'v', 'Gersemi', 'SportsCar', 2);
    }, 'spawn the car named Gersemi');

    addButton('vehicle', 'vehicle', 'Tigerella (car)', ()=>{
        sendAction('spawn', 'v', 'Tigerella', 'MuscleCar', 2);
    }, 'spawn the car named Tigerella');

    addButton('vehicle', 'vehicle', 'Limousine (car)', ()=>{
        sendAction('spawn', 'v', 'Indulga', 'Residential', 2);
    }, 'spawn a limousine');

    addButton('vehicle', 'vehicle', 'Hero (car)', ()=>{
        sendAction('spawn', 'v', 'Hero', 'Enforcer', 2);
    }, 'spawn the car named Hero');

    addButton('vehicle', 'vehicle', 'M.O.V (car)', ()=>{
        sendAction('spawn', 'v', 'MOV_Cab', 'Enforcer', 2);
    }, 'spawn the car named MOV');
    
    addButton('vehicle', 'vehicle', 'Dasher (motorbike)', ()=>{
        sendAction('spawn', 'v', '2016_Dasher', 'Enforcer', 2);
    }, 'spawn the motorbike named Dasher');
    
    addButton('vehicle', 'vehicle', 'Vor (motorbike)', ()=>{
        sendAction('spawn', 'v', 'Vor', 'MotorCycle', 2);
    }, 'spawn the motorbike named Vor');
    
    addButton('vehicle', 'vehicle', 'Arowana (boat)', ()=>{
        sendAction('spawn', 'v', 'Arowana', 'Naval', 2);
    }, 'spawn the boat named Arowana');

    addButton('vehicle', 'vehicle', 'Ferry (boat)', ()=>{
        sendAction('spawn', 'v', 'Ferry', 'Naval', 2);
    }, 'spawn the boat named Ferry');
    
    addButton('vehicle', 'vehicle', 'Elifant (plane)', ()=>{
        sendAction('spawn', 'v', 'Elifant', 'Aircraft', 2);
    }, 'spawn the plane named Elifant');
    
    addButton('vehicle', 'vehicle', 'Hera (helicopter)', ()=>{
        sendAction('spawn', 'v', 'Hera', 'Aircraft', 2);
    }, 'spawn the helicopter named Hera');
    
    addButton('vehicle', 'vehicle', 'Jetpack', ()=>{
        sendAction('spawn', 'v', 'Cloud', 'Aircraft', 1);
    }, 'spawn a jetpack');

    addButton('vehicle', 'vehicle', 'Devourer (car)', ()=>{
        sendAction('spawn', 'v', 'CombineHarvester', 'Farm', 2);
    }, 'spawn the car named Devourer');
    
    addButton('vehicle', 'vehicle', 'Bog (car)', ()=>{
        sendAction('spawn', 'v', 'Bog', 'Novelty', 2);
    }, 'spawn the car named Bog');
    
    // **************************************************************
    // **************************************************************

    loadButtonMenu();

}

function loadButtonMenu(menuid) {

    panelButtonsContainer.innerHTML = '';

    function addButtonInC(buttonid, buttonname, onexec, actiondescription, isgamebutton) {
        let baseButton = document.createElement('div');
        baseButton.setAttribute('data-div-id', "buttonbase");
        baseButton.role = 'button';
        baseButton.ariaPressed = false;
        baseButton.tabIndex = 0;
        // let baseButton = document.createElement('button');
        baseButton.ariaLabel = actiondescription;
        baseButton.title = actiondescription;
        baseButton.innerHTML = '<div></div> <label></label>';

        let imageEl = baseButton.querySelector('div');
        imageEl.setAttribute('data-div-id', "img");
        imageEl.style.backgroundImage = 'url("/front/resources/buttons/' + buttonid + '.svg")';
        // buttonEl.onclick = alert;

        if(buttonname) {
            if(typeof buttonname == 'function') buttonname = buttonname();
            baseButton.querySelector('label').innerText = buttonname + '';
        } else {
            baseButton.querySelector('label').remove();
        }
        if(onexec) {
            let canPressButton = true;
            baseButton.onclick = (ev) => {
                if(!canPressButton) return;
                if(isgamebutton && buttonCouldown > 0) {
                    canPressButton = false;
                    setTimeout(() => {
                        canPressButton = true;
                        showStateMessage('');
                    }, buttonCouldown);
                    showStateMessage('Button pressed.\nThere is a couldown so just wait.');
                }
                onexec(ev, baseButton);
            };
        }

        panelButtonsContainer.appendChild( baseButton );
    }

    if(!menuid) {
        totalCategories.forEach(cat => {
            addButtonInC(cat.id, cat.name, () => {
                loadButtonMenu(cat.id);
            }, "open the buttons categorie named " + cat.name);
        });
        return;
    }
    
    // Add the back button :
    addButtonInC('back', 'back', () => {
        loadButtonMenu();
    }, "return to the categories selection");

    buttonsTotal.forEach(button => {
        if(button.catid != menuid) return;

        addButtonInC(button.id, button.name, button.exec, button.actiondescription, true);
    });
}