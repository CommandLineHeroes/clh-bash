import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/controls/OrbitControls.js";
import "./MTLLoaderPhysical.js";
import app from "./app.js";
import { loadMesh } from "./three-utils.js";
import STATES from "./states.js";

let container;
let camera, scene, renderer, controls;
let mouseX = 0,
    mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let computer;

let stats = new Stats();
document.body.appendChild(stats.dom);

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
    animate();
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
    camera.position.z = 6050;
    camera.position.y = 150;
    scene.add(camera);

    // controls = new THREE.OrbitControls(camera);
    controls = new THREE.TrackballControls(camera);

    // lighting

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // spotlights

    const SHADOW_MAP_WIDTH = 2048 * 1,
        SHADOW_MAP_HEIGHT = 2048 * 1;
    const whiteSpotDistance = 400;
    const whiteSpot = new THREE.SpotLight(0xffffff, 1);
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
    whiteSpot.shadow.mapSize.width = 1 * SHADOW_MAP_WIDTH;
    whiteSpot.shadow.mapSize.height = 1 * SHADOW_MAP_HEIGHT;
    whiteSpot.shadow.camera.near = 10;
    whiteSpot.shadow.camera.far = 2000;
    // whiteSpot.add(new THREE.SpotLightHelper(whiteSpot));
    scene.add(whiteSpot);

    const purpleSpot = new THREE.SpotLight(0xda8aff, 1);
    purpleSpot.position.set(200, 200, 200);
    purpleSpot.angle = Math.PI / 4;
    purpleSpot.penumbra = 0.5;
    purpleSpot.decay = 3;
    purpleSpot.distance = 2000;
    purpleSpot.castShadow = true;
    purpleSpot.shadow.mapSize.width = 1 * SHADOW_MAP_WIDTH;
    purpleSpot.shadow.mapSize.height = 1 * SHADOW_MAP_HEIGHT;
    purpleSpot.shadow.camera.near = 10;
    purpleSpot.shadow.camera.far = 2000;
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
    cyc.materials.materials.purple.metalness = 0;
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

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    stats.begin();

    controls.update();

    // computer.rotation.y += 0.01;

    renderer.render(scene, camera);

    stats.end();
}

start();
