import palette from "./palette.js";

class ConsoleCanvas {
    constructor() {
        this.conf = {
            WIDTH: 2 * 2048,
            HEIGHT: 2 * 2048,
            ASPECT: 0.7222,
            PAD_LEFT: 4 * 54,
            PAD_BOTTOM: 4 * 82,
            FONT_SIZE: 4 * 64, // px
            FONT_FAM: "overpass-mono",
            FONT_WEIGHT: "bold",
            LINE_SPACING: 4 * 14, // px
            PLAY_CHARS_PER_LINE: 44 // this will need to change if the font size in play mode changes
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

        this.drawTestPattern();

        document.body.appendChild(this.canvas);
    }

    drawTestPattern() {
        // draw a test pattern
        this.ctx.drawImage(
            document.querySelector("#test-pattern"),
            0,
            0,
            this.conf.WIDTH / this.conf.ASPECT,
            this.conf.HEIGHT
        );
    }

    /**
     * Write text onto the screen.  Also draws the score. If you don't want the
     * score to appear at the top-right, pass in score `false` (for instance,
     * on the title screen or leaderboard screen).
     */
    write(text, score = false, timer = false) {
        this.ctx.font = `${this.conf.FONT_WEIGHT} ${this.conf.FONT_SIZE}px ${
            this.conf.FONT_FAM
        }`;
        this.ctx.fillStyle = palette.black;
        this.ctx.fillRect(
            0,
            0,
            this.canvas.width / this.conf.ASPECT,
            this.canvas.height
        );
        this.ctx.fillStyle = palette.yellow_light;

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

        // black out the top line whenever score or timer is being displayed
        if (score !== false || timer !== false) {
            this.ctx.fillStyle = palette.black;
            this.ctx.fillRect(
                0,
                0,
                this.canvas.width * 2,
                this.conf.FONT_SIZE * 2
            );
            // this.ctx.fillRect(0, 0, 1000, 1000);
            this.ctx.fillStyle = palette.yellow_light;
        }

        // draw score and time remaining
        if (score !== false) {
            this.ctx.fillText(
                `score: ${score}`,
                this.conf.PAD_LEFT,
                this.conf.PAD_BOTTOM
            );
        }
        if (timer !== false) {
            this.ctx.fillText(
                `timer: ${timer}`,
                this.canvas.width - this.conf.PAD_LEFT,
                this.conf.PAD_BOTTOM
            );
        }
    }
}

const consoleCanvas = new ConsoleCanvas();
window.consoleCanvas = consoleCanvas;
export default consoleCanvas;
