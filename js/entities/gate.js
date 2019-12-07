import {
   BoxBufferGeometry,
   MeshLambertMaterial,
   Mesh,
} from '../three/three.module.js';

import {gatesMap, wallsMap} from '../levels/level1.js';

const geo = new BoxBufferGeometry(1, 0.3, 0.1);
const mat = new MeshLambertMaterial({color: 0x27BAA7});

export class Gate {
   constructor(map, x, y, z) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;
      this._alive = true;

      this._mesh = new Mesh(geo, mat);
      this._mesh.position.set(x, y, z);
      this._mesh.castShadow = true;
      this._mesh.receiveShadow = false;
      this.rotate();
   }

   get map()   { return this._map; }
   get mesh()  { return this._mesh; }
   get x()     { return this._x; }
   get y()     { return this._y; }
   get z()     { return this._z; }
   get alive() { return this._alive; }

   set x(x)          { this._x = x; this.mesh.position.x = x; }
   set y(y)          { this._y = y; this.mesh.position.y = y; }
   set z(z)          { this._z = z; this.mesh.position.z = z; }
   set alive(alive)  { this._alive = alive; }

   die(scene) {
      this.mesh.layers.set(1);
      scene.remove(this.mesh);
      this.alive = false;
   }

   rotate() {
      if (this.map.wallsMap[this.x - 1][this.z]) {
         this.mesh.rotation.y = 0;
      } else {
         this.mesh.rotation.y = 90 * Math.PI / 180;
      }
   }
}

export function initGates(scene, map, gates) {
   for (let i = 0; i < map.gatesMap.length; i++) {
      for (let j = 0; j < map.gatesMap[i].length; j++) {
         if (map.gatesMap[i][j] === 1) {
            gates.push(new Gate(map, i, 0, j));
            scene.add(gates[gates.length - 1].mesh);
         }
      }
   }
}
