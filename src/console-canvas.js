import palette from "./palette.js";

const canvas = document.createElement("canvas");
canvas.width = 1024;
canvas.height = 1024;
canvas.id = "console-canvas";

const ctx = canvas.getContext("2d");

window.palette = palette;

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

export default { canvas, ctx };
