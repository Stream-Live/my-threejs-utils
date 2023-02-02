/*
 * @Author: Wjh
 * @Date: 2023-02-02 13:37:38
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-02 16:31:40
 * @FilePath: \my-threejs-utils\src\effects\Virtual.ts
 * @Description: 
 * 
 */

import * as THREE from 'three'

/**
 * @description: 利用 EdgesGeometry 虚化 Object3D
 * @param {string} name   要虚化 的物体名称
 * @param {THREE} scene   场景
 * @param {boolean} isVirtual   切换到指定的虚化状态
 * @param {object} params   color：线框颜色（默认'#00ffff'），opacity：线框透明度（默认0.1）
 * @return {*}
 */
export function ToggleVirtualByEdgesGeometry(name: string, scene: THREE.Scene, isVirtual?: boolean, params?: {
  color: string,
  opacity: number,
}): boolean | undefined {
  let _mesh: THREE.Object3D = scene.getObjectByName(name) as THREE.Object3D;

  if(!_mesh){
    console.warn('场景里没有'+name)
    return
  }
  const option = {
    color: '#00ffff',
    opacity: 0.1,
  }
  Object.assign(option, params || {})

  let userData = _mesh.userData as {isVirtual: boolean};

  // 如果有传isVirtual
  if(isVirtual != undefined){
    if(isVirtual === true && !userData.isVirtual){
      virtual(_mesh)
      return
    }
    if(isVirtual === false && userData.isVirtual){
      restore(_mesh)
      return
    }
    
  // 如果没有传isVirtual
  }else{
    if (userData.isVirtual) {
      restore(_mesh)
    } else {
      virtual(_mesh)
    }
  }
  // 虚化
  function virtual(_mesh: THREE.Object3D){
    userData.isVirtual = true;
    _mesh.traverse((mesh: any) => {
      if (mesh?.isMesh) {
        let lineGeometry = new THREE.EdgesGeometry(mesh.geometry);
        let line = new THREE.LineSegments(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(option.color),
            opacity: option.opacity,
            transparent: true,
          })
        );
        line.name = mesh.uuid+'线框';
        mesh.parent.add(line);
        mesh.visible = false;
      }
    });
  }
  // 还原
  function restore(_mesh: THREE.Object3D){
    userData.isVirtual = false;
    let list: Array<THREE.Object3D> = []
    _mesh.traverse((mesh: any) => {
      if (mesh?.isMesh) {
        let line = scene.getObjectByName(mesh.uuid+'线框') as THREE.Object3D;
        list.push(line);
        mesh.visible = true;
      }
    });
    list.forEach(line => {
      line.removeFromParent();
    })
  }

  return userData.isVirtual;

}
/**
 * @description: 利用 wireframe + shader 虚化 Object3D
 * @param {string} name   要虚化 的物体名称
 * @param {THREE} scene   场景
 * @param {boolean} isVirtual   切换到指定的虚化状态
 * @param {object} params   color：线框颜色（默认'#00ffff'），opacity：线框透明度（默认0.1）
 * @return {*}
 */
export function ToggleVirtualByWireframe(name: string, scene: THREE.Scene, isVirtual?: boolean, params?: {
  color: string,
  opacity: number,
}): boolean | undefined {
  let _mesh: THREE.Object3D = scene.getObjectByName(name) as THREE.Object3D;

  if(!_mesh){
    console.warn('场景里没有'+name)
    return
  }
  const option = {
    color: '#00ffff',
    opacity: 0.1,
  }
  Object.assign(option, params || {})

  let userData = _mesh.userData as {isVirtual: {value: number}};

  if(userData.isVirtual == undefined){
    userData.isVirtual = {value: 0};
    _mesh.traverse((mesh: any) => {
      if (mesh?.material?.isMaterial) {
        mesh.material.transparent = true;

        mesh.material.onBeforeCompile = (shader: any) => {
          const uniforms = {
            isVirtual: userData.isVirtual,
            uOpacity: {value: option.opacity},
            uColor: {value: new THREE.Color(option.color)}
          };
          Object.assign(shader.uniforms, uniforms);
          const fragment = `
            uniform float isVirtual;
            uniform float uOpacity;
            uniform vec3 uColor;
            void main(){
          `
          const fragmentColor = `
              if(isVirtual == 1.0){
                gl_FragColor = vec4(uColor, uOpacity);
              }
            }
          `;
          shader.fragmentShader = shader.fragmentShader.replace(
            "void main() {",
            fragment
          )

          shader.fragmentShader = shader.fragmentShader.replace(
            "}",
            fragmentColor
          );
        }
      }
    })
  }

  // 如果有传isVirtual
  if(isVirtual != undefined){
    if(isVirtual === true && !userData.isVirtual.value){
      virtual()
      return
    }
    if(isVirtual === false && userData.isVirtual.value){
      restore()
      return
    }
    
  // 如果没有传isVirtual
  }else{
    if (userData.isVirtual.value) {
      restore()
    } else {
      virtual()
    }
  }

  // 虚化
  function virtual(){
    userData.isVirtual.value = 1;
    _mesh.traverse((mesh: any) => {
      if (mesh?.material?.isMaterial) {
        mesh.material.wireframe = true;
      }
    });

  }
  // 还原
  function restore(){
    userData.isVirtual.value = 0;
    _mesh.traverse((mesh: any) => {
      if (mesh?.material?.isMaterial) {
        mesh.material.wireframe = false;
      }
    });
  }
  return Boolean(userData.isVirtual.value);
}
