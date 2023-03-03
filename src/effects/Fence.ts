
import * as THREE from 'three'
import {FenceGeometry} from './FenceGeometry'
import {debounce} from 'lodash-es'
/**
 * @description: 创建围栏
 * @param {Array<{x: number, y: number, z: number}>} points [] 点数组
 * @param {Array<string>} meshNameList [] 要穿墙的物体的名称
 * @param {THREE.Scene} scene null 场景对象
 * @param {number} height 10 电子围栏高度
 * @param {Function} warnCallback (mesh: THREE.Object3D) => void 物体撞墙时的回调函数，只会回调一次
 * @param {string} bgColor '#00ff00' 电子围栏背景色
 * @param {string} lineColor '#ffff00' 条纹颜色
 * @param {string} warnBgColor '#ff0000' 告警时的背景色
 * @param {string} warnLineColor '#ffff00' 告警时的条纹颜色
 * @param {number} cycle 1 电子围栏条纹周期
 * @param {number} lineWidth 0 条纹宽度
 * @param {number} speed 1 条纹运动速度
 * @return {*}
 */
export function CreateFence(params: {
  points: Array<{x: number, y: number, z: number}>,
  meshNameList: Array<string>,
  scene: THREE.Scene,
  height?: number,
  warnCallback?: (mesh: THREE.Object3D) => void,
  bgColor?: string,
  lineColor?: string,
  warnBgColor?: string,
  warnLineColor?: string,
  cycle?: number,
  lineWidth?: number,
  speed?: number,
}): {
  start: () => void,
  stop: () => void,
  isStarted: Boolean,
  mesh: THREE.Object3D,
} {

  const option = {
    points: [],
    meshNameList: [],
    scene: null,
    height: 10,
    warnCallback: (mesh: THREE.Object3D) => { },
    bgColor: '#00ff00',
    lineColor: '#ffff00',
    warnBgColor: '#ff0000',
    warnLineColor: '#ffff00',
    cycle: 1,
    lineWidth: 0,
    speed: 1,
  }
  Object.assign(option, params);

  // 1、制造围墙
  let geometry = new FenceGeometry(option.points, option.height);
  let uTime = {value: 0};
  let mat = new THREE.ShaderMaterial({
    uniforms: {
      uBgColor: {
        value: new THREE.Color(option.bgColor)
      },
      uLineColor: {
        value: new THREE.Color(option.lineColor)
      },
      uCycle: {
        value: Math.PI * option.cycle
      },
      uDown: {
        value: option.lineWidth
      },
      uHeight: {
        value: option.height
      },
      uTime
    },
    vertexShader: `
    attribute float height;
    varying float vHeight;

    void main() {

      vHeight = height;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,
    fragmentShader: `
    #define PI 3.1415926//圆周率

    varying float vHeight;
    uniform float uCycle;
    uniform float uHeight;
    uniform float uDown;
    uniform float uTime;
    uniform vec3 uBgColor;
    uniform vec3 uLineColor;

    void main() {
      float w = 2.0 * PI / uCycle;
      float a = 1.0 + uDown;

      float d = abs(a * sin(w * (vHeight+uTime))) - uDown;

      float o = 1.0 - vHeight / uHeight;

      gl_FragColor = vec4(mix(uLineColor,uBgColor, d), o);

    }`,
    side: THREE.DoubleSide,
    transparent: true
  })
  let mesh = new THREE.Mesh(geometry, mat);
  mesh.name = 'fence';

  // 2、添加碰撞检测
  let meshAndBoxList: Array<{mesh: THREE.Object3D, box: THREE.Box3}> = [];
  for(let item of option.meshNameList){
    let mesh = (option.scene! as THREE.Scene).getObjectByName(item) as THREE.Object3D;
    let box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    box.setFromObject(mesh);
    meshAndBoxList.push({mesh, box});
  }

  let triangleList: Array<THREE.Triangle> = [];
  option.points.reduce((p1:any, p2) => {

    let p1TopPoint = new THREE.Vector3(p1.x, p1.y + option.height, p1.z),
        p2TopPoint = new THREE.Vector3().copy(p2).setY((p2 as any).y + option.height);

    let triangle1 = new THREE.Triangle(p1, p2, p2TopPoint),
        triangle2 = new THREE.Triangle(p1, p2TopPoint, p1TopPoint);
    
    triangleList.push(triangle1);
    triangleList.push(triangle2);

    return p2;
  })
  
  let uniforms = mat.uniforms as any;
  // 告警
  const warn = debounce(
    (mesh: THREE.Object3D) => {
      
      uniforms.uBgColor.value = new THREE.Color(
        option.warnBgColor
      );
      uniforms.uLineColor.value = new THREE.Color(
        option.warnLineColor
      );
      option.warnCallback(mesh);
    },
    150,
    { leading: true, trailing: false }
  );
  let obj = {
    mesh,
    isStarted: false,
    start(){
      this.isStarted = true;
      render();
    },
    stop(){
      this.isStarted = false;
    }
  }

  let clock = new THREE.Clock()
  function render() {

    obj.isStarted && requestAnimationFrame(render);

    uTime.value -= (clock.getDelta() * option.speed);
    // 1、更新包围盒
    for (let meshAndBox of meshAndBoxList) {
      meshAndBox.box.setFromObject(meshAndBox.mesh);
    }

    // 2、检测三角形是否与包围盒相撞
    for(let triangle of triangleList){

      for(let meshAndBox of meshAndBoxList){
        if (
          triangle.intersectsBox(meshAndBox.box)
        ) {
          warn(mesh);
          return;
        } 
      }
    } 
    uniforms.uBgColor.value = new THREE.Color(
      option.bgColor
    );
    uniforms.uLineColor.value = new THREE.Color(
      option.lineColor
    );

  }

  return obj;

}