import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/loaders/MTLLoader.js";
import { map } from "../node_modules/lodash-es/lodash.js";
import app from "./app.js";
import STATES from "./states.js";

let container;
let camera, scene, renderer;
let mouseX = 0,
    mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

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

    init();
    animate();
}

function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        2000
    );
    camera.position.z = 250;

    // scene

    scene = new THREE.Scene();

    // let ambientLight = new THREE.AmbientLight(0x7537b4, 0.5);
    // scene.add(ambientLight);

    let pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.x = -100;
    pointLight.position.y = 100;
    pointLight.position.z = 100;
    camera.add(pointLight);
    scene.add(camera);

    // model

    let onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            let percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(Math.round(percentComplete, 2) + "% downloaded");
        }
    };

    let onError = function() {};

    new THREE.MTLLoader()
        .setPath("../assets/models/")
        .load("CLH_ep2_computer_high_poly.mtl", function(materials) {
            materials.preload();

            new THREE.OBJLoader()
                .setMaterials(materials)
                .setPath("../assets/models/")
                .load(
                    "CLH_ep2_computer_high_poly.obj",
                    function(object) {
                        object.position.y = -250;
                        object.position.x = 0;
                        scene.add(object);
                    },
                    onProgress,
                    onError
                );
        });

    //

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#game-canvas"),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 500;

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
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

start();
