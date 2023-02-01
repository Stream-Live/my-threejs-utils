/*
 * @Author: Wjh
 * @Date: 2023-01-30 17:17:53
 * @LastEditors: Wjh
 * @LastEditTime: 2023-02-01 16:42:17
 * @FilePath: \my-threejs-utils\src\index.ts
 * @Description: 
 * 
 */
export { CreateFloor } from './effects/Floor'   // 创建地板
export { MyPathGeometry } from './effects/MyPathGeometry'
export { CreatePath } from './effects/Path'   // 创建贴图道路
export { CreateRain } from './effects/Rain'   // 创建下雨
export { CreateSnow } from './effects/Snow'   // 创建下雪
export { CreateAnimationPath } from './effects/AnimationPath'   // 创建运动路径
export { getCurvePathByPoints } from './utils'    // 根据点数组创建 THREE.CurvePath
