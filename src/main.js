import "../node_modules/three/examples/js/loaders/OBJLoader.js";
import "../node_modules/three/examples/js/loaders/MTLLoader.js";
import "../node_modules/three/examples/js/controls/OrbitControls.js";
import "../node_modules/three/examples/js/objects/Fire.js";
import { map } from "../node_modules/lodash-es/lodash.js";
import app from "./app.js";
import STATES from "./states.js";

let container;
let camera, scene, renderer, controls;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let fire;
let computer;

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

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 25;

    // camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    // camera.position.z = 250;

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );
    scene.add( camera );

    controls = new THREE.OrbitControls(camera);

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
                    computer = object;
                    scene.add(computer);

                    let geometry = new THREE.PlaneBufferGeometry( 50, 50 );

                    computer.traverse( function ( child ) {
                        if ( child.geometry !== undefined ) {
                            geometry = child.geometry;
                        }
                    });

                    var sGeometry = new THREE.SphereGeometry( 5, 32, 32 );
                    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
                    var sphere = new THREE.Mesh( sGeometry, material );
                    scene.add( sphere );
                    camera.lookAt(sphere.position);

                    // var plane = new THREE.PlaneBufferGeometry( 50, 50 );
                    fire = new THREE.Fire( sGeometry, {
                        textureWidth: 512,
                        textureHeight: 512,
                        debug: false
                    } );
                    fire.position.z = - 2;
                    fire.color1.set( 0x00bdf7 );
                    fire.color2.set( 0x1b3fb6 );
                    fire.color3.set( 0x001869 );
                    fire.windVector.x = 0.0;
                    fire.windVector.y = - 0.25;
                    fire.colorBias = 0.25;
                    fire.burnRate = 2.6;
                    fire.diffuse = 5.0;
                    fire.viscosity = 0.5;
                    fire.expansion = 0.75;
                    fire.swirl = 30.0;
                    fire.drag = 0.0;
                    fire.airSpeed = 40.0;
                    fire.speed = 500.0;
                    fire.massConservation = false;
                    fire.clearSources();
                    fire.addSource( 0.5, 0.1, 0.1, 1.0, 0.0, 1.0 );
                    scene.add( fire );
                    camera.lookAt(fire.position);


                }, onProgress, onError);

        });

    //

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.autoClear = false;

    // renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 500;

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

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {

    renderer.clear();
    renderer.render(scene, camera);

}


start();
