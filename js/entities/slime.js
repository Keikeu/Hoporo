import { Mesh, Box3, Vector3 } from "../three/three.module.js";

import { GLTFLoader } from "../three/GLTFLoader.js";

export class Slime {
  constructor(map, x, y, z, model, d, direction = "up") {
    this._map = map;
    this._x = x;
    this._y = y;
    this._z = z;
    this._direction = direction;
    this._alive = true;
    this._speed = 1.5;
    this._d = d;

    this._mesh = model;
    this._mesh.rotation.y = 0;
    this._mesh.position.set(x, y, z);
    this._mesh.castShadow = true;
    this._mesh.receiveShadow = false;

    const bbox = new Box3().setFromObject(this._mesh);
    const cent = bbox.getCenter(new Vector3());
    const size = bbox.getSize(new Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z);
    this._mesh.scale.multiplyScalar(d / maxAxis);
    bbox.setFromObject(this._mesh);
  }

  get map() {
    return this._map;
  }
  get mesh() {
    return this._mesh;
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get z() {
    return this._z;
  }
  get direction() {
    return this._direction;
  }
  get alive() {
    return this._alive;
  }
  get speed() {
    return this._speed;
  }
  get d() {
    return this._d;
  }

  set x(x) {
    this._x = x;
    this.mesh.position.x = x;
  }
  set y(y) {
    this._y = y;
    this.mesh.position.y = y;
  }
  set z(z) {
    this._z = z;
    this.mesh.position.z = z;
  }
  set direction(direction) {
    this._direction = direction;
  }
  set alive(alive) {
    this._alive = alive;
  }
  set speed(speed) {
    this._speed = speed;
  }
  set d(d) {
    this._d = d;
  }

  tween(pos, sign, delta, speed = this.speed) {
    let destination = sign === 1 ? Math.ceil(pos) : Math.floor(pos);
    let distance = Math.abs(destination - pos);

    if (delta * speed >= distance && distance != 0.0) {
      return (parseFloat(pos) + sign * distance).toFixed(2);
    }
    if (delta * speed > 1 && distance == 0.0) {
      return (parseFloat(pos) + sign * 1).toFixed(2);
    }
    return (parseFloat(pos) + sign * delta * speed).toFixed(2);
  }

  move(delta) {
    if (this.mesh.position.x % 1 === 0 && this.mesh.position.z % 1 === 0) {
      this.randomizeDirection();
    }
    switch (this.direction) {
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
      if (this.isObstacle(x, z - 1) === false) {
        possibleDirections.push("up");
      }
      if (this.isObstacle(x + 1, z) === false) {
        possibleDirections.push("right");
      }
      if (this.isObstacle(x - 1, z) === false) {
        possibleDirections.push("left");
      }
      if (possibleDirections.length === 0) {
        possibleDirections.push("down");
      }
    } else if (this.direction === "right") {
      if (this.isObstacle(x + 1, z) === false) {
        possibleDirections.push("right");
      }
      if (this.isObstacle(x, z - 1) === false) {
        possibleDirections.push("up");
      }
      if (this.isObstacle(x, z + 1) === false) {
        possibleDirections.push("down");
      }
      if (possibleDirections.length === 0) {
        possibleDirections.push("left");
      }
    } else if (this.direction === "down") {
      if (this.isObstacle(x, z + 1) === false) {
        possibleDirections.push("down");
      }
      if (this.isObstacle(x + 1, z) === false) {
        possibleDirections.push("right");
      }
      if (this.isObstacle(x - 1, z) === false) {
        possibleDirections.push("left");
      }
      if (possibleDirections.length === 0) {
        possibleDirections.push("up");
      }
    } else if (this.direction === "left") {
      if (this.isObstacle(x - 1, z) === false) {
        possibleDirections.push("left");
      }
      if (this.isObstacle(x, z - 1) === false) {
        possibleDirections.push("up");
      }
      if (this.isObstacle(x, z + 1) === false) {
        possibleDirections.push("down");
      }
      if (possibleDirections.length === 0) {
        possibleDirections.push("right");
      }
    }

    let rand = Math.floor(Math.random() * possibleDirections.length);
    this.direction = possibleDirections[rand];
  }

  getOppositeDirection() {
    switch (this.direction) {
      case "up":
        return "down";
      case "right":
        return "left";
      case "down":
        return "up";
      case "left":
        return "right";
      default:
        return this.direction;
    }
  }

  die(scene, slimes) {
    if (this.d > 0.5) {
      this.d = 0.5;
      const bbox = new Box3().setFromObject(this.mesh);
      const size = bbox.getSize(new Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      this._mesh.scale.multiplyScalar(this.d / maxAxis);
      slimes.push(
        new Slime(
          this.map,
          this.x,
          -0.25,
          this.z,
          this.mesh.clone(),
          0.5,
          this.getOppositeDirection()
        )
      );
      scene.add(slimes[slimes.length - 1].mesh);
    } else {
      this.mesh.layers.set(1);
      scene.remove(this.mesh);
      this.alive = false;
    }
  }

  isObstacle(x, z) {
    if (
      x < 0 ||
      z < 0 ||
      x >= this.map.m ||
      z >= this.map.n ||
      !this.map.groundMap[x][z] ||
      this.map.gatesMap[x][z]
    ) {
      return true;
    }
    return false;
  }
}

function getModel() {
  const loader = new GLTFLoader();
  return new Promise((resolve) => {
    loader.load(
      "./media/models/slime/model.gltf",
      resolve,
      undefined,
      function (error) {
        console.error(error);
      }
    );
  });
}

export function initSlimes(scene, map, slimes) {
  for (let i = 0; i < map.slimesMap.length; i++) {
    for (let j = 0; j < map.slimesMap[i].length; j++) {
      if (map.slimesMap[i][j] === 1) {
        getModel().then((model) => {
          slimes.push(new Slime(map, i, -0.1, j, model.scene, 0.8));
          scene.add(slimes[slimes.length - 1].mesh);
        });
      }
    }
  }
}
