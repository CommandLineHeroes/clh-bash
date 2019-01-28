import palette from "./palette.js";

class ConsoleCanvas {
    constructor() {
        this.conf = {
            WIDTH: 1024,
            HEIGHT: 1024,
            ASPECT: 0.7222,
            PAD_LEFT: 25,
            PAD_BOTTOM: 35,
            FONT_SIZE: 64, // px
            FONT_FAM: "monospace",
            LINE_SPACING: 8 // px
        };

        // find the maximum number of lines of text that can be drawn (to avoid
        // performance problems if there are hundreds of thousands of lines
        this.conf.MAX_LINES = Math.ceil(
            this.conf.WIDTH / (this.conf.FONT_SIZE + this.conf.LINE_SPACING)
        );

        console.log(`maximum possible display lines: ${this.conf.MAX_LINES}`);

        // text on the screen

        let text = "";

        // set up canvas element

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.conf.WIDTH;
        this.canvas.height = this.conf.HEIGHT;
        this.canvas.id = "console-canvas";

        // set up canvas drawing context
        this.ctx = this.canvas.getContext("2d");

        // scale the canvas pixel sizes so that the square canvas (must be sized to
        // powers of two) get scaled to the correct ratio for the 3D computer screen's
        // size.

        this.ctx.scale(this.conf.ASPECT, 1);

        // draw a test pattern
        this.ctx.drawImage(
            document.querySelector("#test-pattern"),
            0,
            0,
            1024 / this.conf.ASPECT,
            1024
        );

        document.body.appendChild(this.canvas);
    }

    write(text) {
        this.ctx.font = `${this.conf.FONT_SIZE}px monospace`;
        this.ctx.fillStyle = palette.black;
        this.ctx.fillRect(
            0,
            0,
            this.canvas.width / this.conf.ASPECT,
            this.canvas.height
        );
        this.ctx.fillStyle = palette.yellow;

        // fillText doesn't do multi-line, so split the text and call fill text
        // multiple times
        let y_offset = 0;
        let line_count = 0;
        for (let line of text.split("\n").reverse()) {
            this.ctx.fillText(
                line,
                this.conf.PAD_LEFT,
                this.canvas.height - this.conf.PAD_BOTTOM - y_offset
            );
            y_offset += this.conf.FONT_SIZE + this.conf.LINE_SPACING;

            // break if we've drawn the max number of display lines
            line_count += 1;
            if (line_count > this.conf.MAX_LINES) break;
        }
    }
}

const consoleCanvas = new ConsoleCanvas();
window.consoleCanvas = consoleCanvas;
export default consoleCanvas;
