import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/controls/OrbitControls.js";
import "../node_modules/three/examples/js/controls/TrackballControls.js";
import "../node_modules/three/examples/js/objects/Fire.js";
import "./MTLLoaderPhysical.js";
import app from "./app.js";
import tweenCamera from "./tween-camera.js";
import keyCodes from "./keycodes.js";
import { loadMesh } from "./three-utils.js";
import STATES from "./states.js";
import sleep from "./sleep.js";
import consoleCanvas from "./console-canvas.js";
import config from "./config.js";
import sfx from "./sfx.js";
import leaderboard from "./leaderboard.js";

let container;
let camera, scene, renderer, controls;
let mouseX = 0,
    mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let computer;

// Fire vars
let fire;
let firePlane;
let allowFire = false;

let leaders;

// FPS tracking
let stats = new Stats();
// document.body.appendChild(stats.dom);
let t, previousTime;
let slowCount = 0;
let maxSlowFrames = config.MAX_SLOW_FRAMES;
let isLowFPS = false;
window.isLowFPS = isLowFPS;
t = previousTime = performance.now();

const states = {
    [STATES.title]: {
        enter: async function() {
            app.updateConsole = _.noop;
            app.resetState();
            app.typingLoop();
            app.cmd = "";

            controls.enabled = false;

            slowCount = 0;

            // make font big enough to see from a distance
            consoleCanvas.conf.FONT_SIZE = 4 * 114;

            const camTween = tweenCamera(camera, {
                rotation: {
                    x: -0.5832659522477153,
                    y: 0.4513175431123964,
                    z: 0.28022041929249414
                },
                position: {
                    x: 68.79903504601936,
                    y: 218.79396932448483,
                    z: 432.0475129782785
                },
                duration: 4000
            });
            // wait a short time so the CLH test pattern can be seen, then start drawing the console
            await sleep(300);
            app.updateConsole = app.writeToConsole;

            sfx.boot.play();

            // let the camera zoom in for a while before moving on to displaying text on screen
            await sleep(1000);

            app.cmd = "LOADING...";
            app.cmd += "\n\nTESTING ROUTINE\nINITIATED.";
            app.cmd += "\n\nType PLAY";

            await camTween;

            sfx.menuMusic.play();

            app.showTitle = true;

            //await sleep(app.typingTime(app.cmd));

            app.cmd += "\n";

            app.onResult = async result => {
                if (result.cmd.toLowerCase() === "play") {
                    app.onResult = _.noop();
                    app.allowTyping = false;
                    app.showTitle = false;
                    app.cmd = "";
                    sfx.boot.fade(sfx.boot.originalVolume, 0, 600);
                    sfx.menuMusic.fade(sfx.menuMusic.originalVolume, 0, 600);
                    await sleep(200);
                    app.toState(STATES.play);
                } else if (result.cmd.toLowerCase() === "leaderboard") {
                    app.onResult = _.noop();
                    app.allowTyping = false;
                    app.showTitle = false;
                    app.cmd = "";
                    sfx.boot.fade(sfx.boot.originalVolume, 0, 600);
                    sfx.menuMusic.fade(sfx.menuMusic.originalVolume, 0, 600);
                    await sleep(200);
                    app.toState(STATES.leaderboard);
                } else {
                    app.cmd += "\nType PLAY\n";
                }
            };

            app.allowTyping = true;
        }
    },
    [STATES.play]: {
        enter: async function() {
            // make font appropriate size for when camera is zoomed in
            consoleCanvas.conf.FONT_SIZE = 4 * 48;
            controls.enabled = false;

            // log play count
            let playCount = localStorage.getItem("clhPlayCount");
            playCount++;
            localStorage.setItem("clhPlayCount", playCount);

            // wait for Enter to be pressed and then start the countdown
            app.onKeyPress = async ev => {
                // don't let any other event handlers run
                ev.preventDefault();
                ev.stopPropagation();

                if (ev.keyCode === keyCodes.enter) {
                    app.onKeyPress = _.noop;
                    showGolden();
                }
            };

            // Keep a record of entered valid commands
            let enteredValidCmds = [];

            app.cmd = "\nEntering game...";

            app.goldenCommands = app.pickGoldenCommands();

            // play golden command music
            sfx.play.play("golden");

            await tweenCamera(camera, {
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                position: {
                    x: -4.336209717881005,
                    y: 39.566049707444186,
                    z: 155.4934617372831
                }
            });

            app.cmd = `You have ${config.GAME_DURATION /
                1000} seconds to enter ANY
of the following:

- bash shell commands & linux built-ins
- JavaScript keywords, objects, functions
- Python keywords, objects, functions
- HTML5 tags
- Ansible modules or task level parameters

Press Enter to continue.`;

            async function showGolden() {
                // wait for Enter to be pressed and then start the countdown
                app.onKeyPress = async ev => {
                    // don't let any other event handlers run
                    ev.preventDefault();
                    ev.stopPropagation();

                    if (ev.keyCode === keyCodes.enter) {
                        app.onKeyPress = _.noop;
                        startPlaying();
                    }
                };

                app.cmd = `\nThese commands are worth ${
                    config.SCORE_GOLDEN_COMMAND_MULTIPLIER
                }x BONUS points:\n\n`;
                app.cmd += app.printGoldenCommands();
                app.cmd += "\nPress Enter to begin.";
            }

            async function startPlaying() {
                app.cmd = "\nGet ready to enter commands... ";
                await sleep(1000);
                let countdown = 3;
                while (countdown--) {
                    app.cmd += `${1 + countdown} `;
                    sfx.timerRelaxed.play();
                    await sleep(1000);
                }
                sfx.timerUrgent.play();

                const blankChars = _.times(
                    Math.floor(consoleCanvas.conf.PLAY_CHARS_PER_LINE / 2 - 2),
                    _.constant(" ")
                ).join("");
                const blankLines = _.times(
                    Math.floor(consoleCanvas.conf.MAX_LINES / 2),
                    _.constant("\n")
                ).join("");
                app.cmd = `${blankChars}TYPE!${blankLines}`;
                app.onResult = async result => {
                    if (
                        result.valid &&
                        !enteredValidCmds.includes(result.cmd)
                    ) {
                        let cmdScore = config.SCORE_PER_COMMAND;

                        app.cmd += ` ✔  [${result.lang.join(" ")}]`;

                        // See if the command entered was a golden command
                        if (app.goldenCommands.all.includes(result.cmd)) {
                            console.log("GOLDEN COMMAND ENTERED!");
                            sfx.cmdGold.play();

                            // Give BIG bonus for golden commands
                            cmdScore *= config.SCORE_GOLDEN_COMMAND_MULTIPLIER;
                        } else {
                            sfx.cmdGood.play();
                        }

                        // Increase score
                        app.score +=
                            (cmdScore + result.cmd.length) *
                            config.SCORE_OVERALL_MULTIPLIER;

                        // Keep log of entered valid commands
                        enteredValidCmds.push(result.cmd);

                        // Valid command increment counters
                        app.count.totalValidCommands++;
                        app.count.totalValidCharacters += result.cmd.length;
                        app.count.recentValidCharacters += result.cmd.length;
                    } else {
                        if (
                            result.valid &&
                            enteredValidCmds.includes(result.cmd)
                        ) {
                            app.cmd += " x  [duplicate]";
                        } else {
                            app.cmd += " x";
                        }

                        sfx.cmdBad.play();
                    }

                    // if the command submitted is not empty string, add a newline
                    app.cmd += "\n";

                    console.log(
                        `entered "${result.cmd}"... it's ${
                            result.valid ? "valid!" : "invalid :("
                        }`
                    );
                };

                app.allowTyping = true;

                // play gameplay music command music
                // sfx.play.fade(1, 0, 600, "golden");
                sfx.play.stop();
                sfx.play.play("playing");

                // Reset fire delay timer
                allowFire = false;
                setTimeout(() => (allowFire = true), config.FIRE_DELAY_BEFORE);

                await sleep(1000);

                app.showScore = true;

                app.timer = config.GAME_DURATION / 1000;
                const iid = setInterval(() => {
                    app.timer -= 1;

                    // play a sound for the last few seconds of the timer

                    if (app.timer <= 10 && app.timer >= 3) {
                        sfx.timerRelaxed.play();
                    } else if (app.timer < 3) {
                        sfx.timerUrgent.play();
                    }
                    if (app.timer <= 0) {
                        clearInterval(iid);
                    }
                }, 1000);

                const fireInterval = setInterval(() => {
                    // See if we need to turn up the FIRE!
                    let cps =
                        app.count.recentValidCharacters /
                        (config.FIRE_CHECK_INTERVAL / 1000);
                    console.log(
                        "CPS:",
                        cps,
                        "Recent Valid:",
                        app.count.recentValidCharacters
                    );
                    let stage;

                    if (allowFire && cps >= config.FIRE_CPS_THRESHOLD) {
                        stage = fire.userData.stage + 1;
                        setFireStage(stage); // go up a stage
                    } else if (cps < config.FIRE_CPS_THRESHOLD) {
                        stage = fire.userData.stage - 1;
                        setFireStage(stage); // go down a stage
                    }

                    console.log("Set fire stage:", stage);

                    app.count.recentValidCharacters = 0;

                    if (app.timer <= 0) {
                        clearInterval(fireInterval);
                        setFireStage(config.FIRE_STAGE_ZERO);
                    }
                }, config.FIRE_CHECK_INTERVAL);

                console.log("starting game timer");
                await sleep(app.gameDuration);
                console.log("game timer o'er");

                sfx.play.fade(sfx.play.originalVolume, 0, 600);

                app.cmd = "";
                app.showScore = false;
                app.onResult = _.noop();
                app.allowTyping = false;
                app.toState(STATES.score);
            }
        }
    },
    [STATES.score]: {
        enter: async function() {
            app.allowTyping = false;

            controls.enabled = true;

            // Make sure fire is off
            setFireStage(config.FIRE_STAGE_ZERO);

            // Get current leaders
            leaders = await leaderboard.get();

            await tweenCamera(camera, {
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                position: {
                    x: -4.336209717881005,
                    y: 39.566049707444186,
                    z: 255.4934617372831
                }
            });

            await sleep(500);

            // make font appropriate size for when camera is zoomed in
            consoleCanvas.conf.FONT_SIZE = 4 * 90;
            app.cmd = "THANKS FOR PLAYING!\n\n";
            app.cmd += `SCORE       ${app.score}\n`;
            app.cmd += `BASH        ${app.count.bash}\n`;
            app.cmd += `PYTHON      ${app.count.py}\n`;
            app.cmd += `JAVASCRIPT  ${app.count.js}\n`;
            app.cmd += `HTML5       ${app.count.html}\n`;
            // app.cmd += `ANSIBLE     ${app.count.ansible}\n`;

            app.cmd += `\nPress Enter to continue.`;

            // when any key is pressed, go back to the title screen
            app.onKeyPress = async ev => {
                // don't let any other event handlers run
                ev.preventDefault();
                ev.stopPropagation();

                if (ev.keyCode === keyCodes.enter) {
                    app.onKeyPress = _.noop;
                    app.cmd = "";

                    if (leaders.isEmpty || app.score > leaders.lowestHiScore) {
                        app.toState(STATES.highscore);
                    } else {
                        app.toState(STATES.leaderboard);
                    }
                }
            };
        }
    },
    [STATES.highscore]: {
        enter: async function() {
            app.allowTyping = false;
            app.showTitle = false;

            controls.enabled = true;

            // make font appropriate size
            consoleCanvas.conf.FONT_SIZE = 4 * 90;

            // Only tween if the camera is not close enough to screen
            if (Math.floor(camera.position.z) !== 255) {
                await tweenCamera(camera, {
                    rotation: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    position: {
                        x: -4.336209717881005,
                        y: 39.566049707444186,
                        z: 255.4934617372831
                    }
                });
            }

            if (app.score > leaders.topHiScore) {
                app.cmd = "Top Score!\n";
                console.log("New top score!", app.score);
            } else {
                app.cmd = "New High Score!\n";
                console.log("New high score", app.score);
            }

            app.cmd += "\nEnter your name";

            await sleep(app.typingTime(app.cmd));

            app.allowTyping = true;
            app.cmd += "\n";

            app.onResult = async result => {
                if (result.cmd.length > 0 && result.cmd !== ">") {
                    app.onResult = _.noop();
                    app.allowTyping = false;
                    let name = result.cmd;
                    let tribe = deriveTribe();

                    // truncate name to max size
                    name = name.substring(0, config.MAX_LEADER_NAME_LENGTH);

                    // Store score and name pair in localStorage
                    console.log("leader name: ", result.cmd);

                    // this is an async function but we don't `await` it
                    // because it's totally fine for it to run in the
                    // background
                    leaderboard.record({
                        name: name,
                        score: app.score,
                        tribe: tribe
                    });

                    app.cmd = "";

                    await sleep(200);
                    app.toState(STATES.leaderboard);
                } else {
                    app.cmd += "\nEnter your name\n";
                }
            };
        }
    },
    [STATES.leaderboard]: {
        enter: async function() {
            app.allowTyping = false;
            app.showTitle = false;

            controls.enabled = true;

            // Make smaller font size
            consoleCanvas.conf.FONT_SIZE = 4 * 48;

            // Only tween if the camera is not close enough to screen
            if (Math.floor(camera.position.z) !== 155) {
                await tweenCamera(camera, {
                    rotation: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    position: {
                        x: -4.336209717881005,
                        y: 39.566049707444186,
                        z: 155.4934617372831
                    }
                });
            }

            // Fetch current leaders
            leaders = await leaderboard.get();

            app.cmd = "HIGH SCORES\n\n";

            if (leaders.isEmpty) {
                app.cmd += "None found!";
            } else {
                app.cmd += app.printHighScores(leaders.leaders);
            }

            app.cmd += `\nPress Enter to continue.`;

            // when any key is pressed, go back to the title screen
            app.onKeyPress = async ev => {
                // don't let any other event handlers run
                ev.preventDefault();
                ev.stopPropagation();

                if (ev.keyCode === keyCodes.enter) {
                    app.onKeyPress = _.noop;
                    app.cmd = "";
                    app.toState(STATES.title);
                }
            };
        }
    }
};
window.states = states;

async function start() {
    // Init localStorage
    leaderboard.init();

    if (localStorage.getItem("clhPlayCount") === null) {
        localStorage.setItem("clhPlayCount", "0");
    }

    // set up a state change listener so when the Vue app changes state, we
    // also run the 3D world state changes.
    app.onStateChange = change => {
        console.log(`state change: ${change.from} -> ${change.to}`);
        if (states[change.to]) {
            states[change.to].enter();
        } else {
            throw new Error(`tried to enter nonexistant state ${change.to}`);
        }
    };

    await init();
    animate(0);

    app.toState(STATES.title);
}

async function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color(
        0.52164000272751 / 4.3,
        0.08910000324249 / 4.3,
        0.81000000238419 / 4.3
    );

    // camera

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        20000
    );
    // camera.position.z = 350;
    camera.position.z = 2000;
    camera.position.y = 300;
    scene.add(camera);

    controls = new THREE.OrbitControls(camera);
    controls.enabled = false;
    // controls = new THREE.TrackballControls(camera);

    // lighting

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // spotlights

    const SHADOW_MAP_WIDTH = 1024 * 2,
        SHADOW_MAP_HEIGHT = 1024 * 2;
    const whiteSpot = new THREE.SpotLight(0xffffff, 1.0);
    whiteSpot.position.set(-300, 600, 600);
    whiteSpot.angle = Math.PI / 8;
    whiteSpot.penumbra = 0.5;
    whiteSpot.decay = 2;
    whiteSpot.distance = 4000;
    scene.add(whiteSpot);

    const purpleSpot = new THREE.SpotLight(0xda8aff, 1.0);
    purpleSpot.position.set(200, 200, 200);
    purpleSpot.angle = Math.PI / 4;
    purpleSpot.penumbra = 0.5;
    purpleSpot.decay = 4;
    purpleSpot.distance = 2000;
    purpleSpot.castShadow = true;
    purpleSpot.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    purpleSpot.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    purpleSpot.shadow.camera.near = 200;
    purpleSpot.shadow.camera.far = 1000;
    scene.add(purpleSpot);

    // models

    // load computer

    const comp = await loadMesh(
        "assets/models/",
        "CLH_ep2_computer_high_poly.mtl",
        "CLH_ep2_computer_high_poly.obj"
    );
    // make the screen reflect a crisp image
    comp.materials.materials.screen.roughness = 0.08;
    comp.materials.materials.purple.roughness = 0.7;
    comp.object.position.y = -300;
    comp.object.position.x = 0;

    // enable shadows for each object in the set of computer meshes
    comp.object.children.forEach(c => {
        c.castShadow = true;
        c.receiveShadow = true;
    });

    comp.object.castShadow = true;
    comp.object.receiveShadow = true;

    // set up a special canvas material for the screen

    const screen = _.find(comp.object.children, {
        name: "IBM_5150_Monitor_-_glass"
    });
    screen.material = new THREE.MeshBasicMaterial();
    screen.material.map = new THREE.CanvasTexture(consoleCanvas.canvas);
    window.screen = screen;

    computer = comp.object;
    window.comp = comp;
    scene.add(comp.object);
    camera.lookAt(comp.object.position);

    // create a TEMPORARY flat plane to draw the console on.

    // the comp model we have doesnt' have UV coordinates, so we can't draw a
    // texture onto it.  for now, create a 3d plane, position it just
    // in front of the screen, and draw the console onto it.
    // (TODO: remove this once we have a comp model with UV coords)

    // get the screen position and dimensions and copy them
    screen.geometry.computeBoundingBox();
    const screenSize = {
        width:
            screen.geometry.boundingBox.max.x -
            screen.geometry.boundingBox.min.x,
        height:
            screen.geometry.boundingBox.max.y -
            screen.geometry.boundingBox.min.y
    };

    const consolePlaneGeo = new THREE.PlaneGeometry(
        screenSize.width,
        screenSize.height
    );
    const consolePlane = new THREE.Mesh(consolePlaneGeo, screen.material);
    consolePlane.position.set(-5.5, 42.8, 26);
    consolePlane.rotation.x = -0.16;

    // Fixes bug where slight sliver was hollow at bottom of console
    consolePlane.scale.x = 1.012;
    consolePlane.scale.y = 1.012;

    screen.visible = false;
    window.consolePlane = consolePlane;

    scene.add(consolePlane);

    // Fire
    firePlane = new THREE.PlaneBufferGeometry(
        screenSize.width * 3.7,
        screenSize.height * 3.7
    );
    fire = new THREE.Fire(firePlane, {
        textureWidth: 512,
        textureHeight: 512,
        debug: false
    });
    let texture = new THREE.TextureLoader().load(
        "assets/images/monitor_fire_inner.png"
    );
    texture.needsUpdate = true;
    fire.clearSources();
    fire.setSourceMap(texture);
    fire.position.set(-5.5, 42.8, 25.5);
    fire.rotation.x = -0.16;
    setFireStage(config.FIRE_STAGE_ZERO);
    scene.add(fire);
    window.fire = fire;

    // load cyc wall

    const cyc = await loadMesh(
        "assets/models/",
        "CLH_ep2_cyc_wall.mtl",
        "CLH_ep2_cyc_wall.obj"
    );
    window.cyc = cyc.object;
    cyc.object.position.y = 50;
    cyc.object.children[0].castShadow = true;
    cyc.object.children[0].receiveShadow = true;
    cyc.materials.materials.purple.metalness = 0.7;
    cyc.materials.materials.purple.roughness = 1.0;
    scene.add(cyc.object);

    // init renderer

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#game-canvas"),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    document.addEventListener("mousemove", onDocumentMouseMove, false);

    window.addEventListener("resize", onWindowResize, false);
    console.log("init complete");
}

function deriveTribe() {
    let cmdCounts = [
        { tribe: "bash", count: app.count.bash },
        { tribe: "Python", count: app.count.py },
        { tribe: "JavaScript", count: app.count.js },
        { tribe: "HTML", count: app.count.html }
        // { tribe: "Ansible", count: app.count.ansible }
    ];

    const tribesSorted = _.reverse(_.sortBy(cmdCounts, "count"));

    return tribesSorted[0].tribe;
}

function getFireScaleByStage(stage) {
    let scale = {};
    let one = config.FIRE_STAGE_ONE_SCALE;
    let two = config.FIRE_STAGE_TWO_SCALE;
    let three = config.FIRE_STAGE_THREE_SCALE;

    if (isLowFPS) {
        one = config.FIRE_LOW_FPS_STAGE_ONE_SCALE;
        two = config.FIRE_LOW_FPS_STAGE_TWO_SCALE;
        three = config.FIRE_LOW_FPS_STAGE_THREE_SCALE;
    }

    switch (stage) {
        case config.FIRE_STAGE_ZERO:
            scale.x = 0.1;
            scale.y = 0.1;
            break;
        case config.FIRE_STAGE_ONE:
            scale.x = one.x;
            scale.y = one.y;
            break;
        case config.FIRE_STAGE_TWO:
            scale.x = two.x;
            scale.y = two.y;
            break;
        case config.FIRE_STAGE_THREE:
            scale.x = three.x;
            scale.y = three.y;
            break;
        default:
            scale.x = 0.1;
            scale.y = 0.1;
    }

    if (stage > config.FIRE_STAGE_THREE) {
        scale.x = 1;
        scale.y = 1;
    }

    return scale;
}

function setFireStage(stage) {
    if (stage > config.FIRE_STAGE_THREE) stage = config.FIRE_STAGE_THREE;
    else if (stage < 0) stage = 0;

    if (fire.userData.stage === stage) return; // already on this stage

    if (fire.userData.stage === undefined) fire.userData.stage = 0;

    if (!isLowFPS) {
        fire.color1.set(config.FIRE_COLOR_1);
        fire.color2.set(config.FIRE_COLOR_2);
        fire.color3.set(config.FIRE_COLOR_3);
        fire.windVector.y = config.FIRE_WIND_VECTOR_Y;
        fire.colorBias = config.FIRE_COLOR_BIAS;
        fire.burnRate = config.FIRE_BURN_RATE;
        fire.diffuse = config.FIRE_DIFFUSE;
        fire.viscosity = config.FIRE_VISCOSITY;
        fire.expansion = config.FIRE_EXPANSION;
        fire.swirl = config.FIRE_SWIRL;
        fire.drag = config.FIRE_DRAG;
        fire.airSpeed = config.FIRE_AIR_SPEED;
        fire.speed = config.FIRE_SPEED;
    } else {
        fire.color1.set(config.FIRE_LOW_FPS_COLOR_1);
        fire.color2.set(config.FIRE_LOW_FPS_COLOR_2);
        fire.color3.set(config.FIRE_LOW_FPS_COLOR_3);
        fire.windVector.y = config.FIRE_LOW_FPS_WIND_VECTOR_Y;
        fire.colorBias = config.FIRE_LOW_FPS_COLOR_BIAS;
        fire.burnRate = config.FIRE_LOW_FPS_BURN_RATE;
        fire.diffuse = config.FIRE_LOW_FPS_DIFFUSE;
        fire.viscosity = config.FIRE_LOW_FPS_VISCOSITY;
        fire.expansion = config.FIRE_LOW_FPS_EXPANSION;
        fire.swirl = config.FIRE_LOW_FPS_SWIRL;
        fire.drag = config.FIRE_LOW_FPS_DRAG;
        fire.airSpeed = config.FIRE_LOW_FPS_AIR_SPEED;
        fire.speed = config.FIRE_LOW_FPS_SPEED;
    }

    if (stage === config.FIRE_STAGE_ZERO) fire.userData.on = false;

    const stageScale = getFireScaleByStage(stage);
    let steps = Math.abs(fire.userData.stage - stage);
    console.log("stageScale:", stageScale);
    console.log("steps:", steps);

    new TWEEN.Tween(fire.scale)
        .to(
            { x: stageScale.x, y: stageScale.y },
            steps * config.FIRE_STAGE_TWEEN_TIME
        )
        .easing(TWEEN.Easing.Quartic.InOut) // Use an easing function to make the animation smooth.
        .start();

    fire.userData.stage = stage;
}
window.setFireStage = setFireStage;

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 2;
    mouseY = (event.clientY - windowHalfY) / 2;
}

function animate(time) {
    // FPS tracking
    let maximumFrameTime = config.MAX_FRAME_TIME;
    t = performance.now();
    let elapsed = t - previousTime;
    previousTime = t;

    if (elapsed > maximumFrameTime) {
        slowCount++;
    }

    if (slowCount > maxSlowFrames && !isLowFPS) {
        // This client has slow FPS currently
        console.log("Low FPS detected: ", 1000 / elapsed, "FPS");
        isLowFPS = true;
    }

    requestAnimationFrame(animate);
    render(time);
}

function render(time) {
    stats.begin();

    TWEEN.update(time);

    // update the canvas-based material
    screen.material.map.needsUpdate = true;

    app.updateConsole();

    renderer.render(scene, camera);

    stats.end();
}

function setInstuctionsDisplay(display) {
    let instructions = document.getElementById("instructions");
    let langs = document.getElementById("langs");
    let tagline = document.getElementById("tagline");
    let listen = document.getElementById("listen");

    instructions.style.display = display;
    langs.style.display = display;
    tagline.style.display = display;
    listen.style.display = display;
}
window.setInstuctionsDisplay = setInstuctionsDisplay;

function setCreditsDisplay(display) {
    let credits = document.getElementById("credits");
    credits.style.display = display;
}
window.setCreditsDisplay = setCreditsDisplay;

function showCredits() {
    setInstuctionsDisplay("none");
    setCreditsDisplay("block");
}
window.showCredits = showCredits;

function showInstructions() {
    setInstuctionsDisplay("block");
    setCreditsDisplay("none");
}
window.showInstructions = showInstructions;

if (isMobile.any) {
    console.log("aborting init, can't run on mobile");
} else {
    start();
}

// disables right click in game to prevent the context menu from inturrupting game play
window.addEventListener("contextmenu", event => event.preventDefault());
