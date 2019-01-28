// API for interrogating the command "database"

import jsCmds from "../assets/cmds/js.js";

const allCmds = _.union(jsCmds /* and other langs as needed */);

export function all() {
    return allCmds;
}

export function js() {
    return jsCmds;
}
