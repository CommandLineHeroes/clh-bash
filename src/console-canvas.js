import palette from "./palette.js";

const CONF = {
    WIDTH: 2 * 1024,
    HEIGHT: 1024,
    PAD_LEFT: 25,
    PAD_BOTTOM: 35,
    FONT_SIZE: 64, // px
    FONT_FAM: "monospace",
    LINE_SPACING: 8 // px
};

// find the maximum number of lines of text that can be drawn (to avoid
// performance problems if there are hundreds of thousands of lines
CONF.MAX_LINES = Math.ceil(CONF.WIDTH / (CONF.FONT_SIZE + CONF.LINE_SPACING));

console.log(`maximum possible display lines: ${CONF.MAX_LINES}`);

// text on the screen

let text = "";

// set up canvas element

const canvas = document.createElement("canvas");
canvas.width = CONF.WIDTH;
canvas.height = CONF.HEIGHT;
canvas.id = "console-canvas";

// set up canvas drawing context
const ctx = canvas.getContext("2d");
ctx.font = `${CONF.FONT_SIZE}px monospace`;

let v = 0;
while (v <= 1) {
    // ctx.fillStyle = `rgba(255, 0, 200, ${v})`;
    ctx.fillStyle = palette.yellow;
    console.log(ctx.fillStyle);
    ctx.fillRect(
        (canvas.width / 2) * v,
        (canvas.height / 2) * v,
        canvas.width * v,
        canvas.height * v
    );
    v += 0.1;
}

document.body.appendChild(canvas);

function write(text) {
    ctx.fillStyle = palette.black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.yellow;

    // fillText doesn't do multi-line, so split the text and call fill text
    // multiple times
    let y_offset = 0;
    let line_count = 0;
    for (let line of text.split("\n").reverse()) {
        ctx.fillText(
            line,
            CONF.PAD_LEFT,
            canvas.height - CONF.PAD_BOTTOM - y_offset
        );
        y_offset += CONF.FONT_SIZE + CONF.LINE_SPACING;

        // break if we've drawn the max number of display lines
        line_count += 1;
        if (line_count > CONF.MAX_LINES) break;
    }
}

export default { canvas, ctx, write };
