import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/loaders/MTLLoader.js";
import { map } from "../node_modules/lodash-es/lodash.js";
import app from "./app.js";
import STATES from "./states.js";

let container;
let camera, scene, renderer;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

async function start() {
    // fetch the commands database
    const rsp = await fetch("../assets/commands.json");
    const commands = await rsp.json();

    // demo of using lodash on the command database
    const commandNames = map(commands, "cmd");

    app.commands = commands;

    console.log(commandNames);

    init();
    animate();
}


function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 250;

    // scene

    scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // model

    var onProgress = function (xhr) {

        if (xhr.lengthComputable) {

            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');

        }

    };

    var onError = function () {
    };


    new THREE.MTLLoader()
        .setPath('../assets/models/')
        .load('CLH_Computer.mtl', function (materials) {

            materials.preload();

            new THREE.OBJLoader()
                .setMaterials(materials)
                .setPath('../assets/models/')
                .load('CLH_Computer.obj', function (object) {

                    object.position.y = -250;
                    object.position.x -= 100;
                    scene.add(object);

                }, onProgress, onError);

        });

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 500;

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    //

    window.addEventListener('resize', onWindowResize, false);

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

    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * .05;

    camera.lookAt(scene.position);

    renderer.render(scene, camera);

}


start();
