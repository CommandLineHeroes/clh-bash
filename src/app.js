import STATES from "./states.js";
import keyCodes from "./keycodes.js";
import sleep from "./sleep.js";
import consoleCanvas from "./console-canvas.js";

// create some handy aliases for keycodes, for use with Vue's v-on directive.
Vue.config.keyCodes = {
    enter: keyCodes.enter
};

/**
 * @param {Number} kc the keyCode of the key pressed
 * @param {String} leftChar the character to the left of the cursor, used to
 * determine whether left arrow is valid (left arrow can't cross over a
 * newline)
 */
function validKeycode(kc, leftChar) {
    // valid keys are alpha, numeric, underscore, hyphen, enter, and right-arrow.  left-arrow and backspace areonly accepted when they doesn't cross over a newline (ie, would have made the cursor to up one line).
    const alphanumeric =
        _.inRange(kc, keyCodes.nums.start, keyCodes.nums.end + 1) ||
        _.inRange(kc, keyCodes.ualpha.start, keyCodes.ualpha.end + 1) ||
        _.inRange(kc, keyCodes.lalpha.start, keyCodes.lalpha.end + 1);

    const valid_other =
        [
            keyCodes.underscore,
            keyCodes.hyphen,
            keyCodes.enter,
            keyCodes.right_arrow
        ].includes(kc) ||
        (leftChar != "\n" &&
            (kc == keyCodes.left_arrow || kc == keyCodes.backspace));

    if (alphanumeric || valid_other) {
        return true;
    }

    return false;
}

const app = new Vue({
    el: "#game",
    data: {
        state: STATES.loading,
        cmd: "",
        commands: [],
        allowTyping: false
    },
    methods: {
        toState: function(state) {
            const change = { from: this.state, to: state };
            this.state = state;
            this.onStateChange(change);
        },
        handleKeypress: function(ev) {
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
                const result = this.testInput(ev);
                ev.preventDefault();
                // if the command submitted is not empty string, add a newline
                if (result.cmd.length != 0) {
                    this.cmd += "\n";
                    // scroll to bottom of the textarea (this doesn't affect
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
            if (!validKeycode(ev.keyCode, leftChar)) {
                ev.preventDefault();
            }
        },
        testInput: function(ev) {
            const cmd = _(this.cmd)
                .split("\n")
                .last()
                .trim();
            const matchedCmd = _.find(
                this.commands,
                c => c.cmd.trim().toLowerCase() == cmd.toLowerCase()
            );
            const result = { cmd, valid: !!matchedCmd, matchedCmd };
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

export default app;
