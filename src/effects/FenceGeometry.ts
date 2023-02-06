
import * as THREE from "three";

class FenceGeometry extends THREE.BufferGeometry{

  constructor(points: Array<{x: number, y: number, z: number}>, height: number){
    super();

    let positions: Array<number> = [], index: Array<number> = [], heights: Array<number> = [];

    for(let item of points){
      positions.push(item.x);
      positions.push(item.y);
      positions.push(item.z);

      positions.push(item.x);
      positions.push(item.y + height);
      positions.push(item.z);

      
      heights.push(0);
      heights.push(height);
    }

    for(let i=0, len=positions.length/3; i<len-2; i+=2){

      let p1 = i,
          p2 = i+1,
          p3 = i+2,
          p4 = i+3;
      
      index = index.concat([p1, p3, p4, p1, p4, p2])
      
    }

		this.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
		this.setAttribute( 'height', new THREE.BufferAttribute( new Float32Array( heights ), 1 ) );
    this.setIndex(index);
  }
}
export {
  FenceGeometry
}