/*
 * @Author: Wjh
 * @Date: 2022-12-25 23:27:55
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-22 08:42:30
 * @FilePath: \my-threejs-utils\src\effects\MyPathGeometry.ts
 * @Description:
 *
 */
import * as _ from "three";
import {
  BufferGeometry,
  Vector3,
  BufferAttribute,
  CurvePath
} from 'three'

class MyPathGeometry extends BufferGeometry {
  constructor(curve: CurvePath<Vector3>, divisions: number, halfWidth = 0.2, repeatY = 30) {
    super();

    const vertices: Array<number> = [];

    const up = new Vector3(0, 1, 0);
    const forward = new Vector3();
    const right = new Vector3();
    const left = new Vector3();

    const point = new Vector3();
    const prevPoint = new Vector3();
    prevPoint.copy(curve.getPointAt(0));

    const vector0 = new Vector3();
    const vector1 = new Vector3();
		let uv: Array<number> = [];

    let index: Array<number> = [];

    function extrudeShape(percent: number){
      
      vector0.copy(prevPoint);
      vector0.add(left);

      vector1.copy(prevPoint);
      vector1.add(right);

      vertices.push( vector0.x, vector0.y, vector0.z );
      vertices.push( vector1.x, vector1.y, vector1.z );

      uv = uv.concat([0, percent * repeatY, 1, percent * repeatY])
    }

    for (let i = 1; i <= divisions; i++) {
      let percent = i / divisions;
      point.copy(curve.getPointAt(percent));

      up.set(0, 1, 0);

      forward.subVectors(point, prevPoint).normalize();
      left.crossVectors(up, forward).normalize().multiplyScalar(halfWidth);
      right.copy(left).negate().normalize().multiplyScalar(halfWidth);
      up.crossVectors(forward, left);
      
      extrudeShape(i / (divisions+1));

			prevPoint.copy( point );
    }

    // 末尾再加两个点
    point.copy(curve.getPointAt(0.99999));
    up.set(0, 1, 0);
    forward.subVectors(prevPoint, point).normalize(); // 最后一个点朝向要变一下，因为最后一个point是curve最后一个点：curve.getPointAt(1)
    left.crossVectors(up, forward).normalize().multiplyScalar(halfWidth);
    right.copy(left).negate().normalize().multiplyScalar(halfWidth);
    
    extrudeShape(1);

    for(let i=0, len=vertices.length/3;i<len-2;i+=2){

      let p0 = i,
          p1 = i+1,
          p2 = (i+2) % len,
          p3 = (i+3) % len;
      
      index = index.concat([p0, p1, p3, p0, p3, p2]);
    }

		this.setAttribute( 'position', new BufferAttribute( new Float32Array( vertices ), 3 ) );
		this.setAttribute( 'uv', new BufferAttribute( new Float32Array( uv ), 2 ) );
    this.setIndex(index);
  
  }
}

export {
  MyPathGeometry
}

