import {
   Scene,
   Color,
   Box3,
   Vector3,
   PerspectiveCamera,
   WebGLRenderer,
   DirectionalLight,
   AmbientLight,
   HemisphereLight,
   PCFSoftShadowMap,
   Clock,
   AudioListener,
   Audio,
   AudioLoader,
} from './three/three.module.js';

import {GLTFLoader} from './three/GLTFLoader.js';

import {initGround}   from './entities/ground.js';
import {initStart}    from './entities/start.js';
import {initHero}     from './entities/hero.js';
import {initWalls}    from './entities/wall.js';
import {initGates}    from './entities/gate.js';
import {initCrystals} from './entities/crystal.js';
import {initBirds}    from './entities/bird.js';
import {initSpikes}   from './entities/spike.js';
import {initArrows}   from './entities/arrow.js';
import {initSlimes}   from './entities/slime.js';


let gameState = {
   level: JSON.parse(localStorage.getItem('level')) || 1,
   win: false,
   defeat: false,
   map: null
}

let missileMovement = {
   isMoving: false,
   shouldMove: false,
   direction: "up",
   delta: 0
}

let heroMovement = {
   isMoving: false,
   shouldMove: false,
   moveDirection: "up",
   isDashing: false,
   shouldDash: false,
   dashDirection: "up",
   delta: 0
}

let crystals, walls, gates, birds, spikes, arrows, slimes, heros, starts, missiles;
let start, hero, missile;
let music, killSound;

let container, chargeContainer, scene, camera, renderer;
let clock = new Clock(), delta = 0, elapsed = 0, chargeTime = 0, deployTime = 0;


function init() {
   crystals = []; walls = []; gates = []; birds = []; spikes = []; arrows = []; slimes = []; heros = []; starts = []; missiles = [];
   start = null; hero = null; missile = null;

   chargeContainer = document.querySelector('#charge');
   container = document.querySelector('#scene-container');
   document.querySelector('#crystals').innerHTML = gameState.map.crystalsNumber;
   document.querySelector('#level').innerHTML = gameState.level;
   scene = new Scene();
   scene.background = new Color(0x01C1B2);

   initGround(scene, gameState.map);
   initStart(scene, gameState.map, starts);
   initWalls(scene, gameState.map, walls);
   initGates(scene, gameState.map, gates);
   initCrystals(scene, gameState.map, crystals);
   initBirds(scene, gameState.map, birds);
   initSpikes(scene, gameState.map, spikes);
   initArrows(scene, gameState.map, arrows);
   initSlimes(scene, gameState.map, slimes);
   initHero(scene, gameState.map, heros, missiles);
   start = starts[0];

   initDecorations(scene, gameState.level);
   initLight(scene);
   initCamera();
   initRenderer();

   container.appendChild(renderer.domElement);
}

function update() {

   delta = clock.getDelta();
   elapsed = clock.getElapsedTime();
   heroMovement.delta = delta;
   missileMovement.delta = delta;
   chargeTime += delta;
   deployTime += delta;

   if (!gameState.defeat && !gameState.win && heros[0]) {
      hero = heros[0];
      missile = missiles[0];


      // CRYSTALS ==============================================================

      crystals.forEach((crystal) => {
         crystal.mesh.rotation.y += delta;
         crystal.y = 0.75 + Math.sin(elapsed * 2) / 12;

         if (crystal.x === parseFloat(hero.x) && crystal.z === parseFloat(hero.z) && crystal.alive) {
            crystal.die(scene);
            crystals = crystals.filter(el => el.alive === true);
            hero.grabCrystal(scene);
         }
      });

      hero.crystals.forEach((crystal) => {
         if (crystal.deployed && crystal.y < 15) {
            crystal.mesh.rotation.y += delta * 3;
            crystal.y += delta * 4;
         }
      });


      // MONSTERS ==============================================================

      birds.forEach((bird) => {
         bird.move(delta);
         if (Math.abs(bird.x - hero.x) < 0.45 && Math.abs(bird.z - hero.z) < 0.45 && hero.y < 1) {
            gameState.defeat = true;
            document.querySelector('.modal-container--defeat').classList.remove('invisible');
         }
      });

      spikes.forEach((spike) => {
         spike.move(delta);
         if (Math.abs(spike.x - hero.x) < 0.45 && Math.abs(spike.z - hero.z) < 0.45 && hero.y < 1) {
            gameState.defeat = true;
            document.querySelector('.modal-container--defeat').classList.remove('invisible');
         }
      });

      slimes.forEach((slime) => {
         slime.move(delta);
         if (Math.abs(slime.x - hero.x) < 0.45 && Math.abs(slime.z - hero.z) < 0.45 && hero.y < 1) {
            gameState.defeat = true;
            document.querySelector('.modal-container--defeat').classList.remove('invisible');
         }
      });


      // HERO MOVEMENT ==============================================================

      arrows.forEach((arrow) => {
         if (arrow.x === parseFloat(hero.x) && arrow.z === parseFloat(hero.z)) {
            heroMovement.shouldDash = true;
            heroMovement.dashDirection = arrow.direction;
         }
      });

      if (start.x === parseFloat(hero.x) && start.z === parseFloat(hero.z) && deployTime > 1) {
         hero.deployCrystal(scene, gameState);
         deployTime = 0;
      }

      if (heroMovement.isMoving || heroMovement.shouldMove || heroMovement.isDashing || heroMovement.shouldDash) {
         hero.move(heroMovement);
         camera.position.set(parseFloat(hero.x), 7.7, parseFloat(hero.z) + 8);
      }


      // HERO SHOOTING ==============================================================

      if (missileMovement.isMoving || missileMovement.shouldMove) {
         hero.shoot(missileMovement);
      }

      if (hero.charge < 10 && chargeTime > 0.4) {
         hero.charge++;
         chargeContainer.children[hero.charge].style.backgroundColor = "#f9f871";
         if(hero.charge === 10) chargeContainer.children[0].style.color = "#f9f871";
         chargeTime = 0;
      }

      if (missile.position.x >= 0 && missile.position.x < gameState.map.m && missile.position.z >= 0 && missile.position.z < gameState.map.n) {
         walls.forEach((wall) => {
            if (wall.x === parseFloat(missile.position.x) && wall.z === parseFloat(missile.position.z)) {
               hero.killMissile();
            }
         });
         gates.forEach((gate) => {
            if (gate.x === parseFloat(missile.position.x) && gate.z === parseFloat(missile.position.z)) {
               gate.die(scene);
               gates = gates.filter(el => el.alive === true);
               hero.killMissile();
               hero.map.gatesMap[gate.x][gate.z] = 0;
               killSound.play();
            }
         });
         birds.forEach((bird) => {
            if (Math.abs(bird.x - parseFloat(missile.position.x)) < 0.4 && Math.abs(bird.z - parseFloat(missile.position.z)) < 0.4) {
               bird.die(scene);
               birds = birds.filter(el => el.alive === true);
               hero.killMissile();
               killSound.play();
            }
         });
         slimes.forEach((slime) => {
            if (Math.abs(slime.x - parseFloat(missile.position.x)) < 0.4 && Math.abs(slime.z - parseFloat(missile.position.z)) < 0.4) {
               slime.die(scene, slimes);
               slimes = slimes.filter(el => el.alive === true);
               hero.killMissile();
               killSound.play();
            }
         });
      }
   }

   if (gameState.win && hero.y < 11) {
      hero.y += delta * 3;
      hero.mesh.rotation.y += delta * 4;
      camera.position.y += delta * 1.6;
      camera.position.z -= delta * 0.9;
      camera.rotation.x += delta * 4.9 * Math.PI / 180;
   } else if (gameState.win && gameState.level < 5 && hero.y >= 11) {
      document.querySelector('.modal-container--next').classList.remove('invisible');
      hero.y = -0.2;
   }

}

function render() {
   renderer.render(scene, camera);
}


// ============================ AUDIO CONTROL ==================================

document.querySelector('#toggle-sound').addEventListener('click', toggleSound);
document.querySelector('#toggle-music').addEventListener('click', toggleMusic);

function toggleSound() {
   if (JSON.parse(localStorage.getItem('sound'))) {
      localStorage.setItem('sound', false);
      killSound.setVolume(0);
      hero.soundOff();
      document.querySelector('#toggle-sound').style.color = '#7cb2c9';
   } else {
      localStorage.setItem('sound', true);
      killSound.setVolume(0.7);
      hero.soundOn();
      document.querySelector('#toggle-sound').style.color = '#f9f871';
   }
}
function toggleMusic() {
   if (JSON.parse(localStorage.getItem('music'))) {
      localStorage.setItem('music', false);
      music.pause();
      document.querySelector('#toggle-music').style.color = '#7cb2c9';
   } else {
      localStorage.setItem('music', true);
      music.play();
      document.querySelector('#toggle-music').style.color = '#f9f871';
   }
}


// ============================ LISTENERS ======================================

let debouncePlay = false;

function onKeyDown(event) {
   switch (event.keyCode) {
      case 38: // up
      case 87: // w
         heroMovement.shouldMove = true;
         heroMovement.moveDirection = "up";
         break;
      case 39: // right
      case 68: // d
         heroMovement.shouldMove = true;
         heroMovement.moveDirection = "right";
         break;
      case 40: // down
      case 83: // s
         heroMovement.shouldMove = true;
         heroMovement.moveDirection = "down";
         break;
      case 37: // left
      case 65: // a
         heroMovement.shouldMove = true;
         heroMovement.moveDirection = "left";
         break;
      case 16: // shift
      case 32: // space
         if (hero) {
            missileMovement.direction = hero.direction;
            missileMovement.shouldMove = true;
         }
         break;
      case 13: // enter
         play();
         break;
   }
}
function onKeyUp(event) {
   switch (event.keyCode) {
      case 38: // up
      case 87: // w
         heroMovement.shouldMove = false;
         break;
      case 37: // left
      case 65: // a
         heroMovement.shouldMove = false;
         break;
      case 40: // down
      case 83: // s
         heroMovement.shouldMove = false;
         break;
      case 39: // right
      case 68: // d
         heroMovement.shouldMove = false;
         break;
      case 16: // shift
      case 32: // space
         missileMovement.shouldMove = false;
         break;
   }
}
function onWindowResize() {
   camera.aspect = container.clientWidth / container.clientHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(container.clientWidth, container.clientHeight);
}
function onError() {
   alert("Hoporo doesn't support your browser. Try latest version of Google Chrome, Firefox, Safari or Opera.");
   return false;
}
function play () {
   if (!debouncePlay) {
      debouncePlay = true;
      if (document.querySelector('.modal-container').classList.contains("invisible") === false) {

         initAudio();
         localStorage.setItem('level', gameState.level);
         document.querySelector('.modal-container').classList.add("invisible");
         initLevel();

      } else if (document.querySelector('.modal-container--next').classList.contains("invisible") === false && gameState.level + 1 <= 5) {

         gameState.level++;
         localStorage.setItem('level', gameState.level);
         document.querySelector('.modal-container--next').classList.add("invisible");
         initLevel();

      } else if (document.querySelector('.modal-container--defeat').classList.contains("invisible") === false) {

         document.querySelector('.modal-container--defeat').classList.add("invisible");
         initLevel();

      } else if (document.querySelector('.modal-container--win').classList.contains("invisible") === false) {

         gameState.level = 1;
         localStorage.setItem('level', gameState.level);
         document.querySelector('.modal-container--win').classList.add("invisible");
         initLevel();

      }
   }

   setTimeout(() => { debouncePlay = false; }, 3000);
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('resize', onWindowResize);
window.addEventListener("error", onError);
document.querySelectorAll('.play-btn').forEach(el => {
   el.addEventListener('click', play);
});3


// ============================ INITIALIZATION =================================

function initLevel() {
   import(`./levels/level${gameState.level}.js`)
   .then(map => {
      gameState.win = false;
      gameState.defeat = false;

      gameState.map = JSON.parse(JSON.stringify(map));
      if (container) {
         container.removeChild(container.firstChild);
         while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
         }
         scene.dispose();
         renderer.dispose();
         for(let i = 1; i <= 10; i++) {
            document.querySelector( '#charge' ).children[i].style.backgroundColor = "#7cb2c9";
         }
         document.querySelector( '#charge' ).children[0].style.color = "#7cb2c9";
      }

      init();
      renderer.render(scene, camera);
      renderer.setAnimationLoop(() => {
         update();
         render();
      });
   })
   .catch(error => {
      console.log(error);
   })
}

function getModel() {
   const loader = new GLTFLoader();
   return new Promise(resolve => {
      loader.load('./media/models/cactus/model.gltf', resolve, undefined, function(error) {
         console.error(error);
      });
   });
}

function initAudio() {
   const listener = new AudioListener();
   const audioLoader = new AudioLoader();

   music = new Audio(listener);
   killSound = new Audio(listener);

   audioLoader.load('./media/sounds/kill.wav', buffer => {
      killSound.setBuffer(buffer);
      killSound.setVolume(0.7);
   });

   audioLoader.load('./media/sounds/music.mp3', buffer => {
      music.setBuffer(buffer);
      music.setLoop(true);
      music.setVolume(0.4);
      music.play();
   });

   localStorage.setItem('sound', true);
   localStorage.setItem('music', true);
}

function initDecorations(scene, level) {
   getModel().then(model => {
      const bbox = new Box3().setFromObject(model.scene);
      const cent = bbox.getCenter(new Vector3());
      const size = bbox.getSize(new Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      model.scene.scale.multiplyScalar(1.0 / maxAxis);
      bbox.setFromObject(model.scene);

      let decor1 = model.scene.clone();
      let decor2 = model.scene.clone();
      if (level === 1) {
         decor1.position.set(6, 0.52, 6);
         decor2.position.set(10, 0.52, 10);
      } else if (level === 2) {
         decor1.position.set(0, 0.52, 11);
         decor2.position.set(16, 0.52, 7);
      } else if (level === 3) {
         decor1.position.set(2, 0.52, 2);
         decor2.position.set(20, 0.52, 18);
      } else if (level === 4) {
         decor1.position.set(6, 0.52, 8);
         decor2.position.set(19, 0.52, 4);
      } else if (level === 5) {
         decor1.position.set(2, 0.52, 2);
         decor2.position.set(24, 0.52, 16);
      }
      scene.add(decor1);
      scene.add(decor2);
   });
}

function initLight(scene) {
   const lightAmbient = new AmbientLight(0x303030, 0.9);
   scene.add(lightAmbient);
   const lightDirect = new DirectionalLight(0xffffff, 0.4);
   lightDirect.position.set(gameState.map.n / 2, 5, gameState.map.m / 2);
   lightDirect.castShadow = true;
   lightDirect.shadow.camera.left = -20;
   lightDirect.shadow.camera.right = 20;
   lightDirect.shadow.camera.top = 20;
   lightDirect.shadow.camera.bottom = -20;
   lightDirect.shadow.mapSize.width = 1024;
   lightDirect.shadow.mapSize.height = 1024;
   scene.add(lightDirect);
   lightDirect.target.position.x = gameState.map.n / 2;
   lightDirect.target.position.z = gameState.map.m / 2;
   scene.add(lightDirect.target);
   const lightHemi = new HemisphereLight(0xffffff, 0xffb6b0, 0.8);
   lightHemi.position.set(0, 5, 0);
   scene.add(lightHemi);
}

function initCamera() {
   const fov = 35;
   const aspect = container.clientWidth / container.clientHeight;
   const near = 0.1;
   const far = 100;
   camera = new PerspectiveCamera(fov, aspect, near, far);
   camera.position.set(start.x, 7.7, start.z + 8);
   camera.rotation.x = -45 * Math.PI / 180;
}

function initRenderer() {
   renderer = new WebGLRenderer({
      antialias: true
   });
   renderer.setSize(container.clientWidth, container.clientHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   renderer.shadowMap.enabled = true;
   renderer.shadowMap.type = PCFSoftShadowMap;
}



// performance test
// javascript: (function() {
//    var script = document.createElement('script');
//    script.onload = function() {
//       var stats = new Stats();
//       document.body.appendChild(stats.dom);
//       requestAnimationFrame(function loop() {
//          stats.update();
//          requestAnimationFrame(loop)
//       });
//    };
//    script.src = '//mrdoob.github.io/stats.js/build/stats.min.js';
//    document.head.appendChild(script);
// })()
