const compression = require("compression");
const bs = require("browser-sync").create();

bs.init({
    server: "./",
    watch: true,
    middleware: [compression({filter: () => true })]
});
