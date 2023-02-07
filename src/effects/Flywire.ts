
import * as THREE from 'three'
/**
 * @description: 
 * @param {Array<{x: number, y: number, z: number}>} points [] 点数组
 * @param {numebr} divisions 1000 分段数
 * @param {string} startColor '#ffff00' 起始颜色
 * @param {string} endColor '#ff0000' 终止颜色
 * @param {number} pointSize 10 点的大小
 * @param {number} maxOpacity 1 最大透明度
 * @param {number} speed 1 运动速度
 * @param {number} cycle 3 周期分段数，一个周期是 divisions / cycle
 * @return {*}
 */
export function CreateFlywire(params: {
  points: Array<{x: number, y: number, z: number}>,
  divisions?: number, 
  startColor?: string,
  endColor?: string,
  pointSize?: number,
  maxOpacity?: number,
  speed?: number,
  cycle?: number,  
}): {
  start: () => void,
  stop: () => void,
  isStarted: Boolean,
  points: THREE.Points,
}{

  const option = {
    points: [],
    divisions: 1000,   
    startColor: '#ffffff',
    endColor: '#ff0000',
    pointSize: 10,
    maxOpacity: 1,
    speed: 1,
    cycle: 3,   
  }

  Object.assign(option, params);
  
  let vec3Points = option.points.map(item => new THREE.Vector3().copy(item));

  let curve = new THREE.CatmullRomCurve3(vec3Points);

  let pointsArr = curve.getPoints(option.divisions)

  let attrCnumber: Array<number> = [];
  
  for (let i = 0; i < pointsArr.length; i++) {

    attrCnumber.push(i);

  }

  const geometry = new THREE.BufferGeometry().setFromPoints(pointsArr);
  geometry.setAttribute('current', new THREE.Float32BufferAttribute(attrCnumber, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uCycle: {
        value: option.divisions / option.cycle
      },
      uSize: {
        value: option.pointSize,
      },
      uTime: {
        value: 0
      },
      uLength: {
        value: pointsArr.length
      },
      maxOpacity: {
        value: option.maxOpacity
      },
      startColor: {
        value: new THREE.Color(option.startColor)
      },
      endColor: {
        value: new THREE.Color(option.endColor)
      },
    },
    vertexShader: `
      attribute float current;
      uniform float uCycle;
      uniform float uSize;
      uniform float uTime;
      varying float percent;
      varying float vCurrent;
      void main(){
        vCurrent = current;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        percent = mod(current+uTime, uCycle) / uCycle;
        gl_PointSize = percent * uSize;
      }
      
    `,
    fragmentShader: `
      varying float percent;
      uniform float uLength;
      varying float vCurrent;
      uniform vec3 startColor;
      uniform vec3 endColor;
      uniform float maxOpacity;
      void main(){
        float d = vCurrent / uLength;
        gl_FragColor = vec4(mix(startColor, endColor, d), percent * maxOpacity);
      }
    `
  })

  const points = new THREE.Points(geometry, mat)

  let obj = {
    points,
    isStarted: false,
    stop() {
      this.isStarted = false;
    },
    start() {
      this.isStarted = true;
      render();
    }
  }
  
  let clock = new THREE.Clock();
  let d = option.divisions / 10;
  function render() {
    obj.isStarted && requestAnimationFrame(render);
    (mat.uniforms as any).uTime.value -= (clock.getDelta() * d * option.speed);
  }
  render();

  return obj;
}