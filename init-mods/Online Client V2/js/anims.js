
// Note: for optimisations some animations aren't syncronised (for example the tiptoe anim is replaced by the idle anim)
// For the tiptoe, it's replaced by the idle animation so the id "3" are now used for the hands attacks (the attacks anim will be usefull)

module.exports = {
    1: 0, // idle
    // 5: 3, // tiptoe
    5: 0, // tiptoe > idle
    // 0: 4, // walk
    0: 5, // walk > run
    3: 5, // run
    // 4: 6, // sprint
    4: 5, // sprint > run

    11: 22, // idle(1?)
    21: 23, // idle(2?)
    26: 24, // idle(3?)

    115: 8, // fallland
    10: 9, // land

    // 9: 21, // jump
    // Now there is 1 animation for the jump / fall for the optimisation
    9: 2, // jump
    8: 2, // fall
    
    // Other fall animations :
    2481: 2,
    1995: 2,
    1114: 2,
    2419: 2,
    2504: 2,

    180: 33, // Splated
    
    // Knockback :
    1564: 2,
    1565: 2,
    1566: 2,

    // Attacks with hands :
    2089: 3,
    2090: 3,
    2091: 3,
    2088: 3,

    // Axe smash :
    41: 35,

    2104: 36,
    
    268: 15, // combatroll_jump (TODO: fix this)
    270: 7, // combatroll_land (TODO: fix this)
    193: 10, // wade
    331: 11, // swim (TODO: fix this)
    327: 12, // teeter
    432: 17, // jump_trampoline (TODO: make this loop properly)
    1393: 20, // shrug
    2916: 26, // DisguiseBooth_in
    2917: 25, // DisguiseBooth_idle
    2918: 27, // DisguiseBooth_out
    45: 28, // hover
    46: 29, // fly
    2411: 16, // ride_car
    2157: 16, // ride_car (helicopter)
    2407: 16, // ride_car (motorbike)
    2303: 13, // Whistle_Run
    2302: 14, // Whistle
    2133: 30, // DRC_Intro2
    2134: 31, // DRC_Outro2
    2135: 32, //DRC_Idle2

    350: 34,

    // Emotes :  ( ALL THE EMOTES NEED TO HAVE AN ID OF 80 OR BIGGER )

    1774: 80, // talk
    1763: 81, // phone
    3077: 82, // dance 1
    3091: 83, // star_jumps
    1632: 84, // salute
    2543: 85, // cafe
    1791: 86, // point to direction
    1065: 87, // ponder
    2937: 88, // rockingchair_idle
    2936: 88,
    3078: 89, // dance 2
};