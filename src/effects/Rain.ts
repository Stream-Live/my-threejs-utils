/*
 * @Author: Wjh
 * @Date: 2023-02-01 11:20:05
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-01 17:28:00
 * @FilePath: \my-threejs-utils\src\effects\Rain.ts
 * @Description: 
 * 
 */
import * as THREE from 'three'

/**
 * @description: 创建下雨
 * @param {number} width 宽，默认100 
 * @param {number} height 高，默认100 
 * @param {number} depth 深，默认100 
 * @param {number} maxSpeed 雨滴下落最大速度，默认0.9
 * @param {number} minSpeed 雨滴下落最小速度，默认0.1
 * @param {number} length 每个雨滴的长度，默认1
 * @param {number} opacity 雨滴的透明度，默认0.9
 * @return {*}
 */
export function CreateRain( params?: {
  width?: number,  // 立方体雨的宽
  height?: number,   // 立方体雨的高
  depth?: number,    // 立方体雨的深
  maxSpeed?: number,  // 雨滴下落最大速度
  minSpeed?: number,  // 雨滴下落最小速度 
  length?: number,     // 每个雨滴的长度
  opacity?: number,   // 雨滴的透明度
}): {
  group: THREE.Group,   // 雨滴的group
  isStarted: Boolean,   
  start: () => void,    // 开始下雨
  stop: () => void,     // 暂停下雨
}{

  const defOption = {
    width: 100,
    height: 100,
    depth: 100,
    maxSpeed: 1.5,  // 雨滴下落最大速度
    minSpeed: 0.2,  // 雨滴下落最小速度 
    length: 1,     // 每个雨滴的长度
    opacity: 0.9,   // 雨滴的透明度
  }

  const option = Object.assign(defOption, params || {})

  let box = new THREE.Mesh(
    new THREE.BoxGeometry(option.width, option.height/2, option.depth),
    new THREE.MeshLambertMaterial({ color: 0xffff00 })
  );

  box.geometry.computeBoundingBox();

  let { min, max } = box.geometry.boundingBox as {min: THREE.Vector3, max: THREE.Vector3};

  const lineMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: option.opacity,
  });
  const group = new THREE.Group();
  group.name = 'rain_group';

  for (let i = 0; i < 1000; i++) {
    const pos = new THREE.Vector3();
    pos.x = Math.random() * (max.x - min.x + 1) + min.x;
    pos.y = Math.random() * (max.y - min.y + 1) + min.y;
    pos.z = Math.random() * (max.z - min.z + 1) + min.z;

    const points: Array<THREE.Vector3> = [];
    points.push(pos);
    points.push(new THREE.Vector3(pos.x, pos.y + option.length, pos.z));
    let g = new THREE.BufferGeometry().setFromPoints(points);
    let mesh = new THREE.Line(g, lineMat);
    mesh.name = "line_" + i;
    group.add(mesh);
  }

  group.children.forEach(_mesh => {
    
    let delta = Math.random() * (max.y - min.y + 1) + min.y;
    if(Math.random() > 0.5) _mesh.position.y += delta;
    else _mesh.position.y -= delta;
  })

  const obj = {
    group,
    isStarted: false,
    start(){
      this.isStarted = true;
      render();
    },
    stop(){
      this.isStarted = false;
    },
  }

  function render(){
    obj.isStarted && requestAnimationFrame(render);
    
    group.children.forEach((_mesh) => {

      _mesh.position.y -= Math.random() * (option.maxSpeed - option.minSpeed + 1) + option.minSpeed;
      if (_mesh.position.y < min.y) {
        _mesh.position.y = max.y;
      }
    });
  }
  return obj;
}