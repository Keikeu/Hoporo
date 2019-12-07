import {
   BoxBufferGeometry,
   MeshLambertMaterial,
   Mesh,
} from '../three/three.module.js';

const geo = new BoxBufferGeometry(1, 1, 1);
const mat = new MeshLambertMaterial({color: 0xd9d4ca});

export class Wall {
   constructor(map, x, y, z) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;

      this._mesh = new Mesh(geo, mat);
      this._mesh.position.set(x, y, z);
      this._mesh.castShadow = true;
      this._mesh.receiveShadow = false;
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

export function initWalls(scene, map, walls) {
   for (let i = 0; i < map.wallsMap.length; i++) {
      for (let j = 0; j < map.wallsMap[i].length; j++) {
         if (map.wallsMap[i][j] === 1) {
            walls.push(new Wall(map, i, 0, j));
            scene.add(walls[walls.length - 1].mesh);
         }
      }
   }
}
