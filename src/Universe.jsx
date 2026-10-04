import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme, scenePalette } from './theme';

const VERTEX = `
attribute vec3 aGraph;
attribute vec3 aCloud;
attribute vec3 aGlobe;
attribute vec3 aRing;
attribute float aSize;
attribute float aSeed;
uniform float uTime;
uniform float uStage;
uniform float uPixelRatio;
uniform vec2 uMouse;
varying float vGlow;
varying float vDepth;
void main(){
  float s = clamp(uStage, 0.0, 3.0);
  vec3 p;
  if(s < 1.0) p = mix(aGraph, aCloud, smoothstep(0.0, 1.0, s));
  else if(s < 2.0) p = mix(aCloud, aGlobe, smoothstep(0.0, 1.0, s-1.0));
  else p = mix(aGlobe, aRing, smoothstep(0.0, 1.0, s-2.0));
  float wave = sin(uTime*0.52+aSeed*33.0)*0.025;
  p += normalize(p+vec3(0.0001))*wave;
  p.xy += uMouse * (0.13 + aSeed*0.13);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float perspective = 8.0 / max(2.0, -mv.z);
  gl_PointSize = clamp((aSize + 0.45*sin(uTime*1.4+aSeed*90.0))*perspective*uPixelRatio, 1.0, 33.0);
  vGlow = aSize;
  vDepth = clamp(1.0 - (-mv.z-5.0)/12.0, 0.28, 1.0);
}`;
const FRAGMENT = `
precision highp float;
varying float vGlow;
varying float vDepth;
uniform float uStage;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uAlpha;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv)*2.0;
  float core = exp(-d*d*22.0);
  float halo = exp(-d*d*4.3);
  float alpha = (core*0.92 + halo*0.15) * vDepth * uAlpha;
  if(alpha < 0.015) discard;
  vec3 color = mix(uColorA,uColorB,clamp(uStage/3.0,0.0,1.0)*0.38);
  gl_FragColor = vec4(color, alpha);
}`;

function randomSphere(radius=1){const z=Math.random()*2-1,a=Math.random()*Math.PI*2,r=Math.sqrt(1-z*z);return [radius*r*Math.cos(a),radius*r*Math.sin(a),radius*z]}
function write(a,i,p){a[i*3]=p[0];a[i*3+1]=p[1];a[i*3+2]=p[2]}
function graphEdges(){
  const g=new THREE.IcosahedronGeometry(2.45,0),pos=g.getAttribute('position'),vertices=[],lookup=new Map(),edges=new Set();
  for(let i=0;i<pos.count;i++){const p=[pos.getX(i),pos.getY(i),pos.getZ(i)],key=p.map(x=>x.toFixed(3)).join(',');if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push(p)}}
  for(let i=0;i<pos.count;i+=3){const ids=[0,1,2].map(j=>lookup.get([pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j)].map(x=>x.toFixed(3)).join(',')));for(const [a,b] of [[0,1],[1,2],[2,0]])edges.add([Math.min(ids[a],ids[b]),Math.max(ids[a],ids[b])].join(','))}
  g.dispose();return {vertices,edges:[...edges].map(e=>e.split(',').map(Number))};
}
function makeGeometry(count){
  const {vertices,edges}=graphEdges();
  const graph=new Float32Array(count*3),cloud=new Float32Array(count*3),globe=new Float32Array(count*3),ring=new Float32Array(count*3),size=new Float32Array(count),seed=new Float32Array(count);
  for(let i=0;i<count;i++){
    const r=Math.random(),e=edges[i%edges.length],a=vertices[e[0]],b=vertices[e[1]],t=Math.random();
    const graphP=i<vertices.length?vertices[i]:[0,1,2].map(j=>a[j]*(1-t)+b[j]*t+(Math.random()-.5)*.045);
    write(graph,i,graphP);
    const c=randomSphere(Math.pow(Math.random(),1.4)*3.6);write(cloud,i,[c[0],c[1],c[2]]);
    let globeP;
    if(i%5<3){const path=i%11,angle=Math.random()*Math.PI*2,tilt=path*Math.PI/11;globeP=[2.65*Math.cos(angle)*Math.cos(tilt)-2.65*Math.sin(angle)*Math.sin(tilt)*.25,2.65*Math.sin(angle)*Math.cos(tilt)+2.65*Math.cos(angle)*Math.sin(tilt)*.25,2.65*Math.sin(angle)*Math.sin(tilt)];}
    else globeP=randomSphere(2.65);
    write(globe,i,globeP);
    const theta=Math.random()*Math.PI*2,swirl=(i%3)*.37,minor=.62+(Math.random()-.5)*.35,phi=Math.random()*Math.PI*2+swirl;
    write(ring,i,[(2.1+minor*Math.cos(phi))*Math.cos(theta),(2.1+minor*Math.cos(phi))*Math.sin(theta),minor*Math.sin(phi)*1.25]);
    size[i]=i<vertices.length?18:Math.random()<.013?10:2.0+Math.random()*2.2;
    seed[i]=r;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(graph,3));
  for(const [name,data,n] of [['aGraph',graph,3],['aCloud',cloud,3],['aGlobe',globe,3],['aRing',ring,3],['aSize',size,1],['aSeed',seed,1]])geometry.setAttribute(name,new THREE.BufferAttribute(data,n));
  return geometry;
}

export default function Universe({progress=0,className=''}){
  const {theme}=useTheme();
  const ref=useRef(null),progressRef=useRef(progress),applyRef=useRef(null),themeRef=useRef(theme);progressRef.current=progress;themeRef.current=theme;
  useEffect(()=>{applyRef.current?.(theme)},[theme]);
  useEffect(()=>{
    const host=ref.current;if(!host)return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile=window.matchMedia('(max-width: 700px)').matches;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'}); }
    catch { host.classList.add('universe-fallback');return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setClearColor(0x000000,0);
    host.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.set(0,0,mobile?10.7:9.2);
    const group=new THREE.Group();scene.add(group);
    const geometry=makeGeometry(mobile?5500:16000);
    const material=new THREE.ShaderMaterial({vertexShader:VERTEX,fragmentShader:FRAGMENT,uniforms:{uTime:{value:0},uStage:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uMouse:{value:new THREE.Vector2()},uColorA:{value:new THREE.Color()},uColorB:{value:new THREE.Color()},uAlpha:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const points=new THREE.Points(geometry,material);group.add(points);
    const wire=new THREE.Mesh(new THREE.SphereGeometry(3.12,48,32),new THREE.MeshBasicMaterial({color:0x8fc9a6,transparent:true,opacity:.025,wireframe:true,depthWrite:false}));group.add(wire);
    applyRef.current=t=>{const pal=scenePalette(t);material.uniforms.uColorA.value.setRGB(...pal.a);material.uniforms.uColorB.value.setRGB(...pal.b);material.uniforms.uAlpha.value=pal.light?.7:1;material.blending=pal.light?THREE.NormalBlending:THREE.AdditiveBlending;material.needsUpdate=true;wire.material.color.setHex(pal.light?pal.line:0x8fc9a6)};
    applyRef.current(themeRef.current);
    const pointer={x:0,y:0};let frame=0,shownStage=0,last=performance.now();
    function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
    const ro=new ResizeObserver(resize);ro.observe(host);resize();
    function mouse(e){const b=host.getBoundingClientRect();pointer.x=(e.clientX-b.left)/b.width-.5;pointer.y=(e.clientY-b.top)/b.height-.5}
    host.addEventListener('pointermove',mouse);
    function render(now){
      const dt=Math.min((now-last)/1000,.05);last=now;
      const target=progressRef.current*3;
      shownStage+=(target-shownStage)*Math.min(1,dt*(reduce?30:3.8));
      material.uniforms.uStage.value=shownStage;material.uniforms.uTime.value=reduce?0:now*.001;
      material.uniforms.uMouse.value.lerp(new THREE.Vector2(pointer.x,-pointer.y),.05);
      group.rotation.y=(reduce?0:now*.000085)+shownStage*.23;
      group.rotation.x=.12+Math.sin((reduce?0:now*.00013))*.07+pointer.y*.08;
      group.rotation.z=shownStage>2?(shownStage-2)*.35:0;
      wire.visible=shownStage>1.6&&shownStage<2.6;wire.material.opacity=.018*Math.max(0,1-Math.abs(shownStage-2));
      renderer.render(scene,camera);frame=requestAnimationFrame(render);
    }
    frame=requestAnimationFrame(render);
    return()=>{applyRef.current=null;cancelAnimationFrame(frame);ro.disconnect();host.removeEventListener('pointermove',mouse);geometry.dispose();material.dispose();wire.geometry.dispose();wire.material.dispose();renderer.dispose();renderer.domElement.remove()};
  },[]);
  return <div ref={ref} className={`universe ${className}`} aria-hidden="true"/>;
}
