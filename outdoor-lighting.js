import * as THREE from 'three';

// A visitor-selectable lighting study. Fixtures are additions to the virtual
// reconstruction; their positions do not claim to document the real site.
export function createOutdoorLighting({scene,renderer,sky,sun,hemisphere,ambient,environment,compact=false,location,invalidate}){
 const large=location==='memorial',root=new THREE.Group();root.name='Архитектурное освещение';scene.add(root);
 const day={sun:sun.intensity,hemi:hemisphere.intensity,ambient:ambient.intensity,exposure:renderer.toneMappingExposure,fog:scene.fog.density};
 const colors={sun:sun.color.clone(),hemi:hemisphere.color.clone(),ground:hemisphere.groundColor.clone(),ambient:ambient.color.clone(),top:sky.material.uniforms.top.value.clone(),bottom:sky.material.uniforms.bottom.value.clone(),fog:scene.fog.color.clone()};
 const nightColors={sun:new THREE.Color('#b7d0ff'),hemi:new THREE.Color('#91b7e7'),ground:new THREE.Color('#253542'),ambient:new THREE.Color('#7996bb'),top:new THREE.Color('#050d1e'),bottom:new THREE.Color('#1a2b40'),fog:new THREE.Color('#132235')};
 const heightAt=environment.heightAt||(()=>.004);
 const points=large?[[-6.02,-7.1],[-6.02,.5],[-6.02,7.55],[7.18,-7.1],[7.18,.5],[7.18,7.55]]:[[-4.25,-2.65],[-4.25,2.8],[3.85,-2.65],[3.85,2.8]];
 const poleHeight=large?3.25:2.55,metal=new THREE.MeshStandardMaterial({color:'#232d30',metalness:.72,roughness:.37});
 const diffuser=new THREE.MeshStandardMaterial({color:'#fff2ce',emissive:'#ffdf9b',emissiveIntensity:.24,roughness:.48});
 const dummy=new THREE.Object3D();
 function instances(name,geometry,material,transforms){const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);mesh.name=name;transforms.forEach(([x,y,z,sx,sy,sz],i)=>{dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.castShadow=material===metal;mesh.receiveShadow=true;root.add(mesh);return mesh;}
 const stems=[],bases=[],lanterns=[],caps=[];
 for(const[x,z]of points){const y=heightAt(x,z);stems.push([x,y+(poleHeight-.53)/2,z,.047,poleHeight-.53,.047]);bases.push([x,y+.035,z,.13,.07,.13]);lanterns.push([x,y+poleHeight-.29,z,.072,.48,.072]);caps.push([x,y+poleHeight-.015,z,.105,.045,.105]);
  // The narrow posts remain solid during a walk, including on the raised plaza.
  environment.colliders.push({minX:x-.12,maxX:x+.12,minZ:z-.12,maxZ:z+.12});
 }
 const cylinder=new THREE.CylinderGeometry(1,1,1,compact?8:12);
 instances('Тонкие графитовые опоры фонарей',cylinder,metal,stems);
 instances('Основания фонарей',cylinder,metal,bases);
 instances('Матовые светящиеся секции',cylinder,diffuser,lanterns);
 instances('Верхние крышки фонарей',cylinder,metal,caps);

 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,230,182,1)');gradient.addColorStop(.14,'rgba(255,221,158,.58)');gradient.addColorStop(.5,'rgba(255,217,146,.13)');gradient.addColorStop(1,'rgba(255,216,145,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const glowTexture=new THREE.CanvasTexture(c);glowTexture.colorSpace=THREE.SRGBColorSpace;
 const haloMaterial=new THREE.SpriteMaterial({map:glowTexture,color:'#ffdfab',transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const poolMaterial=new THREE.MeshBasicMaterial({map:glowTexture,color:'#ffe0a1',transparent:true,opacity:.02,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
 const shaftMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{power:{value:.006}},vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vV=-p.xyz;vN=normalMatrix*normal;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;uniform float power;void main(){float facing=pow(abs(dot(normalize(vN),normalize(vV))),1.5);float fade=smoothstep(0.,.18,vUv.y)*(.12+.88*pow(vUv.y,2.));gl_FragColor=vec4(1.,.79,.48,facing*fade*power);}' });
 const shaftGeo=new THREE.CylinderGeometry(.07,large?.72:.54,poleHeight-.28,compact?12:20,1,true),poolRadius=large?3.5:2.5;
 for(const[x,z]of points){const y=heightAt(x,z),halo=new THREE.Sprite(haloMaterial);halo.position.set(x,y+poleHeight-.29,z);halo.scale.setScalar(1.12);halo.name='Мягкий ореол фонаря';root.add(halo);
  const shaft=new THREE.Mesh(shaftGeo,shaftMaterial);shaft.name='Мягкий световой столб';shaft.position.set(x,y+(poleHeight-.28)/2,z);root.add(shaft);
  // The light pool follows the actual paving and steps instead of floating.
  const geometry=new THREE.PlaneGeometry(poolRadius*2,poolRadius*2,16,16),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const px=x+p.getX(i),pz=z-p.getY(i);p.setXYZ(i,px,heightAt(px,pz)+.017,pz);}geometry.computeVertexNormals();
  const pool=new THREE.Mesh(geometry,poolMaterial);pool.name='Рассеянный свет на дорожке';root.add(pool);
 }
 // Real lights illuminate the sculpture; inexpensive light pools supply the
 // repeated path accents. Only one architectural spotlight casts a shadow.
 const spotSpecs=large?[
  {from:[-3.6,.50,-3.3],to:[0,3.7,-6],intensity:180,angle:.76},
  {from:[3.5,.55,-3.1],to:[0,4.0,-6],intensity:125,angle:.72},
  {from:[.5,3,-9.5],to:[0,4.1,-6],intensity:115,angle:.76,cool:true}
 ]:[
  {from:[-2.05,.22,1.95],to:[-.35,2.2,0],intensity:38,angle:.64},
  {from:[2.4,.30,1.5],to:[-.35,2.1,0],intensity:32,angle:.68},
  {from:[.1,1.0,-2.7],to:[-.35,2.6,0],intensity:27,angle:.65,cool:true}
 ];
 const spots=spotSpecs.map((s,i)=>{const light=new THREE.SpotLight(s.cool?'#c8ddff':'#ffe0ad',0,large?22:12,s.angle,.72,2);light.position.fromArray(s.from);light.target.position.fromArray(s.to);light.castShadow=i===0;light.shadow.mapSize.set(compact?512:1024,compact?512:1024);light.shadow.bias=-.00012;light.shadow.normalBias=.018;light.shadow.camera.near=.1;light.shadow.camera.far=large?22:12;root.add(light,light.target);return {light,intensity:s.intensity};});
 const pathLights=[points[1],points[points.length-1]].map(([x,z])=>{const light=new THREE.PointLight('#ffdfb1',0,large?12:8,2);light.position.set(x,heightAt(x,z)+poleHeight-.3,z);root.add(light);return light;});
 const materialValues=new Map();let value=0,target=0,transition=null;
 function refreshMaterials(){scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshStandardMaterial&&!materialValues.has(m))materialValues.set(m,m.envMapIntensity);});apply(value);}
 function apply(n){value=n;const mix=(a,b)=>THREE.MathUtils.lerp(a,b,n);sun.intensity=mix(day.sun,.25);hemisphere.intensity=mix(day.hemi,.18);ambient.intensity=mix(day.ambient,.075);renderer.toneMappingExposure=mix(day.exposure,1.12);
  for(const key of ['sun','hemi','ground','ambient','top','bottom','fog']){const c=colors[key].clone().lerp(nightColors[key],n);if(key==='sun')sun.color.copy(c);else if(key==='hemi')hemisphere.color.copy(c);else if(key==='ground')hemisphere.groundColor.copy(c);else if(key==='ambient')ambient.color.copy(c);else if(key==='fog'){scene.fog.color.copy(c);scene.background.copy(c);}else sky.material.uniforms[key].value.copy(c);}
  scene.fog.density=mix(day.fog,large?.009:.016);diffuser.emissiveIntensity=mix(.24,4);haloMaterial.opacity=mix(.045,.77);poolMaterial.opacity=mix(.014,.34);shaftMaterial.uniforms.power.value=mix(.004,.12);
  for(const{light,intensity}of spots)light.intensity=intensity*n;pathLights.forEach(l=>l.intensity=(large?22:12)*n);for(const[m,original]of materialValues)m.envMapIntensity=original*mix(1,.10);
 }
 const buttons=[...document.querySelectorAll('[data-time-choice]')];
 function setMode(mode,{animate=true,remember=true}={}){const next=mode==='night'?'night':'day';target=next==='night'?1:0;document.body.dataset.timeOfDay=next;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.timeChoice===next)));if(remember)try{localStorage.setItem('mukhavets.timeOfDay',next);}catch{}
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)transition={start:performance.now(),from:value};else{transition=null;apply(target);}renderer.shadowMap.needsUpdate=true;invalidate();
 }
 buttons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.timeChoice)));
 window.addEventListener('storage',e=>{if(e.key==='mukhavets.timeOfDay')setMode(e.newValue,{remember:false});});
 let initial='day';try{initial=localStorage.getItem('mukhavets.timeOfDay')==='night'?'night':'day';}catch{}refreshMaterials();setMode(initial,{animate:false,remember:false});
 return {root,refreshMaterials,update(time){if(!transition)return false;const progress=THREE.MathUtils.clamp((time-transition.start)/650,0,1),eased=progress*progress*(3-2*progress);apply(THREE.MathUtils.lerp(transition.from,target,eased));if(progress===1)transition=null;return Boolean(transition);}};
}
