/*
 * @Author: Wjh
 * @Date: 2023-02-01 16:21:34
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-07 13:33:11
 * @FilePath: \my-threejs-utils\src\utils.ts
 * @Description: 
 * 
 */

import * as THREE from 'three'

/**
 * @description: 根据点数组获取道路的 THREE.CurvePath
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

/**
   * @description: 标签撞墙自动移位
   * @param {Array} polygonPoints 多边形数组，有几个多边形就传几个多边形的点数组
   * @param {Array} labelList  标签列表
   * @param {number} distance 撞墙后需要往内移动多少距离
   * @return {*}
   */
export function computeLabelPosition(polygonPoints: Array<Array<{ x: number; z: number }>>, labelList: Array<THREE.Mesh>, distance: number) {
  let arr: Array<{
    arrVectors: Array<THREE.Vector2>;
    sideArray: Array<{ curP: THREE.Vector2; nextP: THREE.Vector2; centerP: THREE.Vector2; normal: THREE.Vector3 }>;
  }> = [];

  for (let item of polygonPoints) {
    let arrVectors = item.map((it) => new THREE.Vector2(it.x, it.z));

    // 1、根据点数组创建多边形平面
    let shape = new THREE.Shape(arrVectors);
    let plane = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color: 0x00ffff, side: THREE.DoubleSide }));
    plane.rotateX(Math.PI * 0.5);
    plane.name = '多边形';

    // 2、得到中心点
    plane.geometry.computeBoundingSphere();
    let { center } = plane.geometry.boundingSphere as {center: THREE.Vector3};
    let centerP = new THREE.Vector2(center.x, center.y);

    // 3、准备多边形每条边的数据
    let up = new THREE.Vector3(0, 1, 0);
    let sideArray: Array<{curP: THREE.Vector2, nextP: THREE.Vector2, centerP: THREE.Vector2, normal: THREE.Vector3, sign: number}> = [];

    for (let i = 0; i < item.length; i++) {
      let curP = new THREE.Vector2(item[i]!.x, item[i]!.z);
      let nextIndex = (i + 1) % item.length;
      let nextP = new THREE.Vector2(item[nextIndex]!.x, item[nextIndex]!.z);

      // 得到边的二维向量
      let side2 = new THREE.Vector2();
      side2.subVectors(nextP, curP);
      let center = new THREE.Vector2();
      center.subVectors(nextP, centerP);

      let sign = side2.cross(center) > 0 ? 1 : -1;

      // 得到边的向量
      let side = new THREE.Vector3();
      side.subVectors(
        new THREE.Vector3(nextP.x, 0, nextP.y),
        new THREE.Vector3(curP.x, 0, curP.y)
      );

      // 得到法向量
      let normal = new THREE.Vector3();
      normal
        .crossVectors(up, side)
        .normalize()
        .multiplyScalar(Math.abs(distance) * sign);

      sideArray.push({ curP, nextP, centerP, normal, sign });
    }

    arr.push({
      arrVectors,
      sideArray,
    });
  }

  // 4、检测标签是否撞墙，是的话自动移位
  labelList.forEach((mesh) => {
    let p = new THREE.Vector2(mesh.position.x, mesh.position.z);

    // 给标签构造一个最大包围矩形
    mesh.geometry.computeBoundingBox();
    let { min, max } = mesh.geometry.boundingBox as {min: THREE.Vector3, max: THREE.Vector3};

    let r1 = (max.x - min.x) / 2,
      r2 = (max.z - min.z) / 2,
      r = r1 > r2 ? r1 : r2;

    let points = [
      new THREE.Vector2(mesh.position.x - r, mesh.position.z - r), 
      new THREE.Vector2(mesh.position.x - r, mesh.position.z + r), 
      new THREE.Vector2(mesh.position.x + r, mesh.position.z - r), 
      new THREE.Vector2(mesh.position.x + r, mesh.position.z + r)
    ];
    for (let { arrVectors, sideArray } of arr) {
      let booleanArr: Array<boolean> = [];
      points.forEach((item) => {
        booleanArr.push(isPointInPolygon(item, arrVectors));
      });

      // 包围矩形的四个点 全在该多边形区域内
      if (booleanArr.every((item) => item)) {
        // to do
        // 包围矩形的四个点 全不在矩形内
      } else if (booleanArr.every((item) => !item)) {
        // to do
        // 包围矩形的四个点 不全在多边形区域内
      } else {
        for (let i = 0; i < sideArray.length; i++) {
          let item = sideArray[i] as {curP: THREE.Vector2, nextP: THREE.Vector2, centerP: THREE.Vector2, normal: THREE.Vector3, sign: number};

          let { curP, nextP, centerP, normal } = item;

          // 该标签属于当前的边
          if (isPointInPolygon(p, [curP, nextP, centerP])) {
            // 移动标签位置
            mesh.position.add(normal);
          }
        }
      }
    }
  });

  // 判断一个点是否在多边形内
  // point: Vector2, polygonPoints: Array<Vector2>
  function isPointInPolygon(point: THREE.Vector2, polygonPoints: Array<THREE.Vector2>) {
    let _arr = [],
      len = polygonPoints.length;
    for (let i = 0; i < len; i++) {
      let cur = polygonPoints[i] as THREE.Vector2;
      let next = polygonPoints[(i + 1) % len] as THREE.Vector2;
      let line = new THREE.Vector2();
      line.subVectors(next, cur);

      let pointLine = new THREE.Vector2();
      pointLine.subVectors(point, cur);

      let is = line.cross(pointLine);
      _arr.push(is);
    }

    return _arr.every((item) => item >= 0) || _arr.every(item => item <= 0);
  }
}

/**
 * @description: 获取颜色的线性插值
 * @param {string} start  开始颜色
 * @param {string} end  结束颜色
 * @param {number} steps  颜色分解 次数
 * @param {number} gamma  暂时理解为透明一点（伽马）
 * @return {*}
 */
export function getGradientColors(start: string, end: string, steps: number, gamma?: number): Array<string>{
  let parseColor = function (hexStr: any) {
    return hexStr.length === 4
      ? hexStr
          .substr(1)
          .split("")
          .map(function (s: any) {
            return 0x11 * parseInt(s, 16);
          })
      : [hexStr.substr(1, 2), hexStr.substr(3, 2), hexStr.substr(5, 2)].map(
          function (s) {
            return parseInt(s, 16);
          }
        );
  };

  // zero-pad 1 digit to 2
  let pad = function (s: any) {
    return s.length === 1 ? "0" + s : s;
  };

    let i,
      j,
      ms,
      me,
      output = [],
      so = [];
    gamma = gamma || 1;
    var normalize = function (channel: any) {
      return Math.pow(channel / 255, (gamma as any));
    };
    start = parseColor(start).map(normalize);
    end = parseColor(end).map(normalize);
    for (i = 0; i < steps; i++) {
      ms = i / (steps - 1);
      me = 1 - ms;
      for (j = 0; j < 3; j++) {
        so[j] = pad(
          Math.round(
            Math.pow((start[j] as any) * me + (end[j] as any) * ms, 1 / gamma) * 255
          ).toString(16)
        );
      }
      output.push("#" + so.join(""));
    }
    return output;
  
}