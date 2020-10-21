// This file will generate and write the bash.js file.
// It this takes a set of text files that are generated from "compgen -bc > file.txt" as input
// Sorts, removes duplicates, and unions the files together then writes bash.js
// This makes it possible to combine different linux distros together e.g. Fedora, Ubuntu, RHEL
// Example Usage:
//     node generateBashCmds.js from-path-fedora.txt from-path-ubuntu.txt

"use strict";

let fs = require("fs");

let allCmds = [];

// First load the files from command line arguments
for (let i = 2; i < process.argv.length; i++) {
    let fileName = process.argv[i];
    console.log("Loading file: " + fileName);

    let fileContents = fs.readFileSync(fileName, "ascii");
    let linesArray = fileContents.split("\n");

    allCmds = allCmds.concat(linesArray);

    console.log("command count: ", linesArray.length);
}

console.log("all commands count: ", allCmds.length);

// Sort
allCmds.sort();

// Remove duplicates
let uniqueCmds = allCmds.filter(function(elem, index, self) {
    return index === self.indexOf(elem);
});

console.log("unique commands count: ", uniqueCmds.length);

// Write to file
console.log("Writing to: bash.js");
let outFileContent = "/** Generated from generateBashCmds.js **/\n";
outFileContent += "export default [\n";
uniqueCmds.forEach(value => {
    outFileContent += '"' + value + '",\n';
});
outFileContent += "];\n";

try {
    fs.writeFileSync("./bash.js", outFileContent);
} catch (err) {
    console.error(err);
}
