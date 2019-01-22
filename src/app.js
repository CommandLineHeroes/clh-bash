import STATES from "./states.js";
import keyCodes from "./keycodes.js";

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
        kc == keyCodes.underscore ||
        kc == keyCodes.hyphen ||
        kc == keyCodes.enter ||
        kc == keyCodes.right_arrow ||
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
        state: STATES.SPLASH_SCREEN,
        cmd: "",
        commands: []
    },
    methods: {
        handleKeypress: function(ev) {
            // first get the char to the left of the cursor (it's used when
            // left arrow is pressed to determine if left arrow is valid; left
            // arrow is valid except when it would cross over a newline and
            // move the cursor to the line above)
            const leftChar = this.cmd[
                this.$el.querySelector("#cmd").selectionStart - 1
            ];

            // if keycode is invalid, drop the event and abort
            if (!validKeycode(ev.keyCode, leftChar)) {
                ev.preventDefault();
                return;
            }
            // for valid keycodes, if it's enter, test the input, for all other
            // valid keycodes just allow the default event handler to proceed.
            if (ev.keyCode == Vue.config.keyCodes.enter) {
                console.log("enter pressed, testing input");
                this.testInput(ev);
            }
        },
        testInput: function(ev) {
            const matchedCmd = _.find(
                this.commands,
                c =>
                    c.cmd.trim().toLowerCase() ==
                    _(this.cmd)
                        .split("\n")
                        .last()
                        .trim()
                        .toLowerCase()
            );
            if (matchedCmd) {
                this.onValidCmd(matchedCmd);
            } else {
                this.onInvalidCmd(this.cmd);
            }
        },
        onValidCmd: function(cmd) {
            console.log(
                `\`${
                    cmd.cmd
                }\` is valid but no onValidCmd handler is registered.`
            );
        },
        onInvalidCmd: function(cmd) {
            console.log(
                `\`${cmd}\` is invalid but no onInvalidCmd handler is registered.`
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
