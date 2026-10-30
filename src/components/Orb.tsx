"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Voice orb: a soft sphere whose surface follows the live audio level (agent speaking or owner talking).
// getLevel is read every frame, so audio never triggers a React re-render.
const vert = /* glsl */ `
uniform float uTime; uniform float uLevel;
varying vec3 vNormal; varying vec3 vView; varying float vDisp; varying vec3 vPos;
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
void main(){
  float n = snoise(normal*1.6 + vec3(uTime*0.35));
  float d = n * (0.035 + uLevel*0.32);
  vDisp = d;
  vec3 pos = position + normal * d;
  vec4 mv = modelViewMatrix * vec4(pos,1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
uniform float uLevel; varying vec3 vNormal; varying vec3 vView; varying float vDisp; varying vec3 vPos;
void main(){
  // Screen-space normal follows the displaced surface, so the light reads the shape.
  vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
  vec3 v = normalize(-vPos);
  vec3 l = normalize(vec3(-0.5, 0.8, 0.7));
  float diff = clamp(dot(n, l), 0.0, 1.0);
  float wrap = 0.5 + 0.5*dot(n, l);
  float spec = pow(clamp(dot(reflect(-l, n), v), 0.0, 1.0), 28.0);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.5);
  vec3 deep = vec3(0.039, 0.369, 0.380);
  vec3 teal = vec3(0.051, 0.451, 0.467);
  vec3 mint = vec3(0.86, 0.95, 0.94);
  vec3 col = mix(deep, mix(teal, mint, 0.55), wrap);
  col = mix(col, mint, diff*0.25);
  col += spec*0.35 + fres*vec3(0.55,0.8,0.8)*0.35 + uLevel*0.06;
  gl_FragColor = vec4(col, 1.0);
}`;

function Blob({ getLevel }: { getLevel?: () => number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const smooth = useRef(0);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uLevel: { value: 0 } }), []);
  useFrame((_, dt) => {
    const target = Math.min(1, Math.max(0, getLevel?.() ?? 0));
    smooth.current += (target - smooth.current) * Math.min(1, dt * 8);
    uniforms.uTime.value += dt * (1 + smooth.current * 2.5);
    uniforms.uLevel.value = smooth.current;
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.12;
      const s = 1 + smooth.current * 0.08;
      mesh.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
    </mesh>
  );
}

export default function Orb({ getLevel, className }: { getLevel?: () => number; className?: string }) {
  return (
    <div className={className} aria-hidden>
      <Canvas camera={{ position: [0, 0, 4.1], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Blob getLevel={getLevel} />
      </Canvas>
    </div>
  );
}
