const palette = {};

function cssVar(prop) {
    return window
        .getComputedStyle(document.body)
        .getPropertyValue(prop)
        .trim();
}

palette.white = cssVar("--clh-white");
palette.black = cssVar("--clh-black");
palette.purple = cssVar("--clh-purple");
palette.purple_light = cssVar("--clh-purple-light");
palette.yellow = cssVar("--clh-yellow");
palette.yellow_light = cssVar("--clh-yellow-light");
palette.orange = cssVar("--clh-orange");
palette.orange_light = cssVar("--clh-orange-light");
palette.blue = cssVar("--clh-blue");
palette.blue_light = cssVar("--clh-blue-light");

export default palette;
