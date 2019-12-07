import {
   PlaneBufferGeometry,
   MeshLambertMaterial,
   TextureLoader,
   Mesh,
} from '../three/three.module.js';

const geo = new PlaneBufferGeometry(1, 1);
const tex = new TextureLoader().load('./media/ground.png');
const mat = new MeshLambertMaterial({map: tex});

export class Ground {
   constructor(map, x, y, z) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;

      this._mesh = new Mesh(geo, mat);
      this._mesh.position.set(x, y, z);
      this._mesh.rotation.x = -90 * Math.PI / 180;
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

export function initGround(scene, map) {
   for (let i = 0; i < map.groundMap.length; i++) {
      for (let j = 0; j < map.groundMap[i].length; j++) {
         if (map.groundMap[i][j] === 1) {
            scene.add(new Ground(map, i, -0.501, j).mesh);
         }
      }
   }
}
