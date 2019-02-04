// API for interrogating the command "database"

import jsCmds from "../assets/cmds/js.js";
import pyCmds from "../assets/cmds/python.js";

const allCmds = _.union(js(), py() /* and other langs as needed */);

export function all() {
    return allCmds;
}

export function js() {
    return jsCmds;
}

export function py() {
    return pyCmds;
}

export function find(cmd) {
    const cmdsByLang = {
        js: js(),
        py: py()
    };
    const result = {
        lang: []
    };
    for (let lang in cmdsByLang) {
        if (cmdsByLang[lang].includes(cmd.trim().toLowerCase())) {
            result.cmd = cmd;
            result.lang.push(lang);
        }
    }
    return result;
}
