module.exports = {
    classes: ["Enforcer","Naval","Emergency","Aircraft","Uber","Civic","MuscleCar","SportsCar","Residential","Farm","RideableCreature"],
    
    boatsVehicleMinId: 40,
    charsVehicleMinId: 50,

    getVehicleById: (vehicleid) => {
        let res = module.exports.list[vehicleid];
        if(!res) res = (
            module.exports.isBoat(vehicleid) ? module.exports.list[module.exports.boatsVehicleMinId]
            : (module.exports.isChar(vehicleid) ? module.exports.list[module.exports.charsVehicleMinId] : module.exports.list[1])
        );

        return res;
    },
    isBoat: (vehicleid) => vehicleid >= module.exports.boatsVehicleMinId && vehicleid < module.exports.charsVehicleMinId,
    isChar: (vehicleid) => vehicleid >= module.exports.charsVehicleMinId,

    isPlane: vehicleid => vehicleid >= 4 && vehicleid <= 14,

    list: {
        1: {
            name: "Hero",
            class: "Enforcer"
        },
        2: {
            //name: "2016_Guardian",
            name: "Bastion",
            class: "Enforcer"
        },
        4: {
            name: "Chopper",
            class: "Enforcer"
        },
        5: {
            name: "Hera",
            class: "Aircraft"
        },
        6: {
            name: "Camel",
            class: "Emergency"
        },
        7: {
            name: "Responder",
            class: "Enforcer"
        },
        8: {
            name: "Cloud",
            class: "Aircraft"
        },
        9: {
            name: "Kongamato",
            class: "Aircraft"
        },
        10: {
            name: "SkyBringer",
            class: "Enforcer"
        },
        11: {
            name: "Swooper",
            class: "Aircraft"
        },
        12: {
            name: "UFO",
            class: "Aircraft"
        },
        13: {
            name: "Invader",
            class: "Aircraft"
        },
        14: {
            name: "Tempest",
            class: "Uber"
        },
        15: {
            name: "TaxiCab",
            class: "Civic"
        },
        16: {
            name: "Epona",
            class: "Civic"
        },
        17: {
            name: "Narym_Mission",
            class: "MuscleCar"
        },
        18: {
            name: "Enberg",
            class: "MuscleCar"
        },
        19: {
            name: "KnightShade",
            class: "MuscleCar"
        },
        20: {
            name: "Gersemi",
            class: "SportsCar"
        },
        21: {
            name: "Chans_Drakonas",
            class: "SportsCar"
        },
        22: {
            name: "Indulga",
            class: "Residential"
        },
        23: {
            name: "MOV_Cab",
            class: "Enforcer"
        },
        24: {
            name: "Cetan",
            class: "SportsCar"
        },
        25: {
            name: "FalchionGT",
            class: "MuscleCar"
        },
        26: {
            name: "Lantos",
            class: "SportsCar"
        },
        27: {
            name: "Dagyr",
            class: "SportsCar"
        },
        28: {
            name: "CombineHarvester",
            class: "Farm",
            addedY: -0.45
        },
        29: {
            name: "Gotland",
            class: "Van"
        },
        30: {
            name: "Vor",
            class: "Motorcycle"
        },
        31: {
            name: "Buzzer",
            class: "Motorcycle"
        },
        32: {
            name: "DunbyPatrollo",
            class: "Enforcer"
        },
    }
};

// Boats
module.exports.list[module.exports.boatsVehicleMinId] = {
    name: "Arowana",
    class: "Naval"
};
module.exports.list[module.exports.boatsVehicleMinId+1] = {
    name: "Liberty",
    class: "Naval"
};
module.exports.list[module.exports.boatsVehicleMinId+2] = {
    name: "Minnow",
    class: "Enforcer"
};
module.exports.list[module.exports.boatsVehicleMinId+3] = {
    name: "Drifter",
    class: "Enforcer"
};
module.exports.list[module.exports.boatsVehicleMinId+4] = {
    name: "Ferry",
    class: "Naval"
};

// Creatures
module.exports.list[module.exports.charsVehicleMinId] = {
    name: "Pig",
    class: "RideableCreature",
    addedY: -0.2
};
module.exports.list[module.exports.charsVehicleMinId+1] = {
    name: "Uber_Behemoth",
    class: "RideableCreature",
    addedY: -0.9
};
module.exports.list[module.exports.charsVehicleMinId+2] = {
    name: "Uber_Behemoth",
    class: "RideableCreature",
    addedY: -0.9
};
module.exports.list[module.exports.charsVehicleMinId+3] = {
    name: "Megafig",
    class: "RideableCreature",
    addedY: -1.1
};