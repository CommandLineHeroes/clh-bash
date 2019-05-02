import STATES from "./states.js";
import keyCodes from "./keycodes.js";
import consoleCanvas from "./console-canvas.js";
import * as cmds from "./cmds.js";
import config from "./config.js";

// create some handy aliases for keycodes, for use with Vue's v-on directive.
Vue.config.keyCodes = {
    enter: keyCodes.enter
};

let ctrl_down = false;

/**
 * @param {Number} kc the keyCode of the key pressed
 * @param {Array<String>} leftChars the character to the left of the cursor, used to
 * determine whether left arrow is valid (left arrow can't cross over a
 * newline)
 */
function validKeycode(ev, leftChars, state) {
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

    const valid_other = [keyCodes.enter, keyCodes.right_arrow].includes(kc);

    const on_newline = leftChars[0] === "\n";
    const on_prompt = leftChars.reverse().join("") === "\n> ";
    const valid_backspace =
        kc === keyCodes.backspace && !(on_newline || on_prompt);

    // Allow spaces when people enter their name on high score list
    const valid_space = kc === keyCodes.space && state === STATES.highscore;

    return alphanumeric || valid_other || valid_backspace || valid_space;
}

const app = new Vue({
    el: "#game",
    data: {
        state: STATES.loading,
        isMobile: isMobile.any,
        showTitle: false,
        showScore: false,
        cmd: "",
        typingPosition: 0,
        displayCmd: "",
        commands: [],
        displayScore: false,
        gameDuration: config.GAME_DURATION,
        timer: 0,
        allowTyping: false,
        score: 0,
        count: {
            js: 0,
            bash: 0,
            html: 0,
            py: 0,
            recentValidCharacters: 0,
            totalValidCharacters: 0,
            totalValidCommands: 0
        }
    },
    watch: {
        displayCmd: function(val, oldVal) {
            // if receiving user input and on a newline, add a prompt to the main cmd
            if (this.allowTyping && val[val.length - 1] === "\n") {
                this.cmd += "> ";
            }
        },
        cmd: function(val, oldVal) {
            // if typing is enabled, copy this directly into displayCmd and update typingPosition
            if (this.allowTyping) {
                this.displayCmd = _.clone(this.cmd);
                this.typingPosition = this.cmd.length;
            }
            // if the screen was blanked out, reset typing position
            if (!this.cmd.includes(oldVal)) {
                this.typingPosition = 0;
            }
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
            const leftChars = [
                this.cmd[textarea.selectionStart - 1],
                this.cmd[textarea.selectionStart - 2],
                this.cmd[textarea.selectionStart - 3]
            ];

            // if it's enter, test the input and return.  also, preventDefault
            // so enter doesn't add a newline.  Instead, add the newline
            // ourselves.  This prevents Enter from splitting a word in half if
            // the cursor is inside a word, like hitting enter on "ca|t" would
            // result in "ca\nt".
            if (ev.keyCode === Vue.config.keyCodes.enter) {
                ev.preventDefault();
                const result = this.testCmd(ev);
                result.lang.forEach(lang => app.count[lang]++);

                if (result.cmd.length !== 0) {
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
            if (!validKeycode(ev, leftChars, this.state)) {
                ev.preventDefault();
            }
        },
        handleKeyup: function(ev) {
            if (ev.keyCode === keyCodes.ctrl) {
                ctrl_down = false;
            }
        },
        testCmd: function(ev) {
            const cmd = _(this.cmd)
                .split("\n")
                .last()
                .trim()
                .replace(/^\> /, ""); // ignore the prompt
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
        },

        /**
         * This function returns a json object with the set of golden command for this game
         */
        pickGoldenCommands: function() {
            // General rules for golden commands
            //   1. 10 char or less
            //   2. don't start with _
            //   3. don't end with ()
            //   4. Pull from a list of well known commands for each lang
            //   5. pick configurable amount of commands from each language type that meet the above rules

            const filterCmds = function(cmds) {
                // filter by length
                let filteredCmds = cmds.filter(
                    cmd => cmd.length <= config.GOLDEN_CMDS_MAX_LENGTH
                );

                // Filter out starting with underscore
                filteredCmds = filteredCmds.filter(cmd => !cmd.startsWith("_"));

                // Filter out ending with parens )
                filteredCmds = filteredCmds.filter(cmd => !cmd.endsWith(")"));

                return filteredCmds;
            };

            let bashAll = filterCmds(cmds.cmdsByLang.bash.cmds);
            let bashCommon = cmds.cmdsByLang.bash.commonCmds;
            let jsAll = filterCmds(cmds.cmdsByLang.js.cmds);
            let jsCommon = cmds.cmdsByLang.js.commonCmds;
            let pyAll = filterCmds(cmds.cmdsByLang.py.cmds);
            let pyCommon = cmds.cmdsByLang.py.commonCmds;
            let htmlAll = filterCmds(cmds.cmdsByLang.html.cmds);
            let htmlCommon = filterCmds(cmds.cmdsByLang.html.commonCmds);

            let cn = config.GOLDEN_CMDS_COMMON_PER_LANG;
            let rn = config.GOLDEN_CMDS_RANDOM_PER_LANG;

            let goldenCommands = {
                bash: _.sampleSize(bashCommon, cn).concat(
                    _.sampleSize(_.xor(bashCommon, bashAll), rn)
                ),
                js: _.sampleSize(jsCommon, cn).concat(
                    _.sampleSize(_.xor(jsCommon, jsAll), rn)
                ),
                py: _.sampleSize(pyCommon, cn).concat(
                    _.sampleSize(_.xor(pyCommon, pyAll), rn)
                ),
                html: _.sampleSize(htmlCommon, cn).concat(
                    _.sampleSize(_.xor(htmlCommon, htmlAll), rn)
                )
            };
            goldenCommands.all = goldenCommands.bash.concat(
                goldenCommands.js,
                goldenCommands.py,
                goldenCommands.html
            );

            return goldenCommands;
        },
        /**
         * Get the golden commands for the console canvas.
         */
        printGoldenCommands: function() {
            let out = "";

            const halfScreen = Math.floor(
                consoleCanvas.conf.PLAY_CHARS_PER_LINE / 2
            );
            const goldCmds = app.goldenCommands;
            const langs = _.keys(goldCmds);

            // title of first and second langs
            out += cmds.bash().name.padEnd(halfScreen);
            out += cmds.js().name + "\n";

            // interleave commands of first and second langs
            out += _.zip(
                goldCmds.bash.map(c => ` - ${c}`.padEnd(halfScreen)),
                goldCmds.js.map(c => `${` - ${c}`.padEnd(halfScreen)}\n`)
            )
                .map(cs => cs.join(""))
                .join("");

            out += "\n";

            // title of third and fourth langs
            out += cmds
                .py()
                .name.padEnd(
                    Math.floor(consoleCanvas.conf.PLAY_CHARS_PER_LINE / 2)
                );
            out += cmds.html().name + "\n";

            // interleave commands of third and fourth langs
            out += _.zip(
                goldCmds.py.map(c => ` - ${c}`.padEnd(halfScreen)),
                goldCmds.html.map(c => `${` - ${c}`.padEnd(halfScreen)}\n`)
            )
                .map(cs => cs.join(""))
                .join("");

            return out;
        },
        printHighScores: function(leaders) {
            if (leaders.isEmpty) {
                return "";
            }

            let out = "";

            // Only display the top 10 leaders
            leaders = leaders.slice(0, 10);

            // inject headings
            let leaderContent = _.concat(
                { name: "NAME", score: "SCORE", tribe: "TRIBE" },
                { name: "----", score: "-----", tribe: "-----" },
                leaders
            );

            let longestScoreLength = leaders[0].score.toString().length;
            let longestTribeLength = _(leaderContent)
                .map("tribe")
                .maxBy(n => n.length).length;

            leaderContent.forEach(leader => {
                // pad for column formatting
                let score = leader.score.toString().padEnd(longestScoreLength);
                let tribe = leader.tribe.padEnd(longestTribeLength);

                out += `${score}  ${tribe}  ${leader.name}\n`;
            });

            return out;
        },
        updateConsole: _.noop,
        writeToConsole: function() {
            this.$nextTick(() => {
                let args = [_.clone(this.displayCmd)];
                const showCursor =
                    this.allowTyping && performance.now() % 1200 < 600;
                if (showCursor) {
                    args[0] += "█";
                }
                if (this.showScore) {
                    args.push(this.score);
                    args.push(this.timer);
                }
                consoleCanvas.write(...args);
            });
        },
        typingLoop: function() {
            let delay = this.typingTimeChar(
                this.displayCmd[this.displayCmd - 1]
            );

            if (!this.allowTyping) {
                this.displayCmd = this.cmd.substr(0, this.typingPosition);
            }
            // increment typing position but don't exceed the length of cmd
            this.typingPosition = Math.min(
                this.typingPosition + 1,
                this.cmd.length
            );

            setTimeout(this.typingLoop, delay);
        },
        // how long will it take to display the given character
        typingTimeChar: function(str) {
            let delay = config.CHAR_APPEAR_DELAY;

            if (/\s/.test(this.displayCmd[this.displayCmd.length - 1])) {
                delay /= 10;
            }

            return delay;
        },
        // how long will it take to display the given string
        typingTime: function(str) {
            return (
                config.CHAR_APPEAR_DELAY * str.replace(/\S/g, "").length +
                (config.CHAR_APPEAR_DELAY / 10) * str.replace(/\s/g, "").length
            );
        },
        resetState: function() {
            // Reset the score and other stat between games:
            this.timer = 0;
            this.allowTyping = false;
            this.score = 0;
            this.count.js = 0;
            this.count.bash = 0;
            this.count.html = 0;
            this.count.py = 0;
            this.count.recentValidCharacters = 0;
            this.count.totalValidCharacters = 0;
            this.count.totalValidCommands = 0;
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

window.app = app;

export default app;
