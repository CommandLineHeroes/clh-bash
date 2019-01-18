import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/loaders/MTLLoader.js";
import "../node_modules/three/examples/js/controls/OrbitControls.js";
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
    const envMap = new THREE.CubeTextureLoader()
        .setPath("../assets/textures/")
        .load([
            "wall.png",
            "wall.png",
            "wall.png",
            "wall.png",
            "wall.png",
            "wall.png"
        ]);
    scene.background = envMap;

    // camera

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        20000
    );
    camera.position.z = 350;
    camera.position.y = 100;
    scene.add(camera);

    controls = new THREE.OrbitControls(camera);

    // lighting

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    let pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.x = -300;
    pointLight.position.y = 500;
    pointLight.position.z = 500;
    camera.add(pointLight);

    // 218
    // 138
    // 255

    // models

    // load computer

    const comp = await loadMesh(
        "../assets/models/",
        "CLH_ep2_computer_high_poly.mtl",
        "CLH_ep2_computer_high_poly.obj"
    );
    // comp.materials.materials.screen.envMap = envMap;
    // comp.materials.materials.purple
    // comp.materials.materials.red

    comp.object.position.y = -300;
    comp.object.position.x = 0;

    computer = comp.object;
    scene.add(comp.object);
    camera.lookAt(comp.object.position);

    // load cyc wall

    const cyc = await loadMesh(
        "../assets/models/",
        "CLH_ep2_cyc_wall.mtl",
        "CLH_ep2_cyc_wall.obj"
    );
    window.cyc = cyc.object;
    scene.add(cyc.object);

    // init renderer

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#game-canvas"),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

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

    // camera.lookAt(scene.position);

    renderer.render(scene, camera);

    stats.end();
}

start();
