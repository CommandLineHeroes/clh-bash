import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/loaders/MTLLoader.js";
import app from "./app.js";
import STATES from "./states.js";

async function start() {
    // fetch the commands database
    const rsp = await fetch("../assets/commands.json");
    const commands = await rsp.json();

    // demo of using lodash on the command database
    const commandNames = map(commands, "cmd");

    app.commands = commands;

    console.log(commandNames);
}

start();
