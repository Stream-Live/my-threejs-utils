/*
 * @Author: Wjh
 * @Date: 2023-01-31 16:28:46
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-01 17:40:39
 * @FilePath: \my-threejs-utils\src\effects\Path.ts
 * @Description: 
 * 
 */
import {
  DoubleSide,
  Mesh,
  Clock,
  TextureLoader,
  RepeatWrapping,
  ShaderMaterial,
} from 'three'
import { MyPathGeometry } from './MyPathGeometry'
import { getCurvePathByPoints } from '../utils'
/**
 * @description: 创建贴图道路
 * @param {Array<{x: number, y: number, z: number}>} points [] 点数组
 * @param {string} imgUrl "" 图片url
 * @param {Boolean} isClosed false 是否闭合曲线
 * @param {number} radius 0.5 圆角，范围 0-1
 * @param {number} divisions 200 分段数，默认200
 * @return {*}
 */
export function CreatePath(params: {
  points: Array<{x: number, y: number, z: number}>,
  imgUrl: String, // 贴图路径
  isClosed?: Boolean,
  radius?: number, // 范围0-1，实际意义是圆角的贝塞尔曲线控制点，贝塞尔曲线的起始终止点都是 1
  divisions?: number, // 默认分段数
}): {
  start: () => void,
  stop: () => void,
  isStarted: Boolean,
  path: Mesh,
}{
  let option = {
    points: [],
    imgUrl: "", // 贴图路径
    isClosed: false,
    radius: 0.5, // 范围0-1，实际意义是圆角的贝塞尔曲线控制点，贝塞尔曲线的起始终止点都是 1
    divisions: 200, // 默认分段数
  };
  Object.assign(option, params);

  let curvePath = getCurvePathByPoints(option.points, option.radius, option.isClosed);
  
  let pathGeometry = new MyPathGeometry(curvePath, option.divisions);

  let bg: {value: any} = {value: null};
    new TextureLoader().load(option.imgUrl, (texture => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      bg.value = texture;
    }))

  let transformY = {
    value: 0
  }

  let material = new ShaderMaterial({
    uniforms: {
      bg,
      transformY
    },
    vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    uniform sampler2D bg;
    varying vec2 vUv;
    uniform float transformY;
    void main(){
      gl_FragColor = texture2D(bg, vec2(vUv.x, vUv.y + transformY));
    }
    
    `,
    side: DoubleSide,
    transparent: true,
  });

  let path = new Mesh(pathGeometry, material);
  path.name = 'path';

  let clock = new Clock();

  const obj = {
    path,
    isStarted: false,
    start(){
      this.isStarted = true;
      render();
    },
    stop(){
      this.isStarted = false;
    },
  }

  function render() {
    obj.isStarted && requestAnimationFrame(render);

    transformY.value -= clock.getDelta();
  }

  return obj
}