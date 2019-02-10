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

let stats = new Stats();
// document.body.appendChild(stats.dom);

const states = {
    [STATES.title]: {
        enter: async function() {
            app.updateConsole = _.noop;
            app.resetState();
            app.typingLoop();
            app.cmd = "";

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

            await sleep(app.typingTime(app.cmd));

            app.allowTyping = true;
            app.cmd += "\n";

            app.onResult = async result => {
                if (result.cmd.toLowerCase() == "play") {
                    app.onResult = _.noop();
                    app.allowTyping = false;
                    app.showTitle = false;
                    app.cmd = "";
                    sfx.boot.fade(sfx.boot.originalVolume, 0, 600);
                    sfx.menuMusic.fade(sfx.menuMusic.originalVolume, 0, 600);
                    await sleep(200);
                    app.toState(STATES.play);
                } else {
                    app.cmd += "\nType PLAY\n";
                }
            };
        }
    },
    [STATES.play]: {
        enter: async function() {
            // make font appropriate size for when camera is zoomed in
            consoleCanvas.conf.FONT_SIZE = 4 * 48;
            controls.enabled = true;

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

            app.cmd = `You have ${
                (config.GAME_DURATION / 1000)
                } seconds to enter ANY commands\n\n`;
            app.cmd += app.printGoldenCommands();
            app.cmd += `\nCommands listed are worth ${
                config.SCORE_GOLDEN_COMMAND_MULTIPLIER
            }x BONUS points.\n`;
            app.cmd += "\nPress Enter to begin.";

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

            async function startPlaying() {
                app.cmd += "\nGet ready to enter commands... ";
                await sleep(1000);
                let countdown = 5;
                while (countdown--) {
                    app.cmd += `${1 + countdown} `;
                    // play a sound for the last few seconds of the timer
                    if (countdown > 0) {
                        sfx.timerRelaxed.play();
                    } else {
                        sfx.timerUrgent.play();
                    }
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
                app.allowTyping = true;

                // play gameplay music command music
                // sfx.play.fade(1, 0, 600, "golden");
                sfx.play.stop();
                sfx.play.play("playing");

                // Reset fire delay timer
                allowFire = false;
                setTimeout(() => (allowFire = true), config.DELAY_BEFORE_FIRE);

                await sleep(1000);

                app.showScore = true;

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

                app.timer = config.GAME_DURATION / 1000;
                const iid = setInterval(() => {
                    app.timer -= 1;

                    // See if we need to turn up the FIRE!
                    let elapsedTime = config.GAME_DURATION / 1000 - app.timer;
                    let cps = 0;
                    if (elapsedTime > 0)
                        cps = app.count.totalValidCharacters / elapsedTime;
                    console.log(
                        elapsedTime,
                        app.count.totalValidCharacters,
                        cps
                    );
                    if (allowFire && cps >= config.FIRE_CPS_THRESHOLD) {
                        turnUpFire();
                    } else if (
                        fire.userData.on === true &&
                        cps < config.FIRE_CPS_THRESHOLD
                    ) {
                        turnDownFire();
                    }

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

                console.log("starting game timer");
                await sleep(app.gameDuration);
                console.log("game timer o'er");

                sfx.play.fade(sfx.play.originalVolume, 0, 600);

                controls.enabled = false;

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

            // Turn off Fire
            turnDownFire();

            // Get current leaders
            leaders = fetchLeaders();

            // make font appropriate size for when camera is zoomed in
            consoleCanvas.conf.FONT_SIZE = 4 * 90;

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
            app.cmd = "GAME OVER\n";
            app.cmd += `score: ${app.score}\n`;
            app.cmd += `Bash: ${app.count.bash}\n`;
            app.cmd += `Python: ${app.count.py}\n`;
            app.cmd += `JavaScript: ${app.count.js}\n`;
            app.cmd += `HTML: ${app.count.html}\n`;

            app.cmd += `Press Enter to continue.`;

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
                    }
                    else {
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
            }
            else {
                app.cmd = "New High Score!\n";
                console.log("New high score", app.score);
            }

            app.cmd += "\nEnter your name";

            await sleep(app.typingTime(app.cmd));

            app.allowTyping = true;
            app.cmd += "\n";

            app.onResult = async result => {
                if (result.cmd.length > 0 && result.cmd !== '>') {
                    app.onResult = _.noop();
                    app.allowTyping = false;

                    // Store score and name pair in localStorage
                    console.log("leader name: ", result.cmd);
                    let leaders = JSON.parse(localStorage.getItem("clhLeaders"));
                    leaders.push({name: result.cmd, score: app.score});
                    localStorage.setItem("clhLeaders", JSON.stringify(leaders));

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

            app.cmd = app.printHighScores();

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
    if (localStorage.getItem("clhLeaders") === null) {
        // Create new leaders object
        localStorage.setItem("clhLeaders", JSON.stringify([]));
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
    purpleSpot.shadow.mapSize.width = 1 * SHADOW_MAP_WIDTH;
    purpleSpot.shadow.mapSize.height = 1 * SHADOW_MAP_HEIGHT;
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
    screen.visible = false;
    window.consolePlane = consolePlane;

    scene.add(consolePlane);

    // Fire
    firePlane = new THREE.PlaneBufferGeometry(
        screenSize.width * 1.2,
        screenSize.height * 1.2
    );
    fire = new THREE.Fire(firePlane, {
        textureWidth: 512,
        textureHeight: 512,
        debug: false
    });
    let texture = new THREE.TextureLoader().load(
        "assets/images/monitor_bezel_outline.png"
    );
    texture.needsUpdate = true;
    fire.clearSources();
    fire.setSourceMap(texture);
    fire.color1.set(0x00bdf7);
    fire.color2.set(0x1b3fb6);
    fire.color3.set(0x18171b);
    fire.position.set(-5.5, 42.8, 26.5);
    fire.rotation.x = -0.16;
    fire.userData.on = false;
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
}

function fetchLeaders() {
    // First get the current scores from localStorage
    let leaders = JSON.parse(localStorage.getItem('clhLeaders'));

    const hiScores = _(leaders)
        .sortBy('score')
        .reverse()
        .uniqBy('name')
        .take(10)
        .map('score')
        .value();

    const lowestHiScore = _.min(hiScores);
    const topHiScore = _.max(hiScores);

    let isEmpty = true;
    if (!Array.isArray(leaders) || !leaders.length) {
        isEmpty = true;
    }

    return {
        leaders: leaders,
        hiScores: hiScores,
        topHiScore: topHiScore,
        lowestHiScore: lowestHiScore,
        isEmpty: isEmpty,
    };
}

function turnUpFire() {
    fire.windVector.y = -0.25;
    fire.colorBias = 0.25;
    fire.burnRate = 2.6;
    fire.diffuse = 5.0;
    fire.viscosity = 0.5;
    fire.expansion = 0.75;
    fire.swirl = 30.0;
    fire.drag = 0.0;
    fire.airSpeed = 40.0;
    fire.speed = 500.0;
    fire.userData.on = true;
    scene.add(fire);
}
window.turnUpFire = turnUpFire;

function turnDownFire() {
    new TWEEN.Tween(fire)
        .to({ airSpeed: 50, burnRate: 10, speed: 1000, expansion: -0.6 }, 2000)
        .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth.
        .onComplete(() => {
            fire.userData.on = false;
            scene.remove(fire);
        })
        .start();
}
window.turnDownFire = turnDownFire;

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
window.setInstuctionsDisplay=setInstuctionsDisplay;

function setCreditsDisplay(display) {
    let credits = document.getElementById("credits");
    credits.style.display = display;
}
window.setCreditsDisplay=setCreditsDisplay;

function showCredits() {
    setInstuctionsDisplay('none');
    setCreditsDisplay('block');
}
window.showCredits=showCredits;

function showInstructions() {
    setInstuctionsDisplay('block');
    setCreditsDisplay('none');
}
window.showInstructions=showInstructions;

start();
