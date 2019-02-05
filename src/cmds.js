// API for interrogating the command "database"

import bashCmds from "../assets/cmds/bash.js";
import jsCmds from "../assets/cmds/js.js";
import pyCmds from "../assets/cmds/python.js";
import htmlCmds from "../assets/cmds/html.js";

const allCmds = _.union(js(), py(), html() /* and other langs as needed */);

export function all() {
    return allCmds;
}

export function bash() {
    return bashCmds;
}

export function js() {
    return jsCmds;
}

export function py() {
    return pyCmds;
}

export function html() {
    return htmlCmds;
}

export function find(cmd) {
    const cmdsByLang = {
        bash: bash(),
        js: js(),
        py: py(),
        html: html()
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
