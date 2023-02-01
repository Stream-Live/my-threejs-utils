
import * as THREE from 'three'

/**
 * @description: 创建下雪
 * @param {number} width 宽，默认100 
 * @param {number} height 高，默认100 
 * @param {number} depth 深，默认100 
 * @param {number} total 雪的数量
 * @param {number} speed 下雪速度
 * @param {number} pointSize 雪的大小
 * @return {*}
 */
export function CreateSnow(params?: {
  width?: number, 
  height?: number,
  depth?: number,
  total?: number,  // 雪的数量
  speed?: number,  // 下雪速度
  pointSize?: number,  // 雪的大小
}): {
  points: THREE.Points,   
  boxHelper: THREE.BoxHelper, 
  isStarted: Boolean,   
  start: () => void,    // 开始下雪
  stop: () => void,     // 暂停下雪
}{

  const option = {
    width: 100, 
    height: 100,
    depth: 100,
    total: 1000,  // 雪的数量
    speed: 10,  // 下雪速度
    pointSize: 10,  // 雪的大小
  }

  Object.assign(option, params || {});

  let box = new THREE.Mesh(
    new THREE.BoxGeometry(option.width, option.height, option.depth),
    new THREE.MeshLambertMaterial({ color: 0xffff00 })
  );
  box.geometry.computeBoundingBox();

  let { min, max } = box.geometry.boundingBox as {min: THREE.Vector3, max: THREE.Vector3};

  let uTime = {value: 0}

  const pointMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      height:{
        value: max.y - min.y
      },
      pointSize: {
        value: option.pointSize
      }
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    vertexShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float height;
    uniform float pointSize;
      void main(){
        vUv = uv;
        vec3 pos = vec3(position.x, mod(position.y+uTime, height) - (height/2.0), position.z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = pointSize;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main(){
        float d = distance(gl_PointCoord, vec2(0.5, 0.5));
        float m = 1.0 - smoothstep(0.0, 0.5, d);
        gl_FragColor = vec4(1.0, 1.0, 1.0, m * 0.5);
      }
    `
  });
  const pointsArray: Array<number> = [];
  for (let i = 0; i < option.total; i++) {
    const pos = new THREE.Vector3();
    pos.x = Math.random() * (max.x - min.x + 1) + min.x;
    pos.y = Math.random() * (max.y - min.y + 1) + min.y;
    pos.z = Math.random() * (max.z - min.z + 1) + min.z;

    pointsArray.push(pos.x);
    pointsArray.push(pos.y);
    pointsArray.push(pos.z);
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pointsArray), 3))

  let points = new THREE.Points(g, pointMat);
  points.name = 'snow_points';
  const boxHelper = new THREE.BoxHelper(points);
  boxHelper.name = 'snow_boxHelper'

  const obj = {
    points,
    boxHelper,
    isStarted: false,
    start() {
      this.isStarted = true;
      render();
    },
    stop() {
      this.isStarted = false;
    },
  };

  let clock = new THREE.Clock();
  function render() {
    obj.isStarted && requestAnimationFrame(render);
    uTime.value -= (option.speed * clock.getDelta());
  }
  return obj;
}