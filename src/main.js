import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/controls/OrbitControls.js";
import "../node_modules/three/examples/js/controls/TrackballControls.js";
import "./MTLLoaderPhysical.js";
import palette from "./palette.js";
import app from "./app.js";
import tweenCamera from "./tween-camera.js";
import keyCodes from "./keycodes.js";
import { loadMesh } from "./three-utils.js";
import STATES from "./states.js";
import sleep from "./sleep.js";
import consoleCanvas from "./console-canvas.js";
import sfx from "./sfx.js";

let container;
let camera, scene, renderer, controls;
let mouseX = 0,
    mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let computer;

let stats = new Stats();
document.body.appendChild(stats.dom);

const states = {
    [STATES.title]: {
        enter: async function() {
            // TODO show other title state stuff like text, logo, etc.

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

            // let the camera zoom in for a while before moving on to displaying text on screen
            await sleep(1500);

            app.cmd = "LOADING...\n";

            await camTween;

            app.showTitle = true;

            app.cmd += "Type 'play'...\n";

            app.allowTyping = true;

            app.onResult = async result => {
                if (result.cmd.toLowerCase() == "play") {
                    app.onResult = _.noop();
                    app.allowTyping = false;
                    app.showTitle = false;
                    app.cmd = "\nEntering game...";
                    await sleep(200);
                    app.toState(STATES.play);
                } else {
                    app.cmd += "\nType 'play'...\n";
                }
            };
        }
    },
    [STATES.play]: {
        enter: async function() {
            // TODO show other play state stuff like game logic, score, ghosty, etc.

            // make font appropriate size for when camera is zoomed in
            consoleCanvas.conf.FONT_SIZE = 4 * 48;

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

            app.cmd = "Type as many commands as you can in one minute!\n";
            app.cmd += "\nChoose from the following.";
            app.cmd += "\n - any HTML tag";
            app.cmd += "\n - any Python keyword";
            app.cmd += "\n - any JavaScript keyword";
            app.cmd += "\n - any Bash built-in command";
            app.cmd += "\n\nBegin in... ";
            await sleep(500);
            app.cmd += "3 ";
            await sleep(500);
            app.cmd += "2 ";
            await sleep(500);
            app.cmd += "1 ";
            await sleep(500);
            app.cmd += "GO!\n";

            app.allowTyping = true;

            app.onResult = async result => {
                app.cmd += result.valid ? " ✔" : " ⨯";
                // if the command submitted is not empty string, add a newline
                app.cmd += "\n";
                if (result.valid) {
                    sfx.cmdGood.play();
                    app.score += 10;
                } else {
                    sfx.cmdBad.play();
                }
                console.log(
                    `entered "${result.cmd}"... it's ${
                        result.valid ? "valid!" : "invalid :("
                    }`
                );
            };

            app.timer = app.gameDuration / 1000;
            const iid = setInterval(() => {
                app.timer -= 1;
                if (app.timer <= 0) {
                    clearInterval(iid);
                }
            }, 1000);

            console.log("starting game timer");
            await sleep(app.gameDuration);
            console.log("game timer o'er");

            app.cmd = "";
            app.onResult = _.noop();
            app.allowTyping = false;
            app.toState(STATES.score);
        }
    },
    [STATES.score]: {
        enter: async function() {
            app.allowTyping = false;

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
            app.cmd += `JavaScript: ${app.count.js}\n`;
            app.cmd += `HTML: ${app.count.html}\n`;
            app.cmd += `Python: ${app.count.py}\n`;
            app.cmd += `Bash: ${app.count.bash}\n`;

            app.cmd += `Press Enter to continue.`;

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
    // const envMap = new THREE.CubeTextureLoader()
    //     .setPath("../assets/textures/")
    //     .load([
    //         "wall.png",
    //         "wall.png",
    //         "wall.png",
    //         "wall.png",
    //         "wall.png",
    //         "wall.png"
    //     ]);
    // scene.background = envMap;
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

    // controls = new THREE.OrbitControls(camera);
    controls = new THREE.TrackballControls(camera);

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
    // whiteSpot.castShadow = true;
    // whiteSpot.shadow.mapSize.width = 1 * SHADOW_MAP_WIDTH;
    // whiteSpot.shadow.mapSize.height = 1 * SHADOW_MAP_HEIGHT;
    // whiteSpot.shadow.camera.near = 10;
    // whiteSpot.shadow.camera.far = 2000;
    // whiteSpot.add(new THREE.SpotLightHelper(whiteSpot));
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
    // purpleSpot.add(new THREE.SpotLightHelper(purpleSpot));
    scene.add(purpleSpot);

    // models

    // load computer

    const comp = await loadMesh(
        "/assets/models/",
        "CLH_ep2_computer_high_poly.mtl",
        "CLH_ep2_computer_high_poly.obj"
    );
    // make the screen reflect a crisp image
    comp.materials.materials.screen.roughness = 0.08;
    comp.materials.materials.purple.roughness = 0.7;
    // comp.materials.materials.purple
    // comp.materials.materials.red
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
    consolePlane.position.set(-5.5, 42.8, 28);
    consolePlane.rotation.x = -0.16;
    screen.visible = false;
    window.consolePlane = consolePlane;

    scene.add(consolePlane);

    // load cyc wall

    const cyc = await loadMesh(
        "../assets/models/",
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

    //

    window.addEventListener("resize", onWindowResize, false);
}

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

    // controls.update();
    // computer.rotation.y += 0.01;

    // update the canvas-based material
    screen.material.map.needsUpdate = true;

    renderer.render(scene, camera);

    stats.end();
}

start();
