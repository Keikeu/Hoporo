import {
   PlaneBufferGeometry,
   MeshLambertMaterial,
   Mesh,
   TextureLoader,
   Quaternion,
} from '../three/three.module.js';

const geo = new PlaneBufferGeometry(1, 1);
const tex = new TextureLoader().load('./media/arrow.png');
const mat = new MeshLambertMaterial({map: tex});

export class Arrow {
   constructor(map, x, y, z, direction) {
      this._map = map;
      this._x = x;
      this._y = y;
      this._z = z;
      this._direction = direction;

      this._mesh = new Mesh( geo, mat );
      this._mesh.position.set( x, y, z );
      this._mesh.quaternion.set(-57.2 * Math.PI / 180, 0, 0, 1).normalize();

      let tmpQuaternion;
      if(direction === "up") {
         tmpQuaternion = new Quaternion(0, 0, 1, 1).normalize();
         this._mesh.quaternion.multiply(tmpQuaternion);
      }
      else if(direction === "right") {
         tmpQuaternion = new Quaternion(0, 0, 0, 1).normalize();
         this._mesh.quaternion.multiply(tmpQuaternion);
      }
      else if(direction === "down") {
         tmpQuaternion = new Quaternion(0, 0, -1, 1).normalize();
         this._mesh.quaternion.multiply(tmpQuaternion);
      }
      else if(direction === "left") {
         tmpQuaternion = new Quaternion(0, 0, 200, 1).normalize();
         this._mesh.quaternion.multiply(tmpQuaternion);
      }

      this._mesh.castShadow = false;
      this._mesh.receiveShadow = true;
   }

   get map()       { return this._map; }
   get mesh()      { return this._mesh; }
   get x()         { return this._x; }
   get y()         { return this._y; }
   get z()         { return this._z; }
   get direction() { return this._direction; }

   set x(x)                   { this._x = x; }
   set y(y)                   { this._y = y; }
   set z(z)                   { this._z = z; }
   set direction(direction)   { this._direction = direction; }

}

export function initArrows(scene, map, arrows) {
   for (let i = 0; i < map.arrowsMap.length; i++) {
      for (let j = 0; j < map.arrowsMap[i].length; j++) {
         if (map.arrowsMap[i][j] !== 0) {
            if (map.arrowsMap[i][j] === 1) arrows.push(new Arrow(map, i, -0.5, j, "up"));
            else if (map.arrowsMap[i][j] === 2) arrows.push(new Arrow(map, i, -0.5, j, "right"));
            else if (map.arrowsMap[i][j] === 3) arrows.push(new Arrow(map, i, -0.5, j, "down"));
            else if (map.arrowsMap[i][j] === 4) arrows.push(new Arrow(map, i, -0.5, j, "left"));
            scene.add(arrows[arrows.length - 1].mesh);
         }
      }
   }
}
