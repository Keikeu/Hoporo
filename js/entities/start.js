import {
   PlaneBufferGeometry,
   MeshLambertMaterial,
   Mesh,
} from '../three/three.module.js';

const geo = new PlaneBufferGeometry(1, 1);
const mat = new MeshLambertMaterial({color: 0xe35d6d});

export class Start {
   constructor(map, x, y, z) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;

      this._mesh = new Mesh(geo, mat);
      this._mesh.position.set(x, y, z);
      this._mesh.rotation.x = - Math.PI / 2;
      this._mesh.castShadow = false;
      this._mesh.receiveShadow = true;
   }

   get map()   { return this._map; }
   get mesh()  { return this._mesh; }
   get x()     { return this._x; }
   get y()     { return this._y; }
   get z()     { return this._z; }

   set x(x)  { this._x = x; }
   set y(y)  { this._y = y; }
   set z(z)  { this._z = z; }

}

export function initStart(scene, map, starts) {
   starts.push(new Start(map, map.startMap[0], -0.5, map.startMap[1]));
   scene.add(starts[starts.length - 1].mesh);
}
