import { map } from "../node_modules/lodash-es/lodash.js";
import STATES from "./states.js";

const app = new Vue({
    el: "#game",
    data: {
        state: STATES.SPLASH_SCREEN,
        inputCommand: ""
    },
    methods: {}
});

export default app;
