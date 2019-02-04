// API for interrogating the command "database"

import jsCmds from "../assets/cmds/js.js";

const allCmds = _.union(js() /* and other langs as needed */);

export function all() {
    return allCmds;
}

export function js() {
    return jsCmds;
}

export function find(cmd) {
    const cmdsByLang = {
        js: js()
    };
    for (let lang in cmdsByLang) {
        if (cmdsByLang[lang].includes(cmd.trim().toLowerCase())) {
            return { lang, cmd };
        }
    }
    return {};
}
