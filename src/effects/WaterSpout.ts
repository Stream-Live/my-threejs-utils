
import * as THREE from 'three'
/**
 * @description: 
 * @param {string} length 8 水柱的长度
 * @param {string} height  7  水柱的高度
 * @param {string} width  1  底部矩形的宽
 * @param {string} depth  2  底部矩形的高
 * @param {string} widthSegment  4  底部矩形的宽度分段数
 * @param {string} depthSegment  4  底部矩形的高度分段数
 * @param {string} color  '#ffffff'   水柱颜色
 * @param {string} opacity  0.8   水柱的透明度
 * @param {string} dashSize  0.2    每段虚线的长度
 * @param {string} gapSize  0.1   每段虚线的间隔
 * @param {string} speed  1   虚线移动的速度
 * @return {*}
 */
export function CreateWaterSpout(params?: {
  length?: number,  
  height?: number,  
  width?: number,   
  depth?: number,  
  widthSegment?: number,  
  depthSegment?: number, 
  color?: number,  
  opacity?: number,     
  dashSize?: number,    
  gapSize?: number,     
  speed?: number,   
}): {
  start: () => void,
  stop: () => void,
  isStarted: Boolean,
  group: THREE.Group,
  plane: THREE.Mesh,
}{
  const defOption = {
    length: 8,  
    height: 7,  
    width: 1,   
    depth: 2,  
    widthSegment: 4,  
    depthSegment: 4, 
    color: '#ffffff',  
    opacity: 0.8,     
    dashSize: 0.2,    
    gapSize: 0.1,     
    speed: 1,      
  }

  const option = Object.assign(defOption, params || {})

  let plane = new THREE.Mesh(
    new THREE.PlaneGeometry(option.width, option.depth, option.widthSegment,option.depthSegment), 
    new THREE.MeshLambertMaterial({
      color: 0x0000ff,
      wireframe: true,
    })
  ); 
  plane.name = 'waterspout_plane'
  plane.rotateX(Math.PI * 0.5);
  plane.position.x = option.length;
  plane.updateMatrixWorld();

  let points: Array<THREE.Vector3> = [];
  let array = plane.geometry.getAttribute('position').array
  for(let i=0; i< array.length; i+= 3){
    let p = new THREE.Vector3(array[i], array[i+1], array[i+2]);
    p.applyMatrix4(plane.matrixWorld)
    points.push(p)
  }

  let material = new THREE.LineDashedMaterial({
    color: new THREE.Color(option.color), 
    dashSize: option.dashSize, 
    gapSize: option.gapSize, 
    transparent: true, 
    opacity: option.opacity,
  });
  let time = {value: 0};
  material.onBeforeCompile = shader => {

    let uniforms = {time};
    Object.assign(shader.uniforms, uniforms);

    const vertex = `
      uniform float time;
      void main() {
    `
    const vertexShader = `
      vLineDistance = scale * lineDistance + time;
    `
    shader.vertexShader = shader.vertexShader.replace('void main() {', vertex)
    shader.vertexShader = shader.vertexShader.replace('vLineDistance = scale * lineDistance', vertexShader)
  }

  const group = new THREE.Group();
  group.name = 'waterspout';

  const start = new THREE.Vector3(0,option.height,0);

  for(let end of points){

    let d1 = start,
        d2 = new THREE.Vector3((start.x + end.x) / 2,start.y, (start.z + end.z) / 2),
        d3 = new THREE.Vector3(end.x, (start.y + end.y) / 2, end.z),
        d4 = end;

    let line = new THREE.CubicBezierCurve3(d1, d2, d3, d4);

    const linePoints = line.getPoints(50);
    const curveObject = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePoints),
      material
    )
    curveObject.computeLineDistances();
    group.add(curveObject)
  }

  const obj = {
    group,
    plane,
    isStarted: false,
    start(){
      this.isStarted = true;
      render();
    },
    stop(){
      this.isStarted = false;
    },
  }
  let clock = new THREE.Clock();
  function render() {
    obj.isStarted && requestAnimationFrame(render);

    time.value -= clock.getDelta() * option.speed;
  }
  return obj;
}