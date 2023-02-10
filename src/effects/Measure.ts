import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { getThreePointByScreenPoint } from '../utils'

export function MeasureDistance(params: {
  renderer: THREE.WebGLRenderer, 
  scene: THREE.Scene,
  camera: THREE.Camera, 
  controls: OrbitControls,
}){
  let meshList: Array<THREE.Mesh> = [];
  let spriteList: Array<THREE.Sprite> = [];
  let lengthSprite: THREE.Sprite | null;
  let dragControls: DragControls;
  let boxColor = new THREE.Color("#0000ff");
  let curvePath = new THREE.CurvePath();
  let line: THREE.Line | null;
  let group = new THREE.Group();

  const getCanvasByDistance = (text: string) => {
    const fontSize = 30;

    // 绘制canvas
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.scale(window.devicePixelRatio , window.devicePixelRatio );
    const setCanvasSize = (w: number, h: number) => {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
    }
    let textWidth = ctx.measureText(text).width * 2;
    setCanvasSize(textWidth * 2, textWidth);
    
    // 矩形背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 文字
    ctx.font = `${fontSize}px DIN,sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text,textWidth, textWidth/2);

    return {canvas, scaleY: (1 / (textWidth * 2)) * canvas.height};
  }

  const updateSprite = (sprite: THREE.Sprite, p1: THREE.Vector3, p2: THREE.Vector3) => {

    // 获取中心点和文字内容
    let centerP = new THREE.Vector3((p1.x+p2.x)/2, (p1.y+p2.y)/2, (p1.z+p2.z)/2);
    const text = `${p1.distanceTo(p2).toFixed(2)}米`;
    
    // 绘制canvas
    let {canvas, scaleY} = getCanvasByDistance(text);
    
    // 绘制精灵
    sprite.material.map = new THREE.CanvasTexture(canvas);
    sprite.position.copy(centerP);
    sprite.scale.y = scaleY;

  }

  const updateLengthSprite = () => {
    // 计算总长度
    let total = 0;
    for(let i=0; i< meshList.length-1; i++){
      let p1 = meshList[i]!.position,
          p2 = meshList[i+1]!.position;
      total += (+p1.distanceTo(p2).toFixed(2));
    }
    // 绘制canvas
    let {canvas, scaleY} = getCanvasByDistance(`${total.toFixed(2)}米`);
    // 绘制精灵
    lengthSprite!.material.map = new THREE.CanvasTexture(canvas);
    let pos = meshList[meshList.length-1]!.position;
    lengthSprite!.position.set(pos.x, pos.y+0.7, pos.z);
    lengthSprite!.scale.y = scaleY;
  }

  const addPointByPosition = (position: THREE.Vector3) => {
    // 添加一个点
    let box = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: boxColor })
    );

    box.position.copy(position);

    group.add(box);
    meshList.push(box);
    box.name = '点'+meshList.length;
    console.log(meshList.map(item => item.position));

    // 添加一条线
    let len = meshList.length;
    if(len > 1){
      let p1 = meshList[len-2]!.position,
        p2 = meshList[len-1]!.position;
      
      // 添加一条线
      const lineCurve = new THREE.LineCurve3(p1, p2);
      curvePath.add(lineCurve);
      const points = curvePath.getPoints(curvePath.getLength()) as Array<THREE.Vector3>;
      line!.geometry.setFromPoints(points);
      line!.frustumCulled = false;  // 防止对线进行视锥体剔除

      // 添加每条线上的精灵
      let sprite = new THREE.Sprite(new THREE.SpriteMaterial());
      updateSprite(sprite, p1, p2);
      spriteList.push(sprite);
      group.add(sprite);

      // 添加总长度精灵
      if(!lengthSprite){
        lengthSprite = new THREE.Sprite(new THREE.SpriteMaterial());
        group.add(lengthSprite);
      }
      updateLengthSprite();
    }
  }

  let dragstart = (event: any) => {
    params.controls.enabled = false;
  };

  let dragend = (event: any) => {
    params.controls.enabled = true;
    
    console.log(meshList.map(item => item.position));
    
  };

  let drag = () => {
    // 更新线条和文字内容
    if (line) {
      const points = curvePath.getPoints(curvePath.getLength()) as Array<THREE.Vector3>;
      line.geometry.setFromPoints(points);
      
      for(let i=0; i< meshList.length-1; i++){
        let p1 = meshList[i]!.position,
            p2 = meshList[i+1]!.position;
        
        spriteList[i]!.position.set((p1.x+p2.x)/2, (p1.y+p2.y)/2, (p1.z+p2.z)/2);
        updateSprite(spriteList[i]!, p1, p2);
      }
      updateLengthSprite();
    }
  }

  // 右击新增
  const rightclick = (e: any) => {
    if (e.button == 2) {

      const x = e.clientX;
      const y = e.clientY;
      addPointByPosition(getThreePointByScreenPoint(params.renderer, params.camera, x, y));

    }
  };

  const start = () => {
    meshList = [];
    spriteList = [];

    window.addEventListener("mousedown", rightclick);

    dragControls = new DragControls(
      meshList,
      params.camera,
      params.renderer.domElement
    );
    dragControls.addEventListener("dragstart", dragstart);
    dragControls.addEventListener("dragend", dragend);
    dragControls.addEventListener("drag", drag);
    
    curvePath = new THREE.CurvePath();
    line = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );
    group = new THREE.Group();
    group.name = '路径绘制组'
    params.scene.add(group);
    group.add(line);
  };
  const end = () => {
    meshList.forEach((item) => item.removeFromParent());
    meshList = [];
    spriteList.forEach((item) => item.removeFromParent());
    spriteList = [];

    window.removeEventListener("mousedown", rightclick);

    dragControls.removeEventListener("dragstart", dragstart);
    dragControls.removeEventListener("dragend", dragend);
    dragControls.removeEventListener("drag", drag);
    dragControls.dispose();

    lengthSprite?.clear();
    lengthSprite = null;
    line?.removeFromParent();
    line?.clear();
    group.removeFromParent();
    group.clear();
  };

  // 根据点数组添加路径
  const addPath = (points: Array<{x: number, y: number, z: number}>) => {
    start();
    for(let item of points){
      addPointByPosition(new THREE.Vector3(item.x, item.y, item.z));
    }
    
  }
  let obj = {
    start,
    end,
    addPath,
  }
  return obj;
}