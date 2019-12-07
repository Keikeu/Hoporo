import {
   IcosahedronBufferGeometry,
   MeshLambertMaterial,
   Mesh,
} from '../three/three.module.js';

const geo = new IcosahedronBufferGeometry(0.25, 0);
const mat = new MeshLambertMaterial({color: 0xf06c7c});

export class Crystal {
   constructor(map, x, y, z) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;
      this._deployed = false;
      this._alive = true;

      this._mesh = new Mesh(geo, mat);
      this._mesh.position.set(x, y, z);
      this._mesh.castShadow = true;
      this._mesh.receiveShadow = true;
   }

   get mesh()         { return this._mesh; }
   get x()            { return this._x; }
   get y()            { return this._y; }
   get z()            { return this._z; }
   get deployed()     { return this._deployed; }
   get alive()        { return this._alive; }

   set x(x)                { this._x = x; this.mesh.position.x = x; }
   set y(y)                { this._y = y; this.mesh.position.y = y; }
   set z(z)                { this._z = z; this.mesh.position.z = z; }
   set deployed(deployed)  { this._deployed = deployed; }
   set alive(alive)        { this._alive = alive; }

   die(scene) {
      this.mesh.layers.set(1);
      scene.remove(this.mesh);
      this.alive = false;
   }
}

export function initCrystals(scene, map, crystals) {
   for (let i = 0; i < map.crystalsMap.length; i++) {
      for (let j = 0; j < map.crystalsMap[i].length; j++) {
         if (map.crystalsMap[i][j] === 1) {
            crystals.push(new Crystal(map, i, 0.75, j));
            scene.add(crystals[crystals.length - 1].mesh);
         }
      }
   }
}
