const customCodeChar = "@";


const customFuncs = {
}


function compileScriptCode(codetocompile) {
    
    // if no custom functions is used, don't change anything
    if(!codetocompile.includes(customCodeChar)) return codetocompile;
    
    // Remove the comments :
    codetocompile = codetocompile.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');

    let lastCheckedPart = 0;

    while(true) {
        let indexOfCustomLine = codetocompile.indexOf(customCodeChar, lastCheckedPart);
        
        if(indexOfCustomLine == -1) break;
        
        let customFuncPart = codetocompile.slice(indexOfCustomLine);
        
        let indexOfCEnd = customFuncPart.indexOf('\n');
        
        if(indexOfCEnd != -1) {
            customFuncPart = customFuncPart.slice(0, indexOfCEnd);
        }
        
        while (customFuncPart.endsWith(';') || customFuncPart.endsWith(' ') || customFuncPart.endsWith('\r') || customFuncPart.endsWith('\n')) {
            customFuncPart = customFuncPart.slice(0, -1);
        };

        // console.log(customFuncPart);
        
        let currentCustomFunc = customFuncs[customFuncPart.replace(customCodeChar, '').split(' ', 1)[0]];

        // console.log(JSON.stringify(customFuncPart));
        // console.log(
        //     customFuncPart.replace(customCodeChar, '').split(' ', 1)[0]
        // );
        
        let customCompiledLine = currentCustomFunc ? currentCustomFunc(customFuncPart) : '\n// Error : custom function not found';

        lastCheckedPart = indexOfCustomLine + customCompiledLine.length;

        
        codetocompile = codetocompile.slice(0, indexOfCustomLine) + customCompiledLine + '\n' + (indexOfCEnd == -1 ? '' : codetocompile.slice(indexOfCustomLine + indexOfCEnd));

        // // Don't continue the loop else the lastCheckedPart variable have a bad number
        // if(indexOfCEnd == -1) break;
    }

    return codetocompile;
}


let allImports = {
    messageapi: ""
    + '// Auto generated with the "import" command:'
    + "\nGlobal Text JS_C_API_modId;"
    + "\nBool can_r_msg_JS_C_API(true);"
    + '\nText last_msg_i_JS_C_API("");'
};
allImports.msgapi = allImports.messageapi;



// function addNewCustomFunc()

customFuncs['ifMessage'] = (linetochange) => {

    let allArgsC = linetochange.split(' ');

    let cModId = allArgsC[1];
    let funcRefName = allArgsC[2];

    if((!cModId) || (!funcRefName)) {
        return '\n// Error : bad arguments\n';
    }


    let allMsgExceptions = [];

    if(allArgsC.length > 3) {

        let argCIndex = 3;
        while (argCIndex < allArgsC.length) {
            let argCLine = allArgsC[argCIndex];
            if(argCLine.startsWith('#oneThreadOnlyFor=')) {
                allMsgExceptions = argCLine.slice(18).split(',');
            }
            argCIndex++;
        }
    }

    // if line finish with ";" remove the ";"
    // funcRefName = funcRefName.replace(';', '');


    if(allMsgExceptions.length > 0) {
        
        let lineIsOneTDetection = 'if(';

        lineIsOneTDetection += 'last_msg_i_JS_C_API == msgId_JS_C_API && (';

        allMsgExceptions.forEach((elMsgI, elMsgIIndex) => {
            if(!elMsgI) return;

            lineIsOneTDetection += (elMsgIIndex == 0 ? '' : ' || ') + 'msgId_JS_C_API == ' + elMsgI
        });

        lineIsOneTDetection += '))';

        linetochange = ''
        + "// Auto generated :"
        //+ "\nGlobal Text JS_C_API_modId;"
        + `\nif(JS_C_API_modId == "MOD_" + ${cModId}) {`
        + "\n  Global CityArray JS_C_API_textArgs;"
        + "\n  Global CityArray JS_C_API_numberArgs;"
        + "\n  CityArray JS_C_API_d_textArgs( JS_C_API_textArgs.CreateCopy() );"
        + "\n  CityArray JS_C_API_d_numberArgs( JS_C_API_numberArgs.CreateCopy() );"
        
        + '\n  Text msgId_JS_C_API(JS_C_API_textArgs.Get(0));'

        + '\n  if(!can_r_msg_JS_C_API) {'

        + '\n     ' + lineIsOneTDetection + ' {'
        + '\n          JS_C_API_modId = "";'
        + '\n     }'

        + '\n  } else {'
        
        + "\n     can_r_msg_JS_C_API=false;"

        + '\n     JS_C_API_modId = "";'
        + '\n     last_msg_i_JS_C_API = msgId_JS_C_API;'
        
        + `\n     ${funcRefName}(JS_C_API_d_textArgs, JS_C_API_d_numberArgs);`
        + "\n     can_r_msg_JS_C_API=true;"
        + '\n  }'

        + "\n}\n";
    } else {
        
        linetochange = ''
        + "// Auto generated :"
        //+ "\nGlobal Text JS_C_API_modId;"
        + `\nif(JS_C_API_modId == "MOD_" + ${cModId} && can_r_msg_JS_C_API) {`
        + "\n  can_r_msg_JS_C_API=false;"
        + "\n  Global CityArray JS_C_API_textArgs;"
        + "\n  Global CityArray JS_C_API_numberArgs;"
        + "\n  CityArray JS_C_API_d_textArgs( JS_C_API_textArgs.CreateCopy() );"
        + "\n  CityArray JS_C_API_d_numberArgs( JS_C_API_numberArgs.CreateCopy() );"
        + '\n  JS_C_API_modId = "";'
        + `\n  ${funcRefName}(JS_C_API_d_textArgs, JS_C_API_d_numberArgs);`
        + "\n  can_r_msg_JS_C_API=true;"
        + "\n}\n";
    }
    
    return linetochange;
}

customFuncs.ifMsg = customFuncs.ifMessage;


customFuncs['import'] = (linetochange) => {

    let stuffToImport = linetochange.split(' ');
    stuffToImport.shift();

    if(stuffToImport.length < 1) {
        return '\n// Error : no arguments with the "import" command\n';
    }

    linetochange = '';

    stuffToImport.forEach(importId => {
        if(!importId) return;
        importId = importId.toLowerCase();
        if(importId[0] == '#') importId = importId.slice(1);
        let importTxt = allImports[importId];
        linetochange += (
            importTxt ? '\n' + importTxt + '\n'
            : '\n//ERROR:\n//Import id not existing: "' + importId + '"'
        );
    });
    
    return linetochange;
}



customFuncs.test = (cline) => {
    // console.log(cline)
    return "// test";
}

exports.compileScriptCode = compileScriptCode;