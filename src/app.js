import STATES from "./states.js";
import keyCodes from "./keycodes.js";
import sleep from "./sleep.js";
import consoleCanvas from "./console-canvas.js";
import * as cmds from "./cmds.js";
import sfx from "./sfx.js";

// create some handy aliases for keycodes, for use with Vue's v-on directive.
Vue.config.keyCodes = {
    enter: keyCodes.enter
};

let ctrl_down = false;

/**
 * @param {Number} kc the keyCode of the key pressed
 * @param {String} leftChar the character to the left of the cursor, used to
 * determine whether left arrow is valid (left arrow can't cross over a
 * newline)
 */
function validKeycode(ev, leftChar) {
    const kc = ev.keyCode;

    // if ctrl is held down, ignore everything
    if (kc == keyCodes.ctrl) {
        ctrl_down = true;
    }

    if (ctrl_down) {
        return false;
    }

    // valid keys are alpha, numeric, punctuation, underscore, hyphen, enter, and right-arrow.
    // left-arrow and backspace areonly accepted when they doesn't cross over a newline
    // (ie, would have made the cursor to up one line).
    const alphanumeric =
        _.inRange(kc, keyCodes.nums.start, keyCodes.nums.end + 1) ||
        _.inRange(kc, keyCodes.alpha.start, keyCodes.alpha.end + 1) ||
        _.inRange(kc, keyCodes.punct.start, keyCodes.punct.end + 1);

    const valid_other =
        [keyCodes.enter, keyCodes.right_arrow].includes(kc) ||
        (leftChar !== "\n" &&
            (kc === keyCodes.left_arrow || kc === keyCodes.backspace));

    return alphanumeric || valid_other;
}

const app = new Vue({
    el: "#game",
    data: {
        state: STATES.loading,
        showTitle: false,
        cmd: "",
        commands: [],
        displayScore: false,
        gameDuration: 60 * 1000,
        timer: 0,
        allowTyping: false,
        score: 0,
        count: {
            js: 0,
            bash: 0,
            html: 0,
            py: 0
        }
    },
    methods: {
        toState: function(state) {
            const change = { from: this.state, to: state };
            this.state = state;
            this.titleState = state === STATES.title;
            this.onStateChange(change);
        },
        handlePaste: function(ev) {
            // disable pasting into the textarea
            ev.preventDefault();
        },
        // this keypress handler can be overridden and changed based on the state of the game.
        onKeyPress: _.noop,
        // this keypress handler is the primary one which controls interaction with the textarea.
        handleKeypress: function(ev) {
            // give onKeyPress first crack at this event
            this.onKeyPress(ev);

            if (!this.allowTyping) {
                ev.preventDefault();
                return;
            }
            // first get the char to the left of the cursor (it's used when
            // left arrow is pressed to determine if left arrow is valid; left
            // arrow is valid except when it would cross over a newline and
            // move the cursor to the line above)
            const textarea = this.$el.querySelector("#cmd");
            const leftChar = this.cmd[textarea.selectionStart - 1];

            // if it's enter, test the input and return.  also, preventDefault
            // so enter doesn't add a newline.  Instead, add the newline
            // ourselves.  This prevents Enter from splitting a word in half if
            // the cursor is inside a word, like hitting enter on "ca|t" would
            // result in "ca\nt".
            if (ev.keyCode == Vue.config.keyCodes.enter) {
                ev.preventDefault();
                const result = this.testCmd(ev);
                result.lang.forEach(lang => app.count[lang]++);
                if (result.cmd.length != 0) {
                    // scroll to bottom of the textarea
                    // gameplay, it just makes the textarea look nicer when the
                    // textarea itself is visible during debugging)
                    this.$nextTick(() => {
                        textarea.blur();
                        textarea.focus();
                    });
                }
                return;
            }

            // if keycode is invalid, drop the event.
            if (!validKeycode(ev, leftChar)) {
                ev.preventDefault();
            }
        },
        handleKeyup: function(ev) {
            if (ev.keyCode == keyCodes.ctrl) {
                ctrl_down = false;
            }
        },
        testCmd: function(ev) {
            const cmd = _(this.cmd)
                .split("\n")
                .last()
                .trim();
            const { cmd: matchedCmd, lang } = cmds.find(cmd);
            const result = { cmd, valid: !!matchedCmd, matchedCmd, lang };
            this.$nextTick(() => {
                this.onResult(result);
            });
            return result;
        },
        onResult: _.noop,
        onStateChange: function(change) {
            console.log(
                `state changing from "${change.from}" to "${
                    change.to
                }" but no handler is registered.`
            );
        }
    },
    mounted: function() {
        // after the entire view has rendered
        this.$nextTick(function() {
            // put focus on the text input
            this.$refs.cmd.focus();
            // and also refocus on the input if the user clicks anywhere with
            // the mouse
            document.body.addEventListener("click", () =>
                this.$refs.cmd.focus()
            );
        });
    }
});

function updateConsole() {
    requestAnimationFrame(updateConsole);
    app.$nextTick(() => {
        let args = [app.cmd];
        if (app.state === STATES.play) {
            args.push(app.score);
            args.push(app.timer);
        }
        consoleCanvas.write(...args);
    });
}

updateConsole();

export default app;
