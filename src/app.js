import STATES from "./states.js";

// create some handy aliases for keycodes, for use with Vue's v-on directive.
Vue.config.keyCodes = {
    enter: 13
};

const app = new Vue({
    el: "#game",
    data: {
        state: STATES.SPLASH_SCREEN,
        cmd: "",
        commands: []
    },
    methods: {
        testInput: function() {
            const matchedCmd = _.find(
                this.commands,
                c => c.cmd.trim().toLowerCase() == this.cmd.trim().toLowerCase()
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
