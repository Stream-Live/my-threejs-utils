/*
 * @Author: Wjh
 * @Date: 2023-02-01 16:28:29
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-08 13:48:27
 * @FilePath: \my-threejs-utils\src\effects\AnimationPath.ts
 * @Description: 
 * 
 */

import * as THREE from 'three'
import { getCurvePathByPoints } from '../utils'
/**
 * @description: 创建运动路径
 * @param {Array<{x: number, y: number, z: number}>} points [] 点数组
 * @param {Boolean} isClosed false   是否闭合曲线
 * @param {number} radius 0.5  圆角，范围 0-1
 * @param {number} mesh  null 要运动的 Mesh 或 Group
 * @param {number} divisions  0.1 运动速度
 * @param {number} speed  200 分段数
 * @param {boolean} isRepeat  false 是否重复
 * @return {*}
 */
export function CreateAnimationPath(params: {
  points: Array<{x: number, y: number, z: number}>,
  isClosed?: boolean, // 是否闭合曲线
  radius?: number,     // 圆角，范围是0-1，实际意义是利用占比radius的线条来画圆角
  mesh?: THREE.Mesh | THREE.Group,
  divisions?: number, // 分段数
  speed?: number, // 运动速度
  isRepeat?: boolean, // 是否重复运动
}): {
  start: () => void,
  stop: () => void,
  isStarted: Boolean,
  line: THREE.Line,
}{
  const option = {
    points: [],
    isClosed: false,
    radius: 0.5, // 范围0-1，实际意义是圆角的贝塞尔曲线控制点，贝塞尔曲线的起始终止点都是 1
    mesh: null,
    divisions: 200,
    speed: 0.1,
    isRepeat: false,
  };

  Object.assign(option, params || {});

  let curvePath = getCurvePathByPoints(option.points, option.radius, option.isClosed)

  const line = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffff00 })
  );
  line.name = 'animation_line';
  let positionArray: Array<number> = [];

  const obj = {
    line,
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
  let percent = 0;
  let isDrawLine = true;
  function render() {
    obj.isStarted && option.mesh && requestAnimationFrame(render);

    let delta = clock.getDelta() * option.speed;

    percent = (percent + delta) % 1;

    // 0.99就够了，剩下的0.01留给看向前方的点
    if(!option.isRepeat && percent >= 0.99){
      obj.isStarted = false;
      return
    }
    let pos = curvePath.getPointAt(percent);
    (option.mesh! as THREE.Mesh).position.copy(pos)

    // 看向前方
    let prePercent = percent+0.01 > 1 ? 1 : (percent+0.01);
    let targetPosition = curvePath.getPointAt(prePercent);
    (option.mesh! as THREE.Mesh).lookAt(targetPosition.x, targetPosition.y, targetPosition.z);

    // 只允许写一圈线的点坐标
    if(isDrawLine){
      positionArray.push(pos.x);
      positionArray.push(pos.y);
      positionArray.push(pos.z);
      line.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionArray), 3));
    }
    
    if(percent == 1) isDrawLine = false;
  }

  return obj
}