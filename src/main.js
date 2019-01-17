import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/loaders/MTLLoader.js";
import app from "./app.js";
import STATES from "./states.js";

let container;
let camera, scene, renderer;
let mouseX = 0,
    mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let computer;

let stats = new Stats();
document.body.appendChild( stats.dom );

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
    camera.position.z = 350;

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

    let ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    let pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.x = -300;
    pointLight.position.y = 300;
    pointLight.position.z = 300;
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

            for (let mat in materials.materials) {
                // do stuff to each material
                materials.materials[mat].envMap = envMap;
            }

            new THREE.OBJLoader()
                .setMaterials(materials)
                .setPath("../assets/models/")
                .load(
                    "CLH_ep2_computer_high_poly.obj",
                    function(object) {
                        object.position.y = -300;
                        object.position.x = 0;
                        computer = object;
                        scene.add(object);
                    },
                    onProgress,
                    onError
                );
        });

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

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;

    camera.lookAt(scene.position);

    renderer.render(scene, camera);

    stats.end();
}

start();
