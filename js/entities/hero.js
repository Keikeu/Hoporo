import {
   Mesh,
   Box3,
   Vector3,
   Audio,
   AudioLoader,
   AudioListener,
} from '../three/three.module.js';

import {GLTFLoader} from '../three/GLTFLoader.js';
import {Crystal} from './crystal.js';

const listener = new AudioListener();
const audioLoader = new AudioLoader();
let shootSound, jumpSound, grabSound, deploySound, ascendSound;

export class Hero {
   constructor(map, x, y, z, heroModel, missileModel) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;
      this._charge = 0;
      this._direction = "up";
      this._crystals = [];
      this._deployedCrystals = 0;
      this._speed = 2.2;

      this._mesh = heroModel;
      this._mesh.position.set( x, y, z );
      this._mesh.rotation.y = -2;
      this._mesh.castShadow = true;
      this._mesh.receiveShadow = false;

      const bbox = new Box3().setFromObject(this._mesh);
      const cent = bbox.getCenter(new Vector3());
      const size = bbox.getSize(new Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      this._mesh.scale.multiplyScalar(1.0 / maxAxis);
      bbox.setFromObject(this._mesh);

      this._missile = missileModel;
      this._missile.scale.set(2, 2, 2);
      this._missile.position.set(100, 0, 100);
      this._missile.layers.set(1);
      this._missile.castShadow = true;
      this._missile.receiveShadow = false;
   }

   get map()               { return this._map; }
   get mesh()              { return this._mesh; }
   get missile()           { return this._missile; }
   get x()                 { return this._x; }
   get y()                 { return this._y; }
   get z()                 { return this._z; }
   get charge()            { return this._charge; }
   get direction()         { return this._direction; }
   get crystals()          { return this._crystals; }
   get deployedCrystals()  { return this._deployedCrystals; }
   get speed()             { return this._speed; }

   set x(x) {
      this._x = x;
      this.mesh.position.x = x;
      this.crystals.forEach(c => {
         if (!c.deployed)
            c.x = x;
      });
   }
   set y(y) {
      this._y = y;
      this.mesh.position.y = y;
      this.crystals.forEach((c, i) => {
         if (!c.deployed)
            c.y = y + 0.5 + 0.25 * i;
      });
   }
   set z(z) {
      this._z = z;
      this.mesh.position.z = z;
      this.crystals.forEach(c => {
         if (!c.deployed)
            c.z = z;
      });
   }
   set charge(charge)                       { this._charge = charge; }
   set direction(direction)                 { this._direction = direction; }
   set crystals(crystals)                   { this._crystals = crystals; }
   set deployedCrystals(deployedCrystals)   { this._deployedCrystals = deployedCrystals; }
   set speed(speed)                         { this._speed = speed; }


   tween(pos, sign, delta, speed = this.speed) {
      let destination = sign === 1 ? Math.ceil(pos) : Math.floor(pos);
      let distance = Math.abs(destination - pos);

      if (delta * speed >= distance && distance != 0.00) {
         return (parseFloat(pos) + sign * distance).toFixed(2);
      }
      if (delta * speed > 1 && distance == 0.00) {
         return (parseFloat(pos) + sign * 1).toFixed(2);
      }
      return (parseFloat(pos) + sign * delta * speed).toFixed(2);
   }

   move(hM) {

      if ((hM.isMoving || hM.isDashing) && this.x % 1 === 0 && this.z % 1 === 0) {
         hM.isMoving = false;
         hM.isDashing = false;
      } else if (hM.isDashing) {

         hM.shouldDash = false;
         switch (hM.dashDirection) {
            case "up":
               this.z = this.tween(this.z, -1, hM.delta, 4.5);
               break;
            case "right":
               this.x = this.tween(this.x, 1, hM.delta, 4.5);
               break;
            case "down":
               this.z = this.tween(this.z, 1, hM.delta, 4.5);
               break;
            case "left":
               this.x = this.tween(this.x, -1, hM.delta, 4.5);
               break;
         }

      } else if (hM.shouldDash && this.isMovePossible(hM.dashDirection)) {

         hM.isDashing = true;
         hM.isMoving = false;
         switch (hM.dashDirection) {
            case "up":
               this.z = this.tween(this.z, -1, hM.delta, 4.5);
               break;
            case "right":
               this.x = this.tween(this.x, 1, hM.delta, 4.5);
               break;
            case "down":
               this.z = this.tween(this.z, 1, hM.delta, 4.5);
               break;
            case "left":
               this.x = this.tween(this.x, -1, hM.delta, 4.5);
               break;
         }

      } else if (hM.isMoving) {

         switch (this.direction) {
            case "up":
               this.z = this.tween(this.z, -1, hM.delta);
               this.y = calcY(this.z % 1);
               break;
            case "right":
               this.x = this.tween(this.x, 1, hM.delta);
               this.y = calcY(this.x % 1);
               break;
            case "down":
               this.z = this.tween(this.z, 1, hM.delta);
               this.y = calcY(this.z % 1);
               break;
            case "left":
               this.x = this.tween(this.x, -1, hM.delta);
               this.y = calcY(this.x % 1);
               break;
         }

      } else if (hM.shouldMove && this.isMovePossible(hM.moveDirection)) {

         this.direction = hM.moveDirection;
         hM.isMoving = true;
         jumpSound.play();
         switch (this.direction) {
            case "up":
               this.z = this.tween(this.z, -1, hM.delta);
               this.mesh.rotation.y = -2;
               break;
            case "right":
               this.x = this.tween(this.x, 1, hM.delta);
               this.mesh.rotation.y = -3.6;
               break;
            case "down":
               this.z = this.tween(this.z, 1, hM.delta);
               this.mesh.rotation.y = 1.1;
               break;
            case "left":
               this.x = this.tween(this.x, -1, hM.delta);
               this.mesh.rotation.y = -0.45;
               break;
         }

      } else if (hM.shouldMove && !this.isMovePossible(hM.moveDirection)) {
         this.direction = hM.moveDirection;
         switch (this.direction) {
            case "up":
               this.mesh.rotation.y = -2;
               break;
            case "right":
               this.mesh.rotation.y = -3.6;
               break;
            case "down":
               this.mesh.rotation.y = 1.1;
               break;
            case "left":
               this.mesh.rotation.y = -0.45;
               break;
         }
      }

   }


   shoot(mM) {
      if (mM.isMoving) {
         switch (mM.direction) {
            case "up":
               this.missile.position.z = this.tween(this.missile.position.z, -1, mM.delta, 6);
               break;
            case "right":
               this.missile.position.x = this.tween(this.missile.position.x, 1, mM.delta, 6);
               break;
            case "down":
               this.missile.position.z = this.tween(this.missile.position.z, 1, mM.delta, 6);
               break;
            case "left":
               this.missile.position.x = this.tween(this.missile.position.x, -1, mM.delta, 6);
               break;
         }
      }
      if (mM.shouldMove && this.charge === 10) {
         this.missile.layers.set(0);
         this.missile.position.set(this.x, 0, this.z);
         this.charge = 0;
         mM.isMoving = true;
         for (let i = 1; i <= 10; i++) {
            document.querySelector('#charge').children[i].style.backgroundColor = "#7cb2c9";
         }
         document.querySelector('#charge').children[0].style.color = "#7cb2c9";
         shootSound.play();
      }
   }

   grabCrystal(scene) {
      this.crystals.push(new Crystal(this.map, this.x, this.y + 0.5 + 0.25 * this.crystals.length, this.z));
      scene.add(this.crystals[this.crystals.length - 1].mesh);
      this.speed = calcSpeed(this.crystals.length);
      grabSound.play();
   }

   deployCrystal(scene, gameState) {
      if (this.crystals.length && this.crystals[this.crystals.length - 1].deployed === false) {
         document.querySelector('#crystals').innerHTML -= 1;
         this.crystals[this.crystals.length - 1].deployed = true;
         deploySound.play();
         setTimeout(() => {
            this.crystals[this.crystals.length - 1].die(scene);
            this.crystals.pop();
            this.speed = calcSpeed(this.crystals.length);
            if (this.map.crystalsNumber === ++this.deployedCrystals) {
               gameState.win = true;
               ascendSound.play();
               if (gameState.level === 5) {
                  document.querySelector('.modal-container--win').classList.remove('invisible');
               }
            }
         }, 800);
      }
   }

   killMissile() {
      console.log("kill missile")
      this.missile.layers.set(1);
      this.missile.position.set(100, 0, 100);
   }

   isMovePossible(direction) {
      const x = parseInt(this.x);
      const z = parseInt(this.z);

      if (direction === "up") {
         if (this.isObstacle(x, z-1)) { return false; }
      } else if (direction === "right") {
         if (this.isObstacle(x+1, z)) { return false; }
      } else if (direction === "down") {
         if (this.isObstacle(x, z+1)) { return false; }
      } else if (direction === "left") {
         if (this.isObstacle(x-1, z)) { return false; }
      }

      return true;
   }

   isObstacle(x, z) {
      if (x < 0 || z < 0 || x >= this.map.m || z >= this.map.n || !this.map.groundMap[x][z] || this.map.gatesMap[x][z]) {
         return true;
      }
      return false;
   }

   soundOff() {
      shootSound.setVolume(0);
      jumpSound.setVolume(0);
      grabSound.setVolume(0);
      deploySound.setVolume(0);
      ascendSound.setVolume(0);
   }

   soundOn() {
      shootSound.setVolume(0.6);
      jumpSound.setVolume(1.0);
      grabSound.setVolume(0.6);
      deploySound.setVolume(0.6);
      ascendSound.setVolume(0.6);
   }

}

function calcY(x) {
   return ((-1 * (2 * x - 1) * (2 * x - 1) + 1) / 2) - 0.2;
}

function calcSpeed(x) {
   if (x < 3)
      return 2.2 - 0.05 * x;
   else if (x < 11)
      return 2 - 0.1 * (x - 3);
   else
      return 1.3;
}

function getHeroModel() {
   const loader = new GLTFLoader();
   return new Promise(resolve => {
      loader.load('./media/models/hero/model.gltf', resolve, undefined, function(error) {
         console.error(error);
      });
   });
}

function getMissileModel() {
   const loader = new GLTFLoader();
   return new Promise(resolve => {
      loader.load('./media/models/missile/model.gltf', resolve, undefined, function(error) {
         console.error(error);
      });
   });
}


export function initHero(scene, map, heros, missiles) {
   getHeroModel().then(heroModel => {
      getMissileModel().then(missileModel => {
         heroModel.scene.traverse(function(node) {
            if (node instanceof Mesh) {
               node.castShadow = true;
            }
         });
         missileModel.scene.traverse(function(node) {
            if (node instanceof Mesh) {
               node.castShadow = true;
            }
         });
         heros.push(new Hero(map, map.startMap[0], -0.2, map.startMap[1], heroModel.scene, missileModel.scene));
         if (!JSON.parse(localStorage.getItem('sound'))) {
            heros[0].soundOff();
         }
         scene.add(heros[0].mesh);
         missiles.push(heros[0].missile)
         scene.add(heros[0].missile);
      });
   });

   shootSound = new Audio(listener);
   jumpSound = new Audio(listener);
   grabSound = new Audio(listener);
   deploySound = new Audio(listener);
   ascendSound = new Audio(listener);

   audioLoader.load('./media/sounds/shoot.wav', buffer => {
      shootSound.setBuffer(buffer);
      shootSound.setVolume(0.6);
   });

   audioLoader.load('./media/sounds/jump.wav', buffer => {
      jumpSound.setBuffer(buffer);
      jumpSound.setVolume(1.0);
   });

   audioLoader.load('./media/sounds/grab.wav', buffer => {
      grabSound.setBuffer(buffer);
      grabSound.setVolume(0.6);
      grabSound.setPlaybackRate(1.3);
      grabSound.duration = 0.55;
   });

   audioLoader.load('./media/sounds/deploy.wav', buffer => {
      deploySound.setBuffer(buffer);
      deploySound.setVolume(0.6);
      deploySound.setPlaybackRate(2.7);
   });

   audioLoader.load('./media/sounds/deploy.wav', buffer => {
      ascendSound.setBuffer(buffer);
      ascendSound.setVolume(0.6);
      ascendSound.setPlaybackRate(0.9);
   });
}
