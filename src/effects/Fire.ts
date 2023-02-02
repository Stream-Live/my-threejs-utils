/*
 * @Author: Wjh
 * @Date: 2023-02-02 09:13:15
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-02 13:57:02
 * @FilePath: \my-threejs-utils\src\effects\Fire.ts
 * @Description: 
 * 
 */

import * as THREE from 'three'
import Geometry from "../fire-libs/Geometry";
import Material from "../fire-libs/Material";

/**
 * @description: 创建火
 * @param {camera}  null
 * @param {fireRadius}  0.5
 * @param {fireHeight}  3
 * @param {particleCount}   400
 * @param {color}   '#ff2200'
 * @return {*}
 */
export function CreateFire(params: {
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  fireRadius?: number,
  fireHeight?: number,
  particleCount?: number,
  color?: string,
}): {
  start: () => void,
  stop: () => void,
  isStarted: Boolean,
  points: THREE.Points,
}{
  const option = {
    fireRadius: 0.5,
    fireHeight: 3,
    particleCount: 400,
    color: '#ff2200',
    camera: null,
  }
  Object.assign(option, params);

  let height = window.innerHeight;
  let geometry0 = new Geometry(option.fireRadius, option.fireHeight, option.particleCount) as THREE.BufferGeometry;
  let material0 = new Material({ color: new THREE.Color(option.color) }) as any;
  material0.setPerspective((option.camera as any)!.fov, height);
  let points = new THREE.Points(geometry0, material0);

  const obj = {
    points,
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
  function render(){
    
    obj.isStarted && requestAnimationFrame(render);

    points.material.update(clock.getDelta() * 0.75);
  }
  return obj
}