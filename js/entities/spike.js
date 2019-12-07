import {
   Mesh,
   Box3,
   Vector3,
   Quaternion,
} from '../three/three.module.js';

import {GLTFLoader} from '../three/GLTFLoader.js';

export class Spike {
   constructor(map, x, y, z, model, direction, noTurn = false) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;
      this._direction = direction;
      this._speed = 2.1;
      this._noTurn = noTurn;

      this._mesh = model;
      this._mesh.position.set(x, y, z);
      this._mesh.castShadow = true;
      this._mesh.receiveShadow = false;

      const bbox = new Box3().setFromObject(this._mesh);
      const cent = bbox.getCenter(new Vector3());
      const size = bbox.getSize(new Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      this._mesh.scale.multiplyScalar(1.0 / maxAxis);
      bbox.setFromObject(this._mesh);

      if (this.direction === "right" || this.direction === "left") { this.mesh.quaternion.set(0, -60 * Math.PI / 180, 0, 1).normalize(); }
      if (this.direction === "up" || this.direction === "down")    { this.mesh.quaternion.set(-60 * Math.PI / 180, 0, 0, 1).normalize(); }
   }

   get map()       { return this._map; }
   get mesh()      { return this._mesh; }
   get x()         { return this._x; }
   get y()         { return this._y; }
   get z()         { return this._z; }
   get direction() { return this._direction; }
   get speed()     { return this._speed; }
   get noTurn()    { return this._noTurn; }

   set x(x)                   { this._x = x; this.mesh.position.x = x; }
   set y(y)                   { this._y = y; this.mesh.position.y = y; }
   set z(z)                   { this._z = z; this.mesh.position.z = z; }
   set direction(direction)   { this._direction = direction; }
   set speed(speed)           { this._speed = speed; }
   set noTurn(noTurn)         { this._noTurn = noTurn; }

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
      let tmpQuaternion;
      if (this.mesh.position.x % 1 === 0 && this.mesh.position.z % 1 === 0) {
         this.randomizeDirection();
      }
      switch (this.direction) {
         case "up":
            this.z = this.tween(this.z, -1, delta);
            tmpQuaternion = new Quaternion(-delta * 80 * Math.PI / 180, 0, 0, 1).normalize();
            this.mesh.quaternion.multiply(tmpQuaternion);
            break;
         case "right":
            this.x = this.tween(this.x, 1, delta);
            tmpQuaternion = new Quaternion(-delta * 80 * Math.PI / 180, 0, 0, 1).normalize();
            this.mesh.quaternion.multiply(tmpQuaternion);
            break;
         case "down":
            this.z = this.tween(this.z, 1, delta);
            tmpQuaternion = new Quaternion(delta * 80 * Math.PI / 180, 0, 0, 1).normalize();
            this.mesh.quaternion.multiply(tmpQuaternion);
            break;
         case "left":
            this.x = this.tween(this.x, -1, delta);
            tmpQuaternion = new Quaternion(delta * 80 * Math.PI / 180, 0, 0, 1).normalize();
            this.mesh.quaternion.multiply(tmpQuaternion);
            break;
      }
   }

   randomizeDirection() {
      let possibleDirections = [];
      const x = parseInt(this.x);
      const z = parseInt(this.z);
      if (this.direction === "up") {
         if (this.isObstacle(x, z - 1) === false)                                 { this.direction = "up"; }
         else if (this.isObstacle(x + 1, z) === false && this.noTurn === false)   { this.direction = "right"; this.mesh.quaternion.set(0, -60 * Math.PI / 180, 0, 1).normalize(); }
         else if (this.isObstacle(x - 1, z) === false && this.noTurn === false)   { this.direction = "left";  this.mesh.quaternion.set(0, -60 * Math.PI / 180, 0, 1).normalize(); }
         else if (this.isObstacle(x, z + 1) === false)                            { this.direction = "down"; }
      } else if (this.direction === "right") {
         if (this.isObstacle(x + 1, z) === false)                                 { this.direction = "right"; }
         else if (this.isObstacle(x, z - 1) === false && this.noTurn === false)   { this.direction = "up";    this.mesh.quaternion.set(-60 * Math.PI / 180, 0, 0, 1).normalize(); }
         else if (this.isObstacle(x, z + 1) === false && this.noTurn === false)   { this.direction = "down";  this.mesh.quaternion.set(-60 * Math.PI / 180, 0, 0, 1).normalize(); }
         else if (this.isObstacle(x - 1, z) === false)                            { this.direction = "left"; }
      } else if (this.direction === "down") {
         if (this.isObstacle(x, z + 1) === false)                                 { this.direction = "down"; }
         else if (this.isObstacle(x + 1, z) === false && this.noTurn === false)   { this.direction = "right"; this.mesh.quaternion.set(0, -60 * Math.PI / 180, 0, 1).normalize(); }
         else if (this.isObstacle(x - 1, z) === false && this.noTurn === false)   { this.direction = "left";  this.mesh.quaternion.set(0, -60 * Math.PI / 180, 0, 1).normalize(); }
         else if (this.isObstacle(x, z - 1) === false)                            { this.direction = "up"; }
      } else if (this.direction === "left") {
         if (this.isObstacle(x - 1, z) === false)                                 { this.direction = "left"; }
         else if (this.isObstacle(x, z - 1) === false && this.noTurn === false)   { this.direction = "up";    this.mesh.quaternion.set(-60 * Math.PI / 180, 0, 0, 1).normalize(); }
         else if (this.isObstacle(x, z + 1) === false && this.noTurn === false)   { this.direction = "down";  this.mesh.quaternion.set(-60 * Math.PI / 180, 0, 0, 1).normalize(); }
         else if (this.isObstacle(x + 1, z) === false)                            { this.direction = "right"; }
      }
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
      loader.load('./media/models/spike/model.gltf', resolve, undefined, function(error) {
         console.error(error);
      });
   });
}


export function initSpikes(scene, map, spikes) {
   for (let i = 0; i < map.spikesMap.length; i++) {
      for (let j = 0; j < map.spikesMap[i].length; j++) {
         if (map.spikesMap[i][j] !== 0) {
            getModel().then(model => {
               model.scene.traverse(function(node) {
                  if (node instanceof Mesh) {
                     node.castShadow = true;
                  }
               });
               if (map.spikesMap[i][j] === 1)      spikes.push(new Spike(map, i, 0, j, model.scene, "up"));
               else if (map.spikesMap[i][j] === 2) spikes.push(new Spike(map, i, 0, j, model.scene, "right"));
               else if (map.spikesMap[i][j] === 3) spikes.push(new Spike(map, i, 0, j, model.scene, "down"));
               else if (map.spikesMap[i][j] === 4) spikes.push(new Spike(map, i, 0, j, model.scene, "left"));
               else if (map.spikesMap[i][j] === 5) spikes.push(new Spike(map, i, 0, j, model.scene, "up", true));
               else if (map.spikesMap[i][j] === 6) spikes.push(new Spike(map, i, 0, j, model.scene, "right", true));
               else if (map.spikesMap[i][j] === 7) spikes.push(new Spike(map, i, 0, j, model.scene, "down", true));
               else                                spikes.push(new Spike(map, i, 0, j, model.scene, "left", true));
               scene.add(spikes[spikes.length - 1].mesh);
            });
         }
      }
   }
}
