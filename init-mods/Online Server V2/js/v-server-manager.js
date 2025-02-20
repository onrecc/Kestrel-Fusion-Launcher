module.exports = {
    
    boatsVehicleMinId: 40,
    charsVehicleMinId: 50,

    isBoat: (vehicleid) => vehicleid >= module.exports.boatsVehicleMinId && vehicleid < module.exports.charsVehicleMinId,
    isChar: (vehicleid) => vehicleid >= module.exports.charsVehicleMinId,

    isPlane: vehicleid => vehicleid >= 4 && vehicleid <= 14,
}