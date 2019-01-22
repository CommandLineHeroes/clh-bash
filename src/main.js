import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/controls/OrbitControls.js";
import "../node_modules/three/examples/js/controls/TrackballControls.js";
import "./MTLLoaderPhysical.js";
import app from "./app.js";
import tweenCamera from "./tween-camera.js";
import { loadMesh } from "./three-utils.js";
import STATES from "./states.js";

let container;
let camera, scene, renderer, controls;
let mouseX = 0,
    mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let computer;
let cameraDestination = {
    percent: 0,
    distance: 0,
    rotation: new THREE.Vector3(),
    position: new THREE.Vector3()
};

let stats = new Stats();
document.body.appendChild(stats.dom);

const states = {
    title: {
        enter: function() {
            return new Promise((resolve, reject) => {
                // TODO show other title state stuff like text, logo, etc.

                tweenCamera(camera, {
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
                    duration: 4000,
                    easing: TWEEN.Easing.Quartic.InOut
                });
            });
        }
    },
    play: {
        enter: async function() {
            return new Promise((resolve, reject) => {
                // TODO show other play state stuff like game logic, score, ghosty, etc.

                tweenCamera(camera, {
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
            });
        }
    }
};
window.states = states;

async function start() {
    // fetch the commands database
    const rsp = await fetch("../assets/commands.json");
    const commands = await rsp.json();

    app.commands = commands;

    app.onValidCmd = function(cmd) {
        console.log(`woot, ${cmd.cmd} is valid!  update three.js!`);
    };

    app.onInvalidCmd = function(cmd) {
        console.log(`bah, ${cmd} is invalid!  update three.js!`);
    };

    await init();
    animate(0);

    // example of using await with state entry
    await states.title.enter();
    // await states.play.enter();
    // console.log("play state ready");
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
    const whiteSpotDistance = 400;
    const whiteSpot = new THREE.SpotLight(0xffffff, 1.0);
    whiteSpot.position.set(
        -whiteSpotDistance,
        whiteSpotDistance,
        whiteSpotDistance
    );
    whiteSpot.angle = Math.PI;
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
        "../assets/models/",
        "CLH_ep2_computer_high_poly.mtl",
        "CLH_ep2_computer_high_poly.obj"
    );
    // make the screen reflect a crisp image
    comp.materials.materials.screen.roughness = 0.08;
    comp.materials.materials.purple.roughness = 0.8;
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

    computer = comp.object;
    window.comp = comp;
    scene.add(comp.object);
    camera.lookAt(comp.object.position);

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

    renderer.render(scene, camera);

    stats.end();
}

start();
