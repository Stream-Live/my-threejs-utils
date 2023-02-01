/*
 * @Author: Wjh
 * @Date: 2023-02-01 16:21:34
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-01 17:20:37
 * @FilePath: \my-threejs-utils\src\utils.ts
 * @Description: 
 * 
 */

import * as THREE from 'three'

/**
 * @description: 根据点数组获取 THREE.CurvePath
 * @param {Array} points    点数组
 * @param {number} radius   圆角，范围 0-1
 * @param {boolean} isClosed  是否闭合曲线
 * @return {*}
 */
export function getCurvePathByPoints(points:Array<{x: number, y: number, z: number}>, radius: number, isClosed: boolean): THREE.CurvePath<THREE.Vector3>{

  let vec3Points: Array<THREE.Vector3> = points.map((item) => new THREE.Vector3().set(item.x, item.y, item.z));
  let curvePath = new THREE.CurvePath<THREE.Vector3>();
  let linePoints: Array<THREE.Vector3> = [];

  // 1、算出每个点对应的贝塞尔曲线需要的四个点
  for (let i = 0; i < vec3Points.length; i++) {
    let p1 = vec3Points[i] as THREE.Vector3,
      p2 = vec3Points[(i + 1) % vec3Points.length] as THREE.Vector3;

    let side = new THREE.Vector3().subVectors(p2, p1).normalize();

    let p11 = new THREE.Vector3().addVectors(p1, side);
    let p12 = new THREE.Vector3().addVectors(
      p1,
      new THREE.Vector3().copy(side).multiplyScalar(radius)
    );
    let p22 = new THREE.Vector3().addVectors(
      p2,
      new THREE.Vector3().copy(side).negate()
    );
    let p23 = new THREE.Vector3().addVectors(
      p2,
      new THREE.Vector3().copy(side).negate().multiplyScalar(radius)
    );

    // 顺时针
    linePoints.push(p12);
    linePoints.push(p11);
    linePoints.push(p22);
    linePoints.push(p23);
  }
  // 2、把上面算出的点连起来
  if(isClosed){

    for (let i = 0; i < linePoints.length; i += 4) {
      // 贝塞尔曲线
      let p1 = linePoints[(i + 1) % linePoints.length] as THREE.Vector3,
        p2 = linePoints[(i + 2) % linePoints.length] as THREE.Vector3,
        p3 = linePoints[(i + 3) % linePoints.length] as THREE.Vector3,
        p4 = linePoints[(i + 4) % linePoints.length] as THREE.Vector3,
        p5 = linePoints[(i + 5) % linePoints.length] as THREE.Vector3;

      let straight = new THREE.LineCurve3(p1, p2);
      curvePath.add(straight);

      let beize = new THREE.CubicBezierCurve3(p2, p3, p4, p5);
      curvePath.add(beize);
    }
  }else{
    let p1 = vec3Points[0] as THREE.Vector3,
        p2 = linePoints[1] as THREE.Vector3;
    let straight1 = new THREE.LineCurve3(p1, p2);
    curvePath.add(straight1);

    for (let i = 0; i < linePoints.length - 8; i += 4) {
      // 贝塞尔曲线
      let p1 = linePoints[(i + 1) % linePoints.length] as THREE.Vector3,
        p2 = linePoints[(i + 2) % linePoints.length] as THREE.Vector3,
        p3 = linePoints[(i + 3) % linePoints.length] as THREE.Vector3,
        p4 = linePoints[(i + 4) % linePoints.length] as THREE.Vector3,
        p5 = linePoints[(i + 5) % linePoints.length] as THREE.Vector3;

      let straight = new THREE.LineCurve3(p1, p2);
      curvePath.add(straight);

      let beize = new THREE.CubicBezierCurve3(p2, p3, p4, p5);
      curvePath.add(beize);
    }
    let p3 = linePoints[linePoints.length - 7] as THREE.Vector3,
        p4 = vec3Points[vec3Points.length - 1] as THREE.Vector3;
    let straight = new THREE.LineCurve3(p3, p4);
    curvePath.add(straight);

  }
  return curvePath;
}