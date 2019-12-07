import {
   Mesh,
   Box3,
   Vector3,
   Color,
} from '../three/three.module.js';

import {GLTFLoader} from '../three/GLTFLoader.js';

export class Bird {
   constructor(map, x, y, z, model) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;
      this._direction = "up";
      this._alive = true;
      this._speed = 2.0;

      this._mesh = model;
      this._mesh.rotation.y = 0;
      this._mesh.position.set(x, y, z);
      this._mesh.castShadow = true;
      this._mesh.receiveShadow = false;

      const bbox = new Box3().setFromObject(this._mesh);
      const cent = bbox.getCenter(new Vector3());
      const size = bbox.getSize(new Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      this._mesh.scale.multiplyScalar(1.2 / maxAxis);
      bbox.setFromObject(this._mesh);
   }

   get map()       { return this._map; }
   get mesh()      { return this._mesh; }
   get x()         { return this._x; }
   get y()         { return this._y; }
   get z()         { return this._z; }
   get direction() { return this._direction; }
   get alive()     { return this._alive; }
   get speed()     { return this._speed; }

   set x(x)                   { this._x = x; this.mesh.position.x = x; }
   set y(y)                   { this._y = y; this.mesh.position.y = y; }
   set z(z)                   { this._z = z; this.mesh.position.z = z; }
   set direction(direction)   { this._direction = direction; }
   set alive(alive)           { this._alive = alive; }
   set speed(speed)           { this._speed = speed; }

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

   move(delta) {
      if (this.mesh.position.x % 1 === 0 && this.mesh.position.z % 1 === 0) {
         this.randomizeDirection();
      }
      switch(this.direction) {
         case "up":
            this.z = this.tween(this.z, -1, delta);
            break;
         case "right":
            this.x = this.tween(this.x, 1, delta);
            break;
         case "down":
            this.z = this.tween(this.z, 1, delta);
            break;
         case "left":
            this.x = this.tween(this.x, -1, delta);
            break;
      }
   }

   randomizeDirection() {
      let possibleDirections = [];
      const x = parseInt(this.x);
      const z = parseInt(this.z);
      if (this.direction === "up") {
         if (this.isObstacle(x, z - 1) === false) { possibleDirections.push("up")    }
         if (this.isObstacle(x + 1, z) === false) { possibleDirections.push("right") }
         if (this.isObstacle(x - 1, z) === false) { possibleDirections.push("left")  }
         if (possibleDirections.length === 0)     { possibleDirections.push("down")  }
      } else if (this.direction === "right") {
         if (this.isObstacle(x + 1, z) === false) { possibleDirections.push("right") }
         if (this.isObstacle(x, z - 1) === false) { possibleDirections.push("up")    }
         if (this.isObstacle(x, z + 1) === false) { possibleDirections.push("down")  }
         if (possibleDirections.length === 0)     { possibleDirections.push("left")  }
      } else if (this.direction === "down") {
         if (this.isObstacle(x, z + 1) === false) { possibleDirections.push("down")  }
         if (this.isObstacle(x + 1, z) === false) { possibleDirections.push("right") }
         if (this.isObstacle(x - 1, z) === false) { possibleDirections.push("left")  }
         if (possibleDirections.length === 0)     { possibleDirections.push("up")    }
      } else if (this.direction === "left") {
         if (this.isObstacle(x - 1, z) === false) { possibleDirections.push("left")  }
         if (this.isObstacle(x, z - 1) === false) { possibleDirections.push("up")    }
         if (this.isObstacle(x, z + 1) === false) { possibleDirections.push("down")  }
         if (possibleDirections.length === 0)     { possibleDirections.push("right") }
      }

      let rand = Math.floor(Math.random() * possibleDirections.length);
      this.direction = possibleDirections[rand];

      if (this.direction === "up")      { this.mesh.rotation.y = 3.14; }
      if (this.direction === "right")   { this.mesh.rotation.y = 1.62; }
      if (this.direction === "down")    { this.mesh.rotation.y = 0; }
      if (this.direction === "left")    { this.mesh.rotation.y = -1.62; }
   }

   die(scene) {
      this.mesh.layers.set(1);
      scene.remove(this.mesh);
      this.alive = false;
   }

   isObstacle(x, z) {
      if (x < 0 || z < 0 || x >= this.map.m || z >= this.map.n || !this.map.groundMap[x][z] || this.map.gatesMap[x][z]) {
         return true;
      }
      return false;
   }
}

function getModel() {
   const loader = new GLTFLoader();
   return new Promise(resolve => {
      loader.load('./media/models/bird/model.gltf', resolve, undefined, function(error) {
         console.error(error);
      });
   });
}

export function initBirds(scene, map, birds) {
   for (let i = 0; i < map.birdsMap.length; i++) {
      for (let j = 0; j < map.birdsMap[i].length; j++) {
         if (map.birdsMap[i][j] === 1) {
            getModel().then(model => {
               model.scene.traverse(function(node) {
                  if (node instanceof Mesh) {
                     node.castShadow = true;
                  }
               });
               birds.push(new Bird(map, i, 0, j, model.scene));
               scene.add(birds[birds.length - 1].mesh);
            });
         }
      }
   }
}
