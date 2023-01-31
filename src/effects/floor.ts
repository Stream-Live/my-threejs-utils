import * as THREE from 'three'
// 添加地板
export async function CreateFloor(params: {
  width?: number,
  height?: number,
  img?: THREE.Texture,
  // 图片重复次数
  imgRepeatXY?: number,
  // 图片高亮颜色('#7a6fc0' 这种格式)
  imgHighColor?: string, 
  // 初始透明度(范围0-1)
  initOpacity?: number, // 
  // 两个环间隔距离
  ringDistance?: number,

  // 内环和外环的宽度(范围0-width)
  blurRadius?: number, 
  innerRadius?: number,
  // 内外环里有一个环透明度要低一点
  lowerOpacity?: number,
  // 最高亮度 * 这个倍数
  moreLight?: number,
  // 外围颜色('#1f527b' 这种格式)
  edgeColor?: string
}){
  let loader = new THREE.TextureLoader();

  let img = await loader.loadAsync('/images/1.png');

  const option = {
    width: 400,
    height: 400,
    img,
    // 图片重复次数
    imgRepeatXY: 10,
    // 图片高亮颜色
    imgHighColor: '#7a6fc0',
    // 初始透明度(范围0-1)
    initOpacity: 0.2, // 
    // 两个环间隔距离
    ringDistance: 90,

    // 内环和外环的宽度(范围0-width)
    blurRadius: 25, 
    innerRadius: 20,
    // 内外环里有一个环透明度要低一点
    lowerOpacity: 0.4,
    // 最高亮度 * 这个倍数
    moreLight: 1,
    // 外围颜色
    edgeColor: '#1f527b'
  }
  Object.assign(option, params);
  option.img.wrapS = option.img.wrapT = THREE.RepeatWrapping;

  let geometry = new THREE.PlaneGeometry(option.width, option.height, 2, 2);
  geometry.computeBoundingSphere();
  let { radius } = geometry.boundingSphere as any;

  let vTime = { value: 0.0 };

  let mat = new THREE.ShaderMaterial({
    uniforms: {
      img: {
        value: option.img,
      },
      imgRepeatXY: {
        value: option.imgRepeatXY,
      },
      radius: {
        value: radius,
      },
      // 内环和外环的宽度
      vBlurRadius: {
        value: option.blurRadius,
      },
      vInnerRadius: {
        value: option.innerRadius,
      },
      // 内外环里有一个环透明度要低一点
      vLowerOpacity: {
        value: option.lowerOpacity
      },
      // 初始透明度
      vInitOpacity: {
        value: option.initOpacity
      },
      // 图片高亮的颜色
      imgHighColor: {
        value: new THREE.Color(option.imgHighColor)
      },
      // 两个环间隔距离
      ringDistance: {
        value: option.ringDistance
      },
      moreLight: {
        value: option.moreLight
      },
      edgeColor: {
        value: new THREE.Color(option.edgeColor)
      },
      vTime,
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main(){
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D img;

      uniform vec3 imgHighColor;
      uniform vec3 edgeColor;

      uniform float imgRepeatXY;

      uniform float radius;
      uniform float ringDistance;
      uniform float vTime;

      uniform float vInnerRadius;
      uniform float vBlurRadius;
      uniform float vLowerOpacity;
      uniform float vInitOpacity;
      uniform float moreLight;

      varying vec2 vUv;
      varying vec3 vPosition;

      vec4 addRing(float offsetWidth, vec4 texture1, bool isInner){
        float moveR = mod(vTime + offsetWidth, radius);

        float edge0 = moveR - vInnerRadius;
        float edge1 = moveR;
        float edge2 = moveR + vBlurRadius;

        float curR = length(vPosition.xy);

        float o = vInitOpacity == 0.0 ? 1.0 : texture1.a * (1.0 / vInitOpacity * moreLight);


        // 内环
        if(curR < edge1 && curR > edge0){
          float d = smoothstep(edge0, edge1, curR); // 由外到内是 1.0-0.0
          float d1 = clamp(d * o, 0., 1.); 
          texture1.a = isInner ? max(d1 * vLowerOpacity, texture1.a) : max(d1, texture1.a);
          
          texture1.rgb = mix(texture1.rgb, imgHighColor, d);
        
        // 外环
        }else if(curR < edge2 && curR > edge1){
          float d = (1.0 - smoothstep(edge1, edge2, curR)); // 由内到外是 1.0-0.0
          float d1 = clamp(d * o, 0., 1.); 
          texture1.a = isInner ? max(d1, texture1.a) : max(d1 * vLowerOpacity, texture1.a);

          texture1.rgb = mix(texture1.rgb, imgHighColor, d);
          
        }
        return texture1;
      }
      vec4 addRing2(float offsetWidth, vec4 texture1, bool isInner){
        float moveR = mod(vTime + offsetWidth, radius);

        float edge0 = moveR - vInnerRadius;
        float edge1 = moveR;
        float edge2 = moveR + vBlurRadius;

        float curR = length(vPosition.xy);

        // 内环
        if(curR < edge1 && curR > edge0){
          float d = smoothstep(edge0, edge1, curR); // 由外到内是 1.0-0.0
          texture1.a *= isInner ? (d * vLowerOpacity) : d;  
          
        // 外环
        }else if(curR < edge2 && curR > edge1){
          float d = (1.0 - smoothstep(edge1, edge2, curR)); // 由内到外是 1.0-0.0
          texture1.a *= isInner ? d : (d * vLowerOpacity);

        }else{
          texture1.a = 0.0;
        }
        return texture1;
      }
      void main(){
        vec4 texture1 = texture2D(img, vec2(vUv.x * imgRepeatXY, vUv.y * imgRepeatXY));

        if(vInitOpacity == 0.0){
          vec4 ring1 = addRing2(0.0, texture1, true);
          vec4 ring2 = addRing2(ringDistance, texture1, false);
          gl_FragColor = ring1 + ring2;

        }else{
          
          texture1.a *= vInitOpacity;
          vec4 ring1 = addRing(0.0, texture1, true);
          vec4 ring2 = addRing(ringDistance, ring1, false);
          gl_FragColor = ring2;
        }

        float o = length(vPosition.xy/radius);
        gl_FragColor = vec4(mix(gl_FragColor.rgb, edgeColor, o), gl_FragColor.a);
      }
    `,
    transparent: true,
  });

  let clock = new THREE.Clock();
  function render() {
    vTime.value += clock.getDelta() * 20;
    requestAnimationFrame(render);
  }
  render();

  let mesh = new THREE.Mesh(geometry, mat)
  mesh.rotateX(-Math.PI * 0.5);
  return mesh;
}
