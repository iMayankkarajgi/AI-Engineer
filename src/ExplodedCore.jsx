import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme, scenePalette } from './theme';

const vertexShader=`
attribute vec3 aHome;
attribute vec3 aExploded;
attribute float aGroup;
attribute float aSize;
attribute float aSeed;
uniform float uFrame;
uniform float uPixelRatio;
varying float vIntensity;
void main(){
  float p=clamp(uFrame/120.0,0.0,1.0);
  float delay=aGroup*0.20;
  float move=smoothstep(delay,min(1.0,delay+0.39),p);
  vec3 position3=mix(aHome,aExploded,move);
  float turn=p*0.45+aSeed*0.02;
  position3.xy=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*position3.xy;
  vec4 view=modelViewMatrix*vec4(position3,1.0);
  gl_Position=projectionMatrix*view;
  gl_PointSize=clamp(aSize*18.0/max(2.0,-view.z)*uPixelRatio,1.0,46.0);
  vIntensity=mix(0.64,1.0,move);
}`;
const fragmentShader=`
precision highp float;
varying float vIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uAlpha;
void main(){
  vec2 uv=gl_PointCoord-0.5;
  float d=length(uv)*2.0;
  float core=exp(-d*d*27.0);
  float halo=exp(-d*d*4.0);
  float alpha=(core*0.9+halo*0.16)*vIntensity*uAlpha;
  if(alpha<0.012) discard;
  vec3 color=mix(uColorA,uColorB,d*0.3);
  gl_FragColor=vec4(color,alpha);
}`;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
function spherePoint(radius){const y=Math.random()*2-1,a=Math.random()*Math.PI*2,r=Math.sqrt(1-y*y);return [radius*r*Math.cos(a),radius*y,radius*r*Math.sin(a)]}
// Where the four layers settle once the core opens. On phones and tablets they
// form a 2×2 block that stays in the band below the text; on wide screens a row.
const COMPACT_SPOTS=[[-1.25,1.25],[1.25,1.25],[-1.25,-1.25],[1.25,-1.25]],WIDE_SPOTS=[[-3.35,0],[-1.12,0],[1.12,0],[3.35,0]];
function geometryFor(count,mobile){
  const shape=new THREE.IcosahedronGeometry(2.25,0),pos=shape.getAttribute('position'),verts=[],seen=new Map(),edgeSet=new Set();
  for(let i=0;i<pos.count;i++){const v=[pos.getX(i),pos.getY(i),pos.getZ(i)],key=v.map(n=>n.toFixed(3)).join(',');if(!seen.has(key)){seen.set(key,verts.length);verts.push(v)}}
  for(let i=0;i<pos.count;i+=3){const ids=[0,1,2].map(j=>seen.get([pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j)].map(n=>n.toFixed(3)).join(',')));for(const [a,b] of [[0,1],[1,2],[2,0]])edgeSet.add([Math.min(ids[a],ids[b]),Math.max(ids[a],ids[b])].join(','))}
  shape.dispose();const edges=[...edgeSet].map(e=>e.split(',').map(Number));
  const home=new Float32Array(count*3),exploded=new Float32Array(count*3),group=new Float32Array(count),size=new Float32Array(count),seed=new Float32Array(count);
  const offsets=mobile?COMPACT_SPOTS:WIDE_SPOTS;
  for(let i=0;i<count;i++){
    const edge=edges[i%edges.length],a=verts[edge[0]],b=verts[edge[1]],t=Math.random(),g=i%4;
    const initial=i<verts.length?verts[i]:[0,1,2].map(j=>a[j]*(1-t)+b[j]*t+(Math.random()-.5)*.042);
    home.set(initial,i*3);
    const offset=offsets[g],angle=Math.random()*Math.PI*2;
    let local;
    if(g===0){const r=.7+Math.random()*.45;local=spherePoint(r)}
    else if(g===1){const r=.45+Math.random()*.7;local=spherePoint(r)}
    else if(g===2){const major=.84,minor=.14+Math.random()*.25,phi=Math.random()*Math.PI*2;local=[(major+minor*Math.cos(phi))*Math.cos(angle),(major+minor*Math.cos(phi))*Math.sin(angle),minor*Math.sin(phi)]}
    else {const r=.75+Math.random()*.55;local=[r*Math.cos(angle),r*Math.sin(angle)*.67,(Math.random()-.5)*.46]}
    exploded.set([offset[0]+local[0],offset[1]+local[1],local[2]],i*3);
    group[i]=g;size[i]=i<verts.length?19:Math.random()<.018?8.5:1.7+Math.random()*2.5;seed[i]=Math.random();
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(home,3));
  for(const [name,data,countPer] of [['aHome',home,3],['aExploded',exploded,3],['aGroup',group,1],['aSize',size,1],['aSeed',seed,1]])geometry.setAttribute(name,new THREE.BufferAttribute(data,countPer));
  return geometry;
}

export default function ExplodedCore({frame=0}){
  const {theme}=useTheme();
  const hostRef=useRef(null),frameRef=useRef(frame),applyRef=useRef(null),themeRef=useRef(theme);frameRef.current=frame;themeRef.current=theme;
  useEffect(()=>{applyRef.current?.(theme)},[theme]);
  useEffect(()=>{
    const host=hostRef.current,mobile=matchMedia('(max-width:900px)').matches,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'})}catch{host.classList.add('universe-fallback');return}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(47,1,.1,100);camera.position.set(0,0,mobile?10.5:8.8);
    const root=new THREE.Group();scene.add(root);if(mobile){root.scale.setScalar(.59);root.position.y=-2.65}
    // Wide screens: keep the closed core to the right of the headline, shrinking it if the window is narrow.
    let wideX=1.8,wideScale=1;
    const geometry=geometryFor(mobile?6500:18000,mobile);
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{uFrame:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uColorA:{value:new THREE.Color()},uColorB:{value:new THREE.Color()},uAlpha:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    root.add(new THREE.Points(geometry,material));
    const shells=[
      new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.83,1)),new THREE.LineBasicMaterial({color:0xdccdff,transparent:true,opacity:.18,depthWrite:false})),
      new THREE.Mesh(new THREE.TorusGeometry(.95,.006,6,140),new THREE.MeshBasicMaterial({color:0xc3adf6,transparent:true,opacity:.32,depthWrite:false})),
      new THREE.Mesh(new THREE.TorusGeometry(1.08,.007,6,140),new THREE.MeshBasicMaterial({color:0xe6dcff,transparent:true,opacity:.4,depthWrite:false})),
      new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05,0)),new THREE.LineBasicMaterial({color:0xc3adf6,transparent:true,opacity:.16,depthWrite:false}))
    ];shells.forEach((s,i)=>{s.userData.index=i;s.userData.opacity=s.material.opacity;root.add(s)});
    const ambient=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:0xa594c9,size:.01}));
    let raf=0,lastFrame=-1,lastTime=performance.now(),spin=0,shellSpin=0;
    // Idle motion: the closed core turns slowly; once it opens, the turn settles and the layers drift instead.
    const TURN=Math.PI*2,SPEED=.12;
    const ro=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();lastFrame=-1;if(!mobile){const w=host.clientWidth,half=3.826*camera.aspect,textRight=(.085*w+Math.min(590,.47*w))/w,edge=(textRight*2-1)*half;wideScale=Math.max(.55,Math.min(1,(half-edge)/4.7));wideX=Math.max(1.8,edge+2.35*wideScale)}});ro.observe(host);
    function draw(){const f=reduce?0:Math.max(0,Math.min(120,Math.round(frameRef.current)));const now=performance.now(),dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;if(!reduce||f!==lastFrame){lastFrame=f;material.uniforms.uFrame.value=f;const p=f/120;if(!reduce){const open=smooth(0,.3,p);spin+=dt*SPEED*(1-open);if(open>0){const rest=Math.round(spin/TURN)*TURN;spin+=(rest-spin)*Math.min(1,dt*5)*open}shellSpin+=dt*SPEED*open}root.position.x=mobile?0:wideX*(1-smooth(0,.36,p));if(!mobile){root.position.y=-1.25*smooth(.12,.36,p)-.15*smooth(.72,1,p);root.scale.setScalar(wideScale+(1-wideScale)*smooth(0,.36,p))}root.rotation.y=p*.22+spin;root.rotation.x=.13+p*.1;shells.forEach((shell,i)=>{const shift=smooth(i*.2,Math.min(1,i*.2+.39),p),positions=mobile?COMPACT_SPOTS:WIDE_SPOTS;shell.position.set(positions[i][0]*shift,positions[i][1]*shift,0);shell.rotation.x=.3+p*(i+1)*.35;shell.rotation.y=(p*.7+shellSpin)*(i%2?-1:1);shell.scale.setScalar(1-.12*p)});renderer.render(scene,camera)}raf=requestAnimationFrame(draw)}
    // Recolor in place when the theme changes, then force a redraw.
    applyRef.current=t=>{const pal=scenePalette(t);material.uniforms.uColorA.value.setRGB(...pal.a);material.uniforms.uColorB.value.setRGB(...pal.b);material.uniforms.uAlpha.value=pal.alpha;material.blending=pal.light?THREE.NormalBlending:THREE.AdditiveBlending;material.needsUpdate=true;shells.forEach(s=>{s.material.color.setHex(pal.light?pal.line:s.userData.color);s.material.opacity=Math.min(1,s.userData.opacity*pal.lineOpacity)});lastFrame=-1};
    shells.forEach(s=>{s.userData.color=s.material.color.getHex()});applyRef.current(themeRef.current);
    draw();return()=>{applyRef.current=null;cancelAnimationFrame(raf);ro.disconnect();geometry.dispose();material.dispose();shells.forEach(s=>{s.geometry.dispose();s.material.dispose()});ambient.geometry.dispose();ambient.material.dispose();renderer.dispose();renderer.domElement.remove()};
  },[]);
  return <div className="universe exploded-core" ref={hostRef} role="img" aria-label="A luminous AI core separating into four connected layers as the page scrolls"/>;
}
