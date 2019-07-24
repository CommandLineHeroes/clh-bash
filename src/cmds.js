// API for interrogating the command "database"

import bashCmds from "../assets/cmds/bash.js";
import jsCmds from "../assets/cmds/js.js";
import pyCmds from "../assets/cmds/python.js";
import htmlCmds from "../assets/cmds/html.js";
import gitCmds from "../assets/cmds/git.js";

const allCmds = _.union(
    bash().cmds,
    js().cmds,
    py().cmds,
    html().cmds,
    git().cmds /* and other langs as needed */
);

export const cmdsByLang = {
    bash: bash(),
    js: js(),
    py: py(),
    html: html(),
    git: git()
};

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

export function git() {
    return gitCmds;
}

export function longest() {
    return allCmds.reduce(function(a, b) {
        return a.length > b.length ? a : b;
    }).length;
}

export function find(cmd) {
    const result = {
        lang: []
    };
    for (let lang in cmdsByLang) {
        if (cmdsByLang[lang].cmds.includes(cmd.trim())) {
            result.cmd = cmd;
            result.lang.push(lang);
        }
    }
    return result;
}
