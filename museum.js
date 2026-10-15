async function createMuseum(root, data) {
 const $=s=>root.querySelector(s), $$=s=>Array.from(root.querySelectorAll(s));
 const viewport=$('.museum-stage'), canvas=$('canvas'), status=$('.museum-status');
 const touch=matchMedia('(pointer: coarse)').matches; const compact=touch||innerWidth<700; root.dataset.controls=touch?'touch':'desktop';
 const scene=new THREE.Scene(); scene.background=new THREE.Color('#eae7df');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,compact?1.4:1.85)); renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const camera=new THREE.PerspectiveCamera(59,1,.045,100);
 scene.add(new THREE.HemisphereLight(0xf4f7ff,0xa99e8e,1.15));
 const sun=new THREE.DirectionalLight(0xfffaf3,1.55);sun.position.set(-5.8,6.5,-1.5);sun.castShadow=true;
 sun.shadow.mapSize.set(compact?1024:2048,compact?1024:2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:24});sun.shadow.radius=2.5;sun.shadow.bias=-.001;sun.shadow.normalBias=.0025;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xf2f5ff,.60);fill.position.set(4,6,4);scene.add(fill);
 // A neutral room reflection environment gives steel and glass soft architectural highlights.
 const envScene=new THREE.Scene();envScene.background=new THREE.Color('#aaa99f');
 const envRoom=new THREE.Mesh(new THREE.BoxGeometry(12,7,14),new THREE.MeshBasicMaterial({color:'#b5b2a7',side:THREE.BackSide}));envRoom.position.y=2;envScene.add(envRoom);
 for(const [p,sc,c] of [[[-5,2,0],[.1,3,9],'#ffffff'],[[0,5,-2],[7,.1,3],'#fafcff'],[[0,5,2],[7,.1,3],'#ffffff']]){const light=new THREE.Mesh(new THREE.BoxGeometry(...sc),new THREE.MeshBasicMaterial({color:c}));light.position.set(...p);envScene.add(light);}
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.05).texture;pmrem.dispose();envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 const ROOM={width:6.96,depth:7.80,height:2.85},DX=(ROOM.width-5.8)/2,DZ=(ROOM.depth-6.5)/2;
 // Move exhibit assemblies with the wall, preserving the size of every object.
 function at(p,wall){return [p[0]+(wall.includes('w')?-DX:wall.includes('e')?DX:0),p[1],p[2]+(wall.includes('n')?-DZ:wall.includes('s')?DZ:0)];}
 const solids=[];function solid(g){solids.push(g);return g;}
 const model=new THREE.Group();model.name='Школьный музей — реконструкция по фотографиям';model.userData={version:'5.0',units:'meters',dimensionsEstimated:true,roomEstimate:[ROOM.width,ROOM.height,ROOM.depth],horizontalExpansion:1.20,source:'45 photographs and reference frames from 3 videos supplied by the user',method:'Manually reconstructed geometry with photographic display textures. Not a photogrammetric scan.'};scene.add(model);
 const geom={box:new THREE.BoxGeometry(1,1,1),plane:new THREE.PlaneGeometry(1,1)};
 const walls={},clickables=[],locations={},loaded=[];
 function group(name,parent=model,pos=[0,0,0],yaw=0){const g=new THREE.Group();g.name=name;g.position.set(...pos);g.rotation.y=yaw;parent.add(g);return g;}
 function color(hex){return new THREE.MeshStandardMaterial({color:hex,roughness:.85,envMapIntensity:.35});}
 const mats={wall:color('#e8d0bc'),edge:color('#faf7ec'),floor:color('#b9ac94'),wood:color('#fff8ee'),old:color('#796951'),darkwood:color('#49392c'),plank:color('#fff6e8'),steel:new THREE.MeshStandardMaterial({color:'#d6d9d5',metalness:.88,roughness:.23}),iron:color('#423d35'),clay:color('#98714c'),paper:color('#eae5d5'),red:color('#802e28'),green:color('#214e40'),glass:new THREE.MeshStandardMaterial({color:'#7b8b89',roughness:.19,metalness:.27}),black:color('#211f1a'),cloth:color('#e7ddc7')};
 let seed=381;function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
 function canvasTexture(draw,size=256){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 const grain=canvasTexture((c,s)=>{c.fillStyle='#c9b394';c.fillRect(0,0,s,s);for(let i=0;i<170;i++){const y=rand()*s;c.strokeStyle=`rgba(91,62,31,${.025+rand()*.09})`;c.lineWidth=.4+rand();c.beginPath();c.moveTo(0,y);c.bezierCurveTo(s*.3,y+rand()*8,s*.6,y-rand()*8,s,y);c.stroke();}});
 mats.plank.map=grain;mats.wood.map=grain;
 const woven=canvasTexture((c,s)=>{c.fillStyle='#71664b';c.fillRect(0,0,s,s);for(let y=0;y<s;y+=8){for(let x=0;x<s;x+=16){c.fillStyle=(x/16+y/8)%2?'#9e8d66':'#8b7a58';c.fillRect(x+1,y+1,14,5);}}});woven.wrapS=woven.wrapT=THREE.RepeatWrapping;woven.repeat.set(3,2);mats.wicker=new THREE.MeshStandardMaterial({map:woven,color:'#c6b18d',roughness:1});
 const floorTex=canvasTexture((c,s)=>{c.fillStyle='#bbb09e';c.fillRect(0,0,s,s);for(let i=0;i<4000;i++){c.fillStyle=`rgba(${rand()>.5?'255,250,236':'66,49,37'},.045)`;c.fillRect(rand()*s,rand()*s,1+rand()*4,1);}c.strokeStyle='#8b8275';c.lineWidth=3;c.strokeRect(0,0,s,s);c.strokeStyle='#d2c8b5';c.lineWidth=1;c.strokeRect(3,3,s-6,s-6);});floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(13.2,14.4);
 const floorMat=new THREE.MeshStandardMaterial({map:floorTex,color:'#cbc5bc',roughness:.85});
 const texM={},hdLoaded=new Set(),pendingHD=new Set();
 const sourceTextures=compact?(data.texturesMobile||data.textures):data.textures;
 let loadedCount=0;const entries=Object.entries(sourceTextures);const loader=new THREE.TextureLoader();
 async function loadTexture(url){const t=await loader.loadAsync(url);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(compact?4:12,renderer.capabilities.getMaxAnisotropy());return t;}
 await Promise.all(entries.map(async([id,url])=>{const t=await loadTexture(url);texM[id]=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,toneMapped:false});const n=Math.round(++loadedCount/entries.length*92);$('.load-progress').textContent=n+'%';$('.museum-loading progress').value=n;}));

 for(const [id,key,rough,metal] of [['wood','plank',.91,0],['laminate','wood',.83,0],['agedwood','old',.97,0],['rust','iron',.93,.35]]){
  if(texM[id]){const t=texM[id].map;t.wrapS=t.wrapT=THREE.RepeatWrapping;mats[key].color.set('#ffffff');mats[key].map=t;mats[key].bumpMap=t;mats[key].bumpScale=id==='rust'?.0012:.002;mats[key].roughness=rough;mats[key].metalness=metal;}
 }
 if(texM.tile){const t=texM.tile.map;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(15.6,17.4);floorMat.map=t;floorMat.bumpMap=t;floorMat.bumpScale=.003;floorMat.roughness=.72;}
 if(texM.wicker){const t=texM.wicker.map;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);mats.wicker.map=t;mats.wicker.bumpMap=t;mats.wicker.bumpScale=.003;mats.wicker.color.set('#ffffff');}
 const plaster=canvasTexture((c,n)=>{c.fillStyle='#d5d3cd';c.fillRect(0,0,n,n);for(let i=0;i<45000;i++){let v=155+rand()*90;c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(rand()*n,rand()*n,1,1)}},512);mats.wall.bumpMap=plaster;mats.wall.bumpScale=.0008;
 // Quiet, fine cabinet grain avoids baking the photographed shelf edges into every face.
 const cabinetGrain=canvasTexture((c,n)=>{c.fillStyle='#b49673';c.fillRect(0,0,n,n);for(let i=0;i<1500;i++){const y=rand()*n;c.strokeStyle=`rgba(${rand()>.5?'239,216,181':'91,65,40'},${.02+rand()*.05})`;c.lineWidth=.25+rand()*.9;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(n*.33,y+Math.sin(y)*1.5,n*.66,y-Math.cos(y)*1.5,n,y);c.stroke();}},1024);
 mats.wood.map=cabinetGrain;mats.wood.bumpMap=cabinetGrain;mats.wood.bumpScale=.0003;
 mats.old.color.set('#b9ad9a');mats.iron.color.set('#aca49a');mats.iron.metalness=.22;
 const basketWeave=canvasTexture((c,n)=>{c.fillStyle='#514c3c';c.fillRect(0,0,n,n);const step=16;for(let y=0;y<n;y+=step)for(let x=0;x<n;x+=step){const horizontal=((x+y)/step)%2===0;const gx=c.createLinearGradient(horizontal?0:x,horizontal?y:0,horizontal?0:x+step,horizontal?y+step:0);gx.addColorStop(0,'#504b3d');gx.addColorStop(.35,'#a2997c');gx.addColorStop(.7,'#8a8169');gx.addColorStop(1,'#48463b');c.fillStyle=gx;c.fillRect(x+1,y+1,step-2,step-2);c.strokeStyle='rgba(45,41,32,.24)';for(let a=4;a<step;a+=4){c.beginPath();c.moveTo(x+(horizontal?1:a),y+(horizontal?a:1));c.lineTo(x+(horizontal?step-1:a),y+(horizontal?a:step-1));c.stroke();}}},512);
 basketWeave.wrapS=basketWeave.wrapT=THREE.RepeatWrapping;basketWeave.repeat.set(2,2);mats.wicker.map=basketWeave;mats.wicker.bumpMap=basketWeave;mats.wicker.bumpScale=.002;
 if(texM.pine){mats.plank.map=texM.pine.map;mats.plank.bumpMap=texM.pine.map;mats.plank.bumpScale=.0015;mats.plank.roughness=.83;mats.plank.color.set('#f5ead3');}
 if(texM.aged){mats.old.map=texM.aged.map;mats.old.bumpMap=texM.aged.map;mats.old.bumpScale=.002;mats.old.color.set('#a89e8b');}
 if(texM.willow){mats.wicker.map=texM.willow.map;mats.wicker.bumpMap=texM.willow.map;mats.wicker.bumpScale=.003;mats.wicker.color.set('#c1b7a2');}
 for(const m of [mats.plank,mats.old,mats.wicker]){m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 mats.shelfBack=mats.wood.clone();mats.shelfBack.color.set('#b0a08d');
 mats.stove=new THREE.MeshStandardMaterial({color:'#aeb8b5',roughness:.92,bumpMap:plaster,bumpScale:.0013});
 const contactTex=canvasTexture((c,n)=>{const g=c.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(32,25,17,.5)');g.addColorStop(.55,'rgba(32,25,17,.25)');g.addColorStop(1,'rgba(32,25,17,0)');c.fillStyle=g;c.fillRect(0,0,n,n);});
 const contactMat=new THREE.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false,toneMapped:false});
 function mesh(g,geo,mat,p=[0,0,0],s=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 function box(g,x,y,z,w,h,d,m=mats.wood){
  let geo=geom.box;
  if([mats.plank,mats.old,mats.wicker,mats.wood,mats.shelfBack].includes(m)){
   const key='uvbox'+[w,h,d,m.uuid].join(',');
   if(!geom[key]){geo=geom.box.clone();const uv=geo.attributes.uv,pos=geo.attributes.position,norm=geo.attributes.normal;const off=rand()*3;
    for(let i=0;i<uv.count;i++){const px=pos.getX(i)*w,py=pos.getY(i)*h,pz=pos.getZ(i)*d;const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i));let u=nx>.5?pz:px,v=ny>.5?pz:py;const size=m===mats.wicker?.34:m===mats.plank?1.4:.7;uv.setXY(i,u/size+off,v/size+off*.73);}geom[key]=geo;
   }geo=geom[key];
  }
  return mesh(g,geo,m,[x,y,z],[w,h,d]);
 }
 function cyl(g,x,y,z,r,h,mat=mats.old,rt=r,seg=16){const key=`c${r},${rt},${h},${seg}`;if(!geom[key])geom[key]=new THREE.CylinderGeometry(rt,r,h,seg);return mesh(g,geom[key],mat,[x,y,z]);}
 function rod(g,a,b,r=.015,mat=mats.old){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b);const m=cyl(g,...p.clone().add(q).multiplyScalar(.5).toArray(),r,p.distanceTo(q),mat);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());return m;}
 function ring(g,x,y,z,r,t,mat=mats.old){const key=`t${r},${t}`;if(!geom[key])geom[key]=new THREE.TorusGeometry(r,t,6,32);return mesh(g,geom[key],mat,[x,y,z]);}
 function lathe(g,x,y,z,points,mat=mats.clay){const profile=new THREE.SplineCurve(points.map(p=>new THREE.Vector2(...p))).getPoints(points.length*(compact?3:4)).map(p=>new THREE.Vector2(Math.max(.001,p.x),p.y));const geo=new THREE.LatheGeometry(profile,compact?32:40);return mesh(g,geo,mat,[x,y,z]);}
 function photo(g,id,x,y,z,w,h){const m=mesh(g,geom.plane,texM[id],[x,y,z],[w,h,1]);m.castShadow=false;return m;}
 function interactive(g,id,loc,target){g.userData.exhibit=id;g.traverse(o=>{if(o.isMesh)clickables.push(o);});if(loc)locations[id]={pos:loc,target};}
 // Room shell. Upper walls on the camera side can be hidden in the overview.
 const architecture=group('Помещение');box(architecture,0,-.1,0,ROOM.width+.25,.2,ROOM.depth+.25,mats.edge);
 const floor=mesh(architecture,geom.plane,floorMat,[0,.007,0],[ROOM.width,ROOM.depth,1]);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
 for(const [id,x,z,w,d] of [['north',0,-ROOM.depth/2-.08,ROOM.width+.25,.16],['south',0,ROOM.depth/2+.08,ROOM.width+.25,.16],['west',-ROOM.width/2-.08,0,.16,ROOM.depth],['east',ROOM.width/2+.08,0,.16,ROOM.depth]]){
  const g=group('Стена '+id,architecture);walls[id]=g;box(g,x,1.425,z,w,2.85,d,mats.wall);box(g,x,.07,z,w+.02,.14,d+.025,mats.floor);box(g,x,2.8,z,w+.02,.07,d+.025,mats.edge);
  g.traverse(o=>{o.castShadow=false;});
 }
 for(const z of [-2.18,1.83]){
  const w=walls.west;const g=group('Окно с вертикальными жалюзи',w,[-ROOM.width/2+.015,0,z],Math.PI/2);
  box(g,0,1.72,0,2.65,1.95,.045,mats.edge);box(g,0,1.73,.03,2.55,1.78,.018,mats.glass);
  const slats=new THREE.InstancedMesh(geom.box,mats.cloth,32),dummy=new THREE.Object3D();for(let i=0;i<32;i++){dummy.position.set(-1.24+i*.08,1.75,.074);dummy.rotation.set(0,.10,0);dummy.scale.set(.072,1.78,.012);dummy.updateMatrix();slats.setMatrixAt(i,dummy.matrix);}slats.name='Ламели жалюзи';slats.receiveShadow=true;g.add(slats);
  box(g,0,2.68,.055,2.72,.035,.08,mats.edge);box(g,0,.79,.13,2.76,.045,.29,mats.edge);
  const radiator=new THREE.InstancedMesh(geom.box,mats.edge,13);for(let i=0;i<13;i++){dummy.position.set(-.52+i*.083,.39,.04);dummy.rotation.set(0,0,0);dummy.scale.set(.06,.59,.13);dummy.updateMatrix();radiator.setMatrixAt(i,dummy.matrix);}radiator.name='Секции радиатора';radiator.castShadow=radiator.receiveShadow=true;g.add(radiator);
 }
 // Actual east wall: entrance, solid pier, division glazing, narrow banner pier, honour glazing.
 for(const [z,width] of [[-3.02,1.35],[-.02,1.80],[2.66,1.72]]){
  const g=group('Остеклённая перегородка и двери',walls.east,[ROOM.width/2-.02,0,z],-Math.PI/2);
  box(g,0,1.30,0,width,2.48,.045,mats.edge);
  for(const x of [-width/4,width/4]){box(g,x,.32,.027,width/2-.065,.56,.025,mats.edge);box(g,x,1.34,.027,width/2-.065,1.40,.025,mats.glass);box(g,x,2.31,.027,width/2-.065,.25,.025,mats.glass);box(g,x,2.10,.035,width/2,.055,.04,mats.edge);}
  box(g,0,1.15,.048,.055,2.18,.055,mats.edge);box(g,-.07,1.07,.09,.023,.16,.04,mats.steel);
 }
 const ceiling=group('Потолок — скрывается в общем виде',model);box(ceiling,0,2.9,0,ROOM.width+.25,.1,ROOM.depth+.20,new THREE.MeshBasicMaterial({color:'#e0ddd7',toneMapped:false}));
 const lightmat=new THREE.MeshStandardMaterial({color:'#f5ffff',emissive:'#d4eef7',emissiveIntensity:.65,roughness:.4});
 for(const x of [-1.92,1.92])for(const z of [-1.98,1.98]){box(ceiling,x,2.78,z,.19,.09,1.12,mats.edge);box(ceiling,x,2.723,z,.17,.025,1.08,lightmat);}
 ceiling.traverse(o=>{o.castShadow=false;});
 // All display faces use the user's actual photographs.
 function panel(id,p,yaw,w,h,wallMounted=false){
  const sourceImage=texM[id].map.image;h=(w-.022)/(sourceImage.width/sourceImage.height)+.022; // Preserve faces and lettering without vertical stretching.
  const meta=data.groups.find(g=>g.id===id),g=group(meta.title,model,p,yaw);const cy=id==='history'?1.50:wallMounted?1.62:1.48;
  box(g,0,cy,0,w,h,.055,id==='forest'?mats.green:mats.darkwood);photo(g,id,0,cy,.032,w-.022,h-.022);
  if(!wallMounted){for(const x of [-w/2-.025,w/2+.025]){rod(g,[x,.035,0],[x,cy+h/2+.04,0],.014,mats.steel);rod(g,[x,.03,id==='honour'?-.235:-.29],[x,.03,id==='honour'?.235:.29],.014,mats.steel);}for(const y of [cy-h/2-.025,cy+h/2+.025])rod(g,[-w/2-.045,y,.015],[w/2+.045,y,.015],.014,mats.steel);}
  const offset=new THREE.Vector3(0,1.65,2.2).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(new THREE.Vector3(...p));const aim=new THREE.Vector3(0,cy,0).add(new THREE.Vector3(...p));interactive(g,id,offset.toArray(),aim.toArray());if(!wallMounted)solid(g);return g;
 }
 panel('forest',at([.02,0,-3.19],'n'),0,2.38,1.56,true);
 panel('afghan',at([-2.59,0,-2.20],'w'),Math.PI/2,1.86,1.50);
 panel('division',at([2.54,0,-.04],'e'),-Math.PI/2,1.84,1.65);
 panel('honour',at([2.61,0,2.66],'e'),-Math.PI/2,1.60,1.48);
 panel('memory',at([.65,0,2.90],'s'),Math.PI,1.86,1.40);
 panel('history',at([2.835,0,1.37],'e'),-Math.PI/2,.80,2.38,true);
 function table(name,p,yaw=0,w=1.25,d=.6){const g=group(name,model,p,yaw);box(g,0,.76,0,w,.045,d,mats.paper);box(g,0,.48,-d*.3,w-.08,.46,.022,mats.paper);for(const x of [-w/2+.07,w/2-.07]){box(g,x,.385,0,.035,.72,.035,mats.steel);box(g,x,.04,0,.06,.035,d-.07,mats.steel);for(const z of [-d/2+.05,d/2-.05])box(g,x,.02,z,.062,.035,.065,mats.black);}return solid(g);}
 const archive=table('Архив — первая школьная парта',[1.88,0,-.55],0,1.2,.54);
 const archiveRear=table('Архив — вторая школьная парта',[1.88,0,-.01],0,1.2,.54);
 const letter=photo(archive,'letters',0,.788,.23,1.08,.66);letter.rotation.x=-Math.PI/2;
 for(let i=0;i<4;i++){const b=box(archiveRear,-.43+i*.285,.80,-.12,.255,.018,.30,i===2?mats.green:i===3?mats.red:mats.paper);b.rotation.y=(rand()-.5)*.13;}
 interactive(archive,'letters',[.65,1.65,-.75],[1.88,.76,-.25]);interactive(archiveRear,'letters');
 function chair(x,z){const g=group('Школьный стул',model,[x,0,z],Math.PI);box(g,0,.43,0,.38,.025,.38,mats.wood);box(g,0,.75,.18,.40,.19,.022,mats.wood);for(const a of [-.17,.17]){rod(g,[a,.04,-.17],[a,.43,-.17],.014,mats.steel);rod(g,[a,.04,.17],[a,.86,.17],.014,mats.steel);}return solid(g);}chair(1.58,-1.15);chair(2.15,-1.15);
 const afTable=table('Стол под стендом об Афганистане',at([-2.03,0,-2.17],'w'),Math.PI/2,1.25,.53);
 for(let i=0;i<3;i++)box(afTable,.16,.815+i*.05,0,.43,.045,.32,mats.red);box(afTable,-.37,.797,.03,.3,.015,.22,mats.paper);
 const ironTable=table('Стол с утюгами',at([-.4,0,-2.87],'n'),0,1.48,.5);
 function vase(g,x,y,z,size=.18,mat=mats.clay){return lathe(g,x,y,z,[[.005,0],[size*.38,0],[size*.55,size*.15],[size*.62,size*.5],[size*.5,size*.86],[size*.34,size],[size*.33,size*1.15],[size*.4,size*1.2],[size*.4,size*1.25],[size*.32,size*1.25],[size*.29,size*1.14]],mat);}
 // Object-scale geometry from the close reference frames (IMG_5581, 98–99 s).
 // Small opaque parts are batched per object/material; transparent glass stays separate.
 const artifactMats={};
 if(texM.castiron){texM.castiron.map.wrapS=texM.castiron.map.wrapT=THREE.RepeatWrapping;}
 function artifactMaterial(key,hex,metal=.5,rough=.7){
  if(!artifactMats[key])artifactMats[key]=new THREE.MeshStandardMaterial({color:hex,map:texM.castiron?.map,bumpMap:texM.castiron?.map,bumpScale:.00025,metalness:metal,roughness:rough,envMapIntensity:.85});
  return artifactMats[key];
 }
 const castMetal=artifactMaterial('cast','#a39a8b',.48,.76),edgeMetal=artifactMaterial('edges','#b5aea0',.65,.52),soot=artifactMaterial('soot','#514b42',.18,.94);
 const handleWood=mats.old.clone();handleWood.color.set('#95806b');handleWood.roughness=.79;handleWood.bumpScale=.0006;
 const lampGlass=new THREE.MeshPhysicalMaterial({color:'#c4d1c4',transparent:true,opacity:.18,roughness:.10,metalness:0,ior:1.47,clearcoat:.8,clearcoatRoughness:.08,envMapIntensity:1.2,depthWrite:false,side:THREE.DoubleSide});
 function detailCurve(g,pts,r,mat,closed=false){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),closed,'centripetal'),compact?24:40,r,compact?5:7,closed),mat);}
 function detailLathe(g,pts,mat,segments=40,smooth=mat.transparent){let profile=pts.map(p=>new THREE.Vector2(...p));if(smooth)profile=new THREE.SplineCurve(profile).getPoints(64).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));return mesh(g,new THREE.LatheGeometry(profile,compact?Math.min(segments,28):segments),mat);}
 function batchArtifact(g){
  g.updateMatrixWorld(true);const bins=new Map(),inv=new THREE.Matrix4().copy(g.matrixWorld).invert();
  g.traverse(o=>{if(!o.isMesh||o.material.transparent)return;const id=o.material.uuid;if(!bins.has(id))bins.set(id,{mat:o.material,items:[]});bins.get(id).items.push(o);});
  for(const {mat,items}of bins.values()){
   const attrs={position:[],normal:[],uv:[]};
   for(const o of items){let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));for(const k of Object.keys(attrs))attrs[k].push(geo.attributes[k].array);geo.dispose();o.removeFromParent();}
   const geo=new THREE.BufferGeometry();for(const [k,arrays]of Object.entries(attrs)){const all=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let off=0;for(const a of arrays){all.set(a,off);off+=a.length;}geo.setAttribute(k,new THREE.BufferAttribute(all,k==='uv'?2:3));}
   const m=mesh(g,geo,mat);m.name=g.name+' — '+(mat===handleWood?'деревянная ручка':'металлические детали');
  }
 }
 function ironFootprint(){const sh=new THREE.Shape();sh.moveTo(-.31,-.49);sh.quadraticCurveTo(-.41,-.48,-.40,-.29);sh.quadraticCurveTo(-.41,.13,-.23,.39);sh.quadraticCurveTo(-.10,.56,0,.63);sh.quadraticCurveTo(.10,.56,.23,.39);sh.quadraticCurveTo(.41,.13,.40,-.29);sh.quadraticCurveTo(.41,-.48,.31,-.49);sh.closePath();return sh;}
 function ironPlate(g,y,thickness,mat,scale=1){const geo=new THREE.ExtrudeGeometry(ironFootprint(),{depth:thickness,bevelEnabled:true,bevelSize:.010,bevelThickness:.006,bevelSegments:2,curveSegments:10});geo.rotateX(-Math.PI/2);geo.scale(scale,1,scale);return mesh(g,geo,mat,[0,y,0]);}
 function coalShell(g,h,mat){
  const pts=ironFootprint().getSpacedPoints(112),n=pts.length-1,rows=22,vs=[],uv=[],idx=[];
  function opening(i,j){const u=(i+.5)/n,v=(j+.5)/rows;return [.14,.24,.76,.86].some(c=>Math.pow((u-c)/.033,2)+Math.pow((v-.36)/.115,2)<1)||([.10,.20,.30,.70,.80,.90].some(c=>Math.abs(u-c)<.018)&&v>.83);}
  const quad=(a,b,c,d)=>idx.push(a,b,c,a,c,d);
  for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++)for(let i=0;i<=n;i++){const p=pts[i],k=layer?.943:1;vs.push(p.x*k,.045+h*j/rows,-p.y*k);uv.push(i/n*2,j/rows);}
  const stride=n+1,side=stride*(rows+1);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
   if(opening(i,j))continue;const a=j*stride+i,b=a+1,c=b+stride,d=a+stride;
   quad(a,d,c,b);quad(a+side,b+side,c+side,d+side);
   if(j===0||opening(i,j-1))quad(a,b,b+side,a+side);
   if(j===rows-1||opening(i,j+1))quad(d,d+side,c+side,c);
   if(opening((i+n-1)%n,j))quad(a,a+side,d+side,d);
   if(opening((i+1)%n,j))quad(b,c,c+side,b+side);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,mat);
 }
 function iron(g,x,y,z,s=.18,variant=0,yaw=0){
  const flat=variant===2,a=group(flat?'Литой чугунный утюг':'Угольный утюг с крышкой и продухами',g,[x,y,z],yaw);a.userData.artifact='iron';a.userData.variant=variant;
  // Normalized dimensions: pointed sole, hollow coal chamber, hinged lid, wooden longitudinal grip.
  const body=group('Корпус утюга',a),h=flat?.22:variant===1?.67:.78;
  ironPlate(body,.006,.036,edgeMetal,1.04);
  if(flat){ironPlate(body,.045,h,castMetal,.95);}else{coalShell(body,h,castMetal);ironPlate(body,.047,.014,soot,.93);}
  const lid=group('Крышка с шарниром',body,[0,h+.06,.49]);if(variant===1)lid.rotation.x=.085;
  const assembly=group('Крышка и рукоять',lid,[0,0,-.49]);ironPlate(assembly,0,.035,edgeMetal,1.015);
  if(!flat){const hinge=cyl(body,0,h+.065,.49,.035,.24,edgeMetal,.035,16);hinge.rotation.z=Math.PI/2;box(assembly,0,.07,-.53,.07,.15,.034,edgeMetal);cyl(assembly,0,.10,-.552,.025,.025,soot).rotation.x=Math.PI/2;}
  for(const z0 of [-.29,.24]){
   // Broad forged handle supports, bent inward beneath a turned wooden grip.
   const sign=z0<0?-1:1;detailCurve(assembly,[[0,.028,z0],[0,.13,z0],[0,.36,z0+sign*.045],[0,.45,z0-sign*.04]],.033,castMetal);
   box(assembly,0,.048,z0,.15,.024,.115,edgeMetal);for(const xx of [-.047,.047])mesh(assembly,new THREE.SphereGeometry(.019,8,6),edgeMetal,[xx,.062,z0]);
  }
  const grip=detailLathe(assembly,[[0,0],[.052,0],[.064,.04],[.069,.09],[.064,.18],[.064,.36],[.07,.43],[.055,.49],[0,.50]],flat?castMetal:handleWood,24);grip.rotation.x=Math.PI/2;grip.position.set(0,.465,-.275);
  for(const zz of [-.285,.225]){const collar=cyl(assembly,0,.465,zz,.049,.018,edgeMetal,.049,20);collar.rotation.x=Math.PI/2;}
  batchArtifact(a);a.scale.setScalar(s);return a;
 }
 function ventedLampCap(g,mat){
  detailLathe(g,[[.20,1.22],[.27,1.24],[.35,1.27],[.35,1.30],[.27,1.33],[.26,1.35]],mat);
  // Separated pressed ribs leave genuine ventilation gaps around the cap.
  for(let i=0;i<16;i++){const t=i/16*Math.PI*2;const rib=box(g,Math.sin(t)*.233,1.405,Math.cos(t)*.233,.057,.13,.035,mat);rib.rotation.y=t;}
  detailLathe(g,[[.235,1.46],[.285,1.47],[.30,1.50],[.24,1.53],[.18,1.55],[.17,1.59],[.01,1.61]],mat);
  const loop=ring(g,0,1.67,0,.065,.014,mat);loop.scale.y=.65;
 }
 function lantern(g,x,y,z,s=.22,variant=0,yaw=0){
  const names=['Болотный фонарь','Фонарь с охристой патиной','Фонарь без стекла','Фонарь с остатками красной краски','Керосиновый фонарь'];
  const a=group(names[variant%5],g,[x,y,z],yaw);a.userData.artifact='lantern';a.userData.variant=variant;
  const metal=artifactMaterial('lamp'+variant%5,['#b0b4a0','#c7ae87','#aeaaa0','#b97c6e','#c2b5a0'][variant%5],.52,.70);
  detailLathe(a,[[0,0],[.40,0],[.45,.035],[.45,.065],[.425,.085],[.42,.19],[.37,.29],[.25,.34],[0,.34]],metal);
  for(const [yy,rr]of [[.055,.45],[.115,.425],[.275,.36]]){const seam=ring(a,0,yy,0,rr,.009,edgeMetal);seam.rotation.x=Math.PI/2;}
  const filler=group('Пробка топливного бачка',a,[.26,.28,.16]);filler.rotation.z=-.35;cyl(filler,0,.02,0,.078,.045,metal,.078,20);const seal=ring(filler,0,.048,0,.065,.012,edgeMetal);seal.rotation.x=Math.PI/2;
  detailLathe(a,[[.11,.34],[.15,.36],[.15,.40],[.12,.43],[.09,.45],[.06,.48]],edgeMetal);box(a,0,.495,0,.07,.055,.025,mats.black);
  rod(a,[.08,.41,0],[.21,.41,0],.018,metal);const wickWheel=cyl(a,.23,.41,0,.049,.025,edgeMetal,.049,16);wickWheel.rotation.z=Math.PI/2;
  for(const sign of [-1,1]){
   detailCurve(a,[[sign*.34,.18,0],[sign*.49,.39,0],[sign*.50,.65,0],[sign*.47,1.11,0],[sign*.38,1.40,0],[sign*.23,1.47,0]],.052,metal);
   const pivot=cyl(a,sign*.40,1.39,0,.052,.028,edgeMetal,.052,16);pivot.rotation.z=Math.PI/2;
  }
  if(variant!==2){const glass=detailLathe(a,[[.18,.43],[.27,.48],[.325,.60],[.335,.78],[.31,.98],[.25,1.15],[.21,1.26]],lampGlass,48);glass.name='Прозрачная стеклянная колба';glass.castShadow=false;glass.receiveShadow=false;glass.renderOrder=2;
   for(const [yy,rr]of [[.445,.19],[1.245,.21]]){const rim=ring(a,0,yy,0,rr,.009,lampGlass);rim.rotation.x=Math.PI/2;rim.castShadow=false;}
  }
  // Bent wire protects the bulb without hiding its silhouette.
  for(const side of [-1,1]){
   detailCurve(a,[[-.32,.44,0],[-.28,.63,side*.22],[0,.90,side*.34],[.25,1.15,side*.10],[.30,1.21,0]],.013,metal);
   detailCurve(a,[[.32,.44,0],[.28,.63,side*.22],[0,.90,side*.34],[-.25,1.15,side*.10],[-.30,1.21,0]],.013,metal);
  }
  ventedLampCap(a,metal);
  const bail=group('Дуговая ручка на боковых шарнирах',a,[0,1.39,0]);bail.rotation.x=variant===1?-.24:.09;
  detailCurve(bail,[[-.40,0,0],[-.43,.32,0],[-.27,.62,0],[0,.75,0],[.27,.62,0],[.43,.32,0],[.40,0,0]],.014,edgeMetal);
  batchArtifact(a);a.scale.setScalar(s);return a;
 }
 function pedestalLamp(g,x,y,z){
  const a=group('Настольная керосиновая лампа на зелёной стеклянной ножке',g,[x,y,z]);a.userData.artifact='pedestal-lamp';
  const greenGlass=new THREE.MeshPhysicalMaterial({color:'#246658',roughness:.25,metalness:.06,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.05});
  const tankGlass=lampGlass.clone();tankGlass.color.set('#b6ad81');tankGlass.opacity=.20;
  const brass=artifactMaterial('burner','#c0a579',.64,.50);
  const base=detailLathe(a,[[0,0],[.095,0],[.105,.012],[.099,.023],[.077,.032],[.068,.053],[.04,.08],[.025,.11],[.021,.16],[.027,.17],[.028,.185],[.021,.193]],greenGlass,40,true);
  for(let i=0;i<8;i++){const t=i/8*Math.PI*2;detailCurve(a,[[Math.sin(t)*.083,.025,Math.cos(t)*.083],[Math.sin(t)*.055,.062,Math.cos(t)*.055],[Math.sin(t)*.026,.103,Math.cos(t)*.026]],.004,greenGlass);}
  detailLathe(a,[[.012,.181],[.045,.19],[.074,.21],[.086,.24],[.078,.27],[.04,.29],[.025,.30]],tankGlass,48).castShadow=false;
  detailLathe(a,[[.026,.298],[.032,.305],[.03,.315],[.025,.332],[.009,.34]],brass);box(a,0,.345,0,.012,.025,.003,mats.black);
  rod(a,[.021,.319,0],[.046,.319,0],.003,brass);cyl(a,.048,.319,0,.011,.005,brass).rotation.z=Math.PI/2;
  batchArtifact(a);return a;
 }
 // The tabletop contains both irons and lamps, as seen in the video.
 iron(ironTable,-.60,.784,.00,.16,0,-.10);iron(ironTable,-.40,.784,.01,.14,2,.10);
 iron(ironTable,-.21,.784,-.01,.165,1,-.10);lantern(ironTable,-.015,.784,.01,.105,4,-.12);
 pedestalLamp(ironTable,.20,.784,.00);iron(ironTable,.42,.784,-.01,.165,0,.12);iron(ironTable,.62,.784,.01,.14,1,-.12);
 interactive(ironTable,'everyday');
 const northObjects=solid(group('Прялки, фонари и маслобойки у лесничества',model,[0,0,-DZ]));
 for(const [i,x,z,s]of [[0,-.85,-2.79,.215],[1,-.54,-2.77,.215],[2,-.23,-2.79,.20],[3,.08,-2.77,.21],[4,-.73,-2.49,.20],[5,-.41,-2.48,.19],[6,-.09,-2.49,.205]])lantern(northObjects,x,.014,z,s,i%5,(i-3)*.10);
 interactive(northObjects,'everyday');
 function basket(g,x,y,z,w=.42,h=.35,handle=true){const a=group('Плетёная корзина',g,[x,y,z]);const body=lathe(a,0,0,0,[[w*.33,0],[w*.4,.035],[w*.49,h*.8],[w*.5,h],[w*.46,h],[w*.44,h*.88],[w*.35,.035],[.001,.035]],mats.wicker);body.scale.z=.78;const rim=ring(a,0,h,0,w*.48,.018,mats.old);rim.rotation.x=Math.PI/2;rim.scale.y=.8;if(handle){const curve=new THREE.EllipseCurve(0,0,w*.42,h*.65,0,Math.PI,false,0);const pts=curve.getPoints(18).map(p=>new THREE.Vector3(p.x,p.y+h,0));mesh(a,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.015,6,false),mats.old);}return a;}
 function spinning(g,x,y,z,s=1,yaw=0){const a=group('Прялка с колесом, катушкой и приводным ремнём',g,[x,y,z],yaw);for(const q of [-.23,.23])box(a,q*s,.035*s,0,.06*s,.05*s,.53*s,mats.old);box(a,0,.1*s,.1*s,.47*s,.065*s,.09*s,mats.old);const cy=.49*s,r=.29*s;ring(a,0,cy,-.02*s,r,.028*s);cyl(a,0,cy,-.02*s,.055*s,.1*s,mats.old).rotation.x=Math.PI/2;for(let i=0;i<8;i++){let t=i*Math.PI/4;rod(a,[0,cy,-.02*s],[r*Math.cos(t),cy+r*Math.sin(t),-.02*s],.012*s,mats.old);}for(const q of [-.18,.18]){lathe(a,q*s,.1*s,.12*s,[[.025*s,0],[.035*s,.07*s],[.018*s,.16*s],[.03*s,.28*s],[.018*s,.38*s],[.037*s,.43*s],[.022*s,.55*s],[.034*s,.59*s],[.01*s,.67*s]],mats.old);}box(a,0,.9*s,.12*s,.43*s,.06*s,.13*s,mats.old);rod(a,[-.15*s,.91*s,.12*s],[.15*s,.91*s,.12*s],.032*s,mats.old);rod(a,[.16*s,.93*s,.12*s],[.16*s,1.35*s,.12*s],.016*s,mats.old);box(a,.16*s,1.35*s,.12*s,.12*s,.27*s,.022*s,mats.old);box(a,0,.045*s,-.12*s,.11*s,.02*s,.32*s,mats.old);
 const bob=cyl(a,0,.985*s,.13*s,.038*s,.19*s,mats.old);bob.rotation.x=Math.PI/2;
 for(const z of [.035,.225]){const end=cyl(a,0,.985*s,z*s,.06*s,.015*s,mats.old);end.rotation.x=Math.PI/2;}
 for(const sign of [-1,1])rod(a,[0,.985*s,.26*s],[sign*.075*s,.985*s,.10*s],.011*s,mats.old);
 const beltPts=[[0,cy-r,-.04*s],[-r*.96,cy,-.04*s],[-.052*s,.985*s,-.04*s],[.052*s,.985*s,-.04*s],[r*.96,cy,-.04*s],[0,cy-r,-.04*s]].map(p=>new THREE.Vector3(...p));mesh(a,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beltPts),60,.0022*s,4,true),mats.darkwood);rod(a,[.05*s,.05*s,-.18*s],[.09*s,cy,-.04*s],.008*s,mats.old);
 return a;}
 spinning(northObjects,.83,.01,-2.92,.83,.08);spinning(northObjects,1.54,.01,-2.92,.9,-.12);
 for(const x of [1.99,2.30]){cyl(northObjects,x,.26,-2.95,.11,.52,mats.old);for(const y of [.06,.4])cyl(northObjects,x,y,-2.95,.115,.025,mats.iron);rod(northObjects,[x,.52,-2.95],[x,.83,-2.95],.017,mats.old);}
 const daily=group('Предметы быта у лесничества');daily.userData.exhibit='everyday';// Accessible destination, shared with the nearby furniture.
 locations.everyday={pos:at([.1,1.62,-1.55],'n'),target:at([.3,.7,-2.95],'n')};
 function helmet(g,x,y,z,r=.15,variant=0){
  const a=group('Стальная каска: купол, козырёк, завальцованный край',g,[x,y,z],variant*.23-.2),N=64,R=24,vs=[],uv=[],ix=[],rim=[];
  function pt(t,ang,inner=false){const front=Math.max(0,Math.cos(ang)),back=Math.max(0,-Math.cos(ang));const radial=Math.sin(t*Math.PI/2);const flare=Math.pow(t,11);const rx=r*(.93*radial+.11*flare);const rz=r*(1.05*radial+flare*(.32*front+.13*back));const h=r*(1.22*Math.pow(Math.cos(t*Math.PI/2),.66)+.07*front*Math.pow(t,7));const inset=inner?.003*radial:0;return [(rx-inset)*Math.sin(ang),h-(inner?.002:0),(rz-inset)*Math.cos(ang)];}
  for(let layer=0;layer<2;layer++)for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){const t=j/R,ang=i/N*Math.PI*2;vs.push(...pt(t,ang,layer===1));uv.push(i/N*2,j/R);}
  const side=(R+1)*(N+1);
  for(let layer=0;layer<2;layer++)for(let j=0;j<R;j++)for(let i=0;i<N;i++){let k=layer*side+j*(N+1)+i;const damaged=variant===1&&i>1&&i<25&&j/R>=.69+.012*Math.sin(i*2.3)&&j/R<=.72+(i<9?.045:0);if(damaged)continue;if(layer===0)ix.push(k,k+N+1,k+1,k+1,k+N+1,k+N+2);else ix.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const normals=geo.attributes.normal;for(let k=0;k<normals.count;k++){if(Math.hypot(normals.getX(k),normals.getY(k),normals.getZ(k))<.5)normals.setXYZ(k,0,k<side?1:-1,0);}const mat=mats.iron.clone();mat.side=THREE.DoubleSide;mat.color.set(variant===1?'#655f4f':'#554b42');mat.metalness=.18;mat.envMapIntensity=.50;mat.roughness=variant===1?.92:.82;mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\nvec4 ironTex = texture2D(map,vMapUv);\ndiffuseColor.rgb *= mix(vec3(.72),ironTex.rgb,.18);\n#endif');};mesh(a,geo,mat);
  const contact=mesh(a,geom.plane,contactMat,[0,.002,0],[r*2.6,r*2.8,1]);contact.rotation.x=-Math.PI/2;contact.castShadow=contact.receiveShadow=false;
  for(let i=0;i<=N;i++)rim.push(new THREE.Vector3(...pt(1,i/N*Math.PI*2)));mesh(a,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim),80,.0021,5,true),mat);
  for(const ang of [-1.15,1.15,Math.PI]){const p=pt(.76,ang);const rivet=mesh(a,new THREE.SphereGeometry(.005,10,8),mats.iron,p);}
  a.userData.exhibit='helmets';a.traverse(o=>{if(o.isMesh)clickables.push(o)});return a;
 }
 function horseshoe(g,x,y,z,r=.07){const a=group('Подкова',g,[x,y,z]);const pts=[];for(let i=0;i<=24;i++){const ang=-.33+i/24*(Math.PI+ .66);pts.push(new THREE.Vector3(Math.cos(ang)*r,.008,Math.sin(ang)*r));}mesh(a,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),28,.009,6,false),mats.iron);for(const p of [pts[0],pts[24]])box(a,p.x,.013,p.z,.028,.012,.025,mats.iron);return a;}
 const recessTex=canvasTexture((c,n)=>{const g=c.createLinearGradient(0,0,0,n);g.addColorStop(0,'rgba(21,16,10,.58)');g.addColorStop(.30,'rgba(21,16,10,.06)');g.addColorStop(.75,'rgba(21,16,10,.01)');g.addColorStop(1,'rgba(21,16,10,.22)');c.fillStyle=g;c.fillRect(0,0,n,n);const edge=c.createLinearGradient(0,0,n,0);edge.addColorStop(0,'rgba(21,16,10,.32)');edge.addColorStop(.18,'rgba(21,16,10,0)');edge.addColorStop(.82,'rgba(21,16,10,0)');edge.addColorStop(1,'rgba(21,16,10,.32)');c.fillStyle=edge;c.fillRect(0,0,n,n);});
 const recessMat=new THREE.MeshBasicMaterial({map:recessTex,transparent:true,depthWrite:false,toneMapped:false});
 function shelf(p,yaw,kind){const g=group(kind==='house'?'Шкаф с иконами и предметами быта':kind==='tools'?'Шкаф с подковами и инструментами':kind==='militarywest'?'Военный шкаф у окон':'Военный шкаф у стенда «Помним»',model,p,yaw);box(g,0,1,0,.82,2,.035,mats.shelfBack);for(const x of [-.42,.42])box(g,x,1,.19,.035,2,.41,mats.wood);for(const y of [.035,.43,.83,1.23,1.63,1.99])box(g,0,y,.19,.84,.035,.42,mats.wood);
  for(const y of [.23,.63,1.03,1.43,1.82]){const shade=mesh(g,geom.plane,recessMat,[0,y,.020],[.795,.368,1]);shade.castShadow=shade.receiveShadow=false;}
  if(kind.startsWith('military')){for(const [j,x] of (kind==='militarywest'?[-.22]:[-.22,.20]).entries())for(const y of [.455,1.655])helmet(g,x,y,.22,.145,j);
 if(kind==='militarywest'){
 const tin=group('Аптечная металлическая коробка',g,[.17,1.655,.15]);box(tin,0,.12,0,.24,.23,.10,mats.iron);const crossMat=color('#71403a');box(tin,0,.12,.054,.115,.032,.006,crossMat);box(tin,0,.12,.055,.032,.12,.006,crossMat);
 const brass=new THREE.MeshStandardMaterial({color:'#ae9351',metalness:.65,roughness:.52});cyl(g,.20,1.39,.2,.046,.25,brass);box(g,.20,1.255,.2,.19,.035,.16,mats.darkwood);
 }
const mugMat=new THREE.MeshStandardMaterial({color:'#9faaa7',metalness:.45,roughness:.55});const mug=group('Металлическая кружка',g,[-.2,.85,.2]);lathe(mug,0,0,0,[[.001,0],[.065,0],[.068,.12],[.064,.125],[.060,.12],[.059,.01],[.001,.01]],mugMat);const handle=ring(mug,.085,.067,0,.038,.007,mugMat);handle.scale.x=.7;box(g,.17,.92,.2,.21,.14,.14,mats.iron);for(let i=0;i<3;i++){box(g,-.26+i*.25,1.26,.21,.17,.035,.16,mats.iron);}cyl(g,.19,.51,.24,.075,.11,mats.iron);}
  else if(kind==='house'){const hat=lathe(g,-.14,2.012,.15,[[.001,0],[.20,0],[.23,.01],[.19,.02],[.13,.025],[.12,.09],[.08,.105],[.001,.108]],mats.wicker);hat.scale.z=.82;const band=ring(g,-.14,2.078,.15,.12,.010,mats.darkwood);band.rotation.x=Math.PI/2;band.scale.y=.82;vase(g,-.22,.855,.2,.19);vase(g,.15,1.255,.22,.18,mats.clay);for(const [i,x,w,h,tint] of [[0,-.13,.16,.235,'#306365'],[1,.075,.18,.25,'#433b30'],[2,.285,.22,.30,'#584a31']]){const f=group('Икона в отдельной раме',g,[x,1.649,.22]);f.rotation.x=-.085;const frameMat=color(tint),cy=h/2;box(f,0,cy,-.012,w,h,.018,mats.darkwood);for(const xx of [-w/2+.007,w/2-.007])box(f,xx,cy,.001,.014,h,.022,frameMat);for(const yy of [.007,h-.007])box(f,0,yy,.001,w,.014,.022,frameMat);const icon=photo(f,'icon'+i,0,cy,.014,w-.025,h-.025);icon.geometry=geom.plane.clone();const uv=icon.geometry.attributes.uv,crop=[[.24,.18,.96,.98],[.04,.04,.97,.98],[.10,.09,.96,.97]][i];for(let v=0;v<uv.count;v++)uv.setXY(v,crop[0]+uv.getX(v)*(crop[2]-crop[0]),crop[1]+uv.getY(v)*(crop[3]-crop[1]));}vase(g,-.31,1.649,.17,.14,mats.iron);for(let i=0;i<4;i++){const r=ring(g,-.28+i*.18,.47,.21,.058,.017,mats.old);r.rotation.x=Math.PI/2;}vase(g,.19,.055,.2,.23);}
  else{basket(g,-.2,1.65,.2,.3,.17,false);box(g,.2,1.69,.19,.24,.06,.12,mats.old);for(let j=0;j<3;j++)for(let i=0;i<3;i++){horseshoe(g,-.25+i*.25,.455+j*.4,.2,.071);}vase(g,-.23,.055,.19,.2);}
  interactive(g,kind==='house'?'house':'everyday');return solid(g);
 }
 const westMilitary=shelf(at([-2.74,0,-.43],'w'),Math.PI/2,'militarywest');const iconCabinet=shelf(at([-2.74,0,1.15],'w'),Math.PI/2,'house');const southMilitary=shelf(at([1.85,0,3.12],'se'),Math.PI,'military');shelf(at([-1.61,0,-3.11],'n'),0,'tools');
 locations.helmets={pos:at([1.90,1.62,2.00],'se'),target:at([1.90,1.74,2.91],'se')};
 const closet=solid(group('Закрытый шкаф',model,[-DX,0,-DZ]));box(closet,-2.31,.97,-2.94,.83,1.94,.5,mats.wood);for(const x of [-2.39,-2.26])box(closet,x,.93,-2.68,.015,.09,.022,mats.steel);
 const chest=solid(group('Плетёный сундук',model,at([-2.01,0,.42],'w'),Math.PI/2));function chestPart(y,w,h,d){const shape=new THREE.Shape(),r=.025;shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const geo=new THREE.ExtrudeGeometry(shape,{depth:d-.025,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:3,curveSegments:4});const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/.34,uv.getY(i)/.34);mesh(chest,geo,mats.wicker,[0,y,-d/2+.012]);}chestPart(.26,1.08,.46,.43);chestPart(.52,1.11,.075,.46);box(chest,0,.36,.232,.045,.09,.027,mats.old);
 // Wooden ethnographic corner at the far end of the window wall.
 const hut=solid(group('Этнографический уголок с печью',model,[-1.96,0,2.98],Math.PI));
 for(let i=0;i<12;i++){const y=.20+i*.172;const b=box(hut,(rand()-.5)*.035,y,-.69,2.72+rand()*.035,.153+rand()*.008,.042,mats.plank);b.rotation.z=(rand()-.5)*.004;box(hut,1.36,y,-.015,.043,.155,1.39+(rand()-.5)*.025,mats.plank);}
 for(let i=0;i<10;i++){const plank=box(hut,-1.34+i*.295,2.27,.025+(rand()-.5)*.04,.20,.036,1.52+rand()*.06,mats.plank);plank.rotation.y=(rand()-.5)*.014;}
 for(let i=0;i<12;i++)box(hut,-1.34+i*.244,.11,.15+(rand()-.5)*.025,.23,.048,1.64+rand()*.06,mats.plank);
 for(const x of [-1.08,1.08])box(hut,x,.047,.15,.11,.085,1.66,mats.old);
 const stove=group('Макет печи в стыке деревянных стен',hut,[1.00,.135,-.32],-.20);
 box(stove,0,.30,0,.58,.60,.54,mats.stove);box(stove,0,.965,-.11,.44,.73,.30,mats.stove);box(stove,0,1.70,-.18,.28,.74,.18,mats.stove);
 for(const [y,w,d,z] of [[.61,.64,.68,.025],[1.34,.51,.45,-.04]])box(stove,0,y,z,w,.025,d,mats.stove);
 const arch=new THREE.Shape();arch.moveTo(-.155,0);arch.lineTo(.155,0);arch.lineTo(.155,.17);arch.absarc(0,.17,.155,0,Math.PI,false);arch.lineTo(-.155,0);mesh(stove,new THREE.ShapeGeometry(arch),mats.black,[0,.16,.274]);vase(stove,.13,.6225,.195,.18,mats.iron);vase(stove,.05,1.3525,.085,.14,mats.iron);
 spinning(hut,-.96,.145,-.13,.75,.04);spinning(hut,-.15,.008,1.17,.86,-.06);basket(hut,.64,.012,1.26,.59,.29,true);basket(hut,-.67,.145,.48,.51,.23,false);
 for(let i=0;i<3;i++)iron(hut,-1.10+i*.23,.145,.81,.19,i===1?2:1,(i-1)*.12);
 // The low wooden frame visible between the rear wheel and stove in IMG_5621.
 const lowFrame=group('Низкая деревянная рама в бытовом уголке',hut,[-.14,.145,-.025]);
 for(const x of [-.43,.43])for(const z of [-.18,.18]){lathe(lowFrame,x,0,z,[[.023,0],[.028,.07],[.021,.39],[.029,.43],[.025,.52]],mats.old);}
 for(const z of [-.18,.18])for(const y of [.13,.31,.46])rod(lowFrame,[-.43,y,z],[.43,y,z],.014,mats.old);
 for(const x of [-.43,.43])for(const y of [.13,.46])rod(lowFrame,[x,y,-.18],[x,y,.18],.014,mats.old);
 box(lowFrame,0,.11,0,.78,.018,.30,mats.wicker);
 const ovenTool=group('Ухват у печи',hut,[.56,.145,-.39]);ovenTool.rotation.z=-.075;rod(ovenTool,[0,.18,0],[0,1.58,0],.013,mats.old);
 const forkPoints=[];for(let i=0;i<=20;i++){const t=Math.PI*.15+i/20*Math.PI*.70;forkPoints.push(new THREE.Vector3(Math.cos(t)*.10,.19-Math.sin(t)*.12,0));}mesh(ovenTool,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(forkPoints),24,.006,6,false),mats.iron);
 const frame=group('Вышивка',hut,[.98,.15,.34],-.18);box(frame,0,.365,0,.56,.73,.035,mats.darkwood);photo(frame,'embroidery',0,.365,.022,.51,.68);
 const bird=group('Вышивка с птицей',hut,[-1.12,.15,-.54]);box(bird,0,.25,0,.4,.42,.025,mats.darkwood);photo(bird,'bird',0,.25,.016,.35,.37);
 vase(hut,1.16,.145,.75,.27);cyl(hut,.90,.41,.73,.055,.45,mats.red);rod(hut,[.90,.145,.73],[.90,1.10,.73],.012,mats.old);
 const wash=group('Стиральная доска',hut,[-.51,.145,-.43]);wash.rotation.x=-.15;box(wash,0,.34,0,.3,.66,.035,mats.old);box(wash,0,.34,.026,.23,.53,.025,mats.steel);for(let i=0;i<16;i++)box(wash,0,.09+i*.033,.046,.23,.008,.01,mats.steel);
 const shovel=group('Деревянная лопата',hut,[-.04,.145,-.52]);shovel.rotation.z=-.06;const bladeShape=new THREE.Shape();bladeShape.moveTo(-.035,.47);bladeShape.lineTo(-.105,.63);bladeShape.lineTo(-.105,1.07);bladeShape.quadraticCurveTo(0,1.15,.105,1.07);bladeShape.lineTo(.105,.63);bladeShape.lineTo(.035,.47);bladeShape.closePath();mesh(shovel,new THREE.ExtrudeGeometry(bladeShape,{depth:.025,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}),mats.old);rod(shovel,[0,0,0],[0,1.69,0],.019,mats.old);
 for(const y of [.20,.42,.69]){const hoop=ring(hut,-1.17,y,.14,.122,.010,mats.iron);hoop.rotation.x=Math.PI/2;}
 lathe(hut,-1.17,.18,.14,[[.11,0],[.13,.03],[.12,.48],[.1,.54],[.01,.54]],mats.plank);rod(hut,[-1.17,.7,.14],[-1.17,1.2,.14],.012,mats.old);
 const trough=lathe(hut,.29,.145,.64,[[.1,0],[.18,.04],[.22,.14],[.23,.18],[.2,.18],[.16,.07],[.001,.035]],mats.old);trough.scale.set(1.9,1,.9);
 interactive(hut,'house',[-.65,1.65,1.17],[-1.96,1.0,3.1]);
 // The old wooden frame rests against the solid pier, beside the narrow glazed cabinet.
 const toolsG=solid(group('Деревянная рама у простенка',model,at([2.76,0,-1.49],'e'),-Math.PI/2));
 toolsG.rotation.x=.035;
 for(const x of [-.30,.30])box(toolsG,x,.78,0,.08,1.56,.07,mats.old);
 box(toolsG,0,1.47,.02,.80,.10,.12,mats.old);rod(toolsG,[-.28,.28,.015],[.28,1.40,.015],.024,mats.old);
 box(toolsG,0,.06,.15,.91,.09,.30,mats.old);
 for(let i=0;i<3;i++){const t=box(toolsG,-.26+i*.24,.33,.13,.07,.60+rand()*.23,.045,mats.old);t.rotation.z=(rand()-.5)*.15;}
 interactive(toolsG,'everyday');
 const bookcase=solid(group('Узкая застеклённая витрина у входа',model,at([2.71,0,-2.30],'e'),-Math.PI/2));
 box(bookcase,0,.94,0,.45,1.88,.027,mats.shelfBack);
 for(const x of [-.23,.23])box(bookcase,x,.94,.12,.025,1.88,.25,mats.wood);
 for(const y of [.03,.40,.80,1.20,1.58,1.87])box(bookcase,0,y,.12,.47,.025,.25,mats.wood);
 for(let j=0;j<3;j++)for(let i=0;i<5;i++)box(bookcase,-.15+i*.07,.56+j*.40,.10,.045,.25,.14,i%2?mats.paper:mats.old);
 const clearGlass=new THREE.MeshPhysicalMaterial({color:'#dde6df',transparent:true,opacity:.14,roughness:.07,metalness:.15,depthWrite:false});box(bookcase,0,.96,.258,.395,1.72,.008,clearGlass);
 box(bookcase,.15,.99,.272,.014,.085,.017,mats.steel);
 // Soft contact shadows anchor furniture without a costly screen-space post-processing pass.
 function contact(x,z,w,d,opacity=.40){const mat=contactMat.clone();mat.opacity=opacity;const plane=mesh(model,geom.plane,mat,[x,.012,z],[w,d,1]);plane.rotation.x=-Math.PI/2;plane.castShadow=plane.receiveShadow=false;plane.renderOrder=1;}
 // Soft local contact beneath each small object; real directional shadows retain its silhouette.
 model.updateMatrixWorld(true);
 const artifactGroups=[];model.traverse(o=>{if(o.userData.artifact)artifactGroups.push(o);});
 for(const a of artifactGroups){const b=new THREE.Box3().setFromObject(a);const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;const shadowMat=contactMat.clone();shadowMat.opacity=.62;const shade=mesh(model,geom.plane,shadowMat,[cx,a.getWorldPosition(new THREE.Vector3()).y+.001,cz],[(b.max.x-b.min.x)*1.15,(b.max.z-b.min.z)*1.08,1]);shade.rotation.x=-Math.PI/2;shade.castShadow=shade.receiveShadow=false;shade.name='Контактная тень — '+a.name;}
 // Navigation and contact shadows follow the actual furniture bounds.
 model.updateMatrixWorld(true);
 const obstacles=solids.map(g=>{const b=new THREE.Box3().setFromObject(g);return {name:g.name,bounds:[b.min.x,b.max.x,b.min.z,b.max.z]};});
 for(const o of obstacles){const [l,r,t,b]=o.bounds;contact((l+r)/2,(t+b)/2,r-l+.15,b-t+.15,.35);}
 locations.room={pos:[.25,1.62,-1.9],target:[-.8,1.2,3.25]};
 // Navigation is shared; input and framing adapt to the device.
 let mode='walk',yaw=0,pitch=0,orbitTheta=.73,orbitPhi=.83,orbitDistance=12.0;
 const orbitCenter=new THREE.Vector3(0,.85,0),keyset=new Set();let last=performance.now(),activeId=null,photoIndex=0,frames=0,raf=0,dirty=true;
 const joystick={x:0,y:0,id:null},pointers=new Map();let drag=null,pinchDistance=0,hdTimer=0;
 const gallery=$('.museum-detail'),gImage=$('.museum-photo'),select=$('.museum-exhibits');
 function invalidate(){dirty=true;if(!raf&&!document.hidden)raf=requestAnimationFrame(animate);}
 function walkFov(){return camera.aspect<.85?72:59;}
 function setLook(pos,target){camera.position.set(...pos);const v=new THREE.Vector3(...target).sub(camera.position).normalize();pitch=Math.asin(v.y);yaw=Math.atan2(v.x,-v.z);updateWalk();invalidate();}
 function updateWalk(){camera.rotation.order='YXZ';camera.rotation.set(pitch,-yaw,0);}
 function updateOrbit(){camera.position.set(orbitCenter.x+orbitDistance*Math.sin(orbitPhi)*Math.cos(orbitTheta),orbitCenter.y+orbitDistance*Math.cos(orbitPhi),orbitCenter.z+orbitDistance*Math.sin(orbitPhi)*Math.sin(orbitTheta));camera.lookAt(orbitCenter);invalidate();}
 function shell(){ceiling.visible=mode==='walk';for(const [id,w]of Object.entries(walls))w.visible=mode==='walk'||(id==='north'?camera.position.z>0:id==='south'?camera.position.z<0:id==='west'?camera.position.x>0:camera.position.x<0);renderer.shadowMap.needsUpdate=true;invalidate();}
 function stopInput(){keyset.clear();joystick.x=joystick.y=0;joystick.id=null;$('.joystick-knob').style.transform='';drag=null;pointers.clear();pinchDistance=0;}
 function setMode(v){mode=v;root.dataset.mode=mode;camera.fov=mode==='walk'?walkFov():42;camera.updateProjectionMatrix();stopInput();if(mode==='walk')setLook([.35,1.62,-1.95],[-.85,1.17,3.1]);else updateOrbit();shell();$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('.museum-move').hidden=mode!=='walk';$('.museum-zoom').hidden=mode!=='overview';$('.museum-hint').textContent=mode==='walk'?(touch?'Проведите пальцем для обзора':'Мышь — обзор · WASD — идти · нажмите на стенд'):(touch?'Два пальца — масштаб · потяните для вращения':'Мышь — вращение · колёсико — масштаб');status.textContent=mode==='walk'?'Внутри музея':'Общий вид';queueHD();}
 function go(id){const l=locations[id];if(!l)return;if(mode!=='walk')setMode('walk');stopInput();setLook(l.pos,l.target);status.textContent=data.groups.find(g=>g.id===id)?.title||'Внутри музея';queueHD();canvas.focus({preventScroll:true});}
 function selectedMaterial(id){return data.texturesHD?.[id]||data.textures[id]||data.textures[id==='house'?'embroidery':id==='everyday'?'forest':'letters'];}
 for(const g of data.groups){const o=document.createElement('option');o.value=g.id;o.textContent=g.title;select.appendChild(o);}select.value='room';
 function renderDetail(){const g=data.groups.find(g=>g.id===activeId);if(!g)return;const ids=g.photos.filter(n=>data.photos[String(n)]);const images=ids.length?ids.map(n=>data.photos[String(n)]):[selectedMaterial(activeId)];photoIndex=(photoIndex+images.length)%images.length;$('.photo-loading').hidden=false;gImage.onload=()=>{$('.photo-loading').hidden=true;};gImage.onerror=()=>{$('.photo-loading').hidden=false;$('.photo-loading').textContent='Фотография не загрузилась. Перейдите к следующей.';};gImage.src=images[photoIndex];gImage.alt=g.title+' — '+(ids.length?'фотография IMG_'+ids[photoIndex]:'изображение стенда');$('.museum-detail-title').textContent=g.title;$('.museum-detail-tag').textContent=g.tag;$('.museum-detail-text').textContent=g.text;$('.museum-count').textContent=`${photoIndex+1} / ${images.length}`;$('.museum-source').textContent=ids.length?(String(ids[photoIndex]).startsWith('helmet')?'Кадр из видео':`IMG_${ids[photoIndex]}.JPG`):'Обзор стенда';$$('[data-photo]').forEach(b=>b.disabled=images.length<2);}
 function showDetail(id){if(!data.groups.some(g=>g.id===id))return;activeId=id;photoIndex=0;stopInput();select.value=id;renderDetail();if(!gallery.open)gallery.showModal();}
 function closeDetail(){gallery.close();canvas.focus({preventScroll:true});invalidate();}
 $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 $('[data-action="go"]').onclick=()=>go(select.value);$('[data-action="photos"]').onclick=()=>showDetail(select.value);$('[data-action="close"]').onclick=closeDetail;
 gallery.addEventListener('close',()=>{stopInput();invalidate();});gallery.addEventListener('click',e=>{if(e.target===gallery){const r=gallery.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
 $$('[data-photo]').forEach(b=>b.onclick=()=>{photoIndex+=Number(b.dataset.photo);renderDetail();});
 const raycaster=new THREE.Raycaster();function pick(e){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hits=raycaster.intersectObjects(clickables,false);if(hits.length){let o=hits[0].object;while(o&&!o.userData.exhibit)o=o.parent;if(o)showDetail(o.userData.exhibit);}}
 canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};else{if(drag)drag.moved=true;const pts=[...pointers.values()];pinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){const p=[...pointers.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(mode==='overview'&&pinchDistance>0&&dist>0){orbitDistance=THREE.MathUtils.clamp(orbitDistance*pinchDistance/dist,5,20);updateOrbit();}pinchDistance=dist;return;}if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;if(mode==='walk'){yaw+=dx*.0035;pitch=THREE.MathUtils.clamp(pitch+dy*.003,-1.10,1.10);updateWalk();}else{orbitTheta-=dx*.005;orbitPhi=THREE.MathUtils.clamp(orbitPhi+dy*.004,.24,1.32);updateOrbit();shell();}drag.x=e.clientX;drag.y=e.clientY;invalidate();});
 function release(e,cancel=false){if(!cancel&&drag?.id===e.pointerId&&!drag.moved)pick(e);pointers.delete(e.pointerId);drag=null;pinchDistance=0;queueHD();}
 canvas.addEventListener('pointerup',e=>release(e));canvas.addEventListener('pointercancel',e=>release(e,true));canvas.addEventListener('lostpointercapture',e=>release(e,true));
 canvas.addEventListener('wheel',e=>{if(mode==='overview'){e.preventDefault();orbitDistance=THREE.MathUtils.clamp(orbitDistance*Math.exp(e.deltaY*.001),5,20);updateOrbit();}},{passive:false});
 for(const [action,factor] of [['zoom-in',.84],['zoom-out',1.19]])$(`[data-action="${action}"]`).onclick=()=>{orbitDistance=THREE.MathUtils.clamp(orbitDistance*factor,5,20);updateOrbit();};
 const joy=$('.museum-joystick');function moveJoystick(e){if(joystick.id!==e.pointerId)return;const r=joy.getBoundingClientRect(),radius=r.width*.32,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,n=Math.max(1,Math.hypot(dx,dy)/radius);joystick.x=dx/n/radius;joystick.y=-dy/n/radius;$('.joystick-knob').style.transform=`translate(${dx/n}px,${dy/n}px)`;invalidate();}
 joy.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();joy.setPointerCapture(e.pointerId);joystick.id=e.pointerId;moveJoystick(e);});joy.addEventListener('pointermove',moveJoystick);for(const type of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(type,e=>{if(joystick.id===e.pointerId){joystick.id=null;joystick.x=joystick.y=0;$('.joystick-knob').style.transform='';queueHD();}});
 const keys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
 window.addEventListener('keydown',e=>{if(gallery.open){if(e.code==='ArrowLeft'||e.code==='ArrowRight'){photoIndex+=e.code==='ArrowLeft'?-1:1;renderDetail();e.preventDefault();}return;}if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(keys.includes(e.code)){keyset.add(e.code);e.preventDefault();invalidate();}});window.addEventListener('keyup',e=>{keyset.delete(e.code);queueHD();});window.addEventListener('blur',stopInput);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopInput();cancelAnimationFrame(raf);raf=0;}else{last=performance.now();invalidate();}});
 $('[data-action="fullscreen"]').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch(e){status.textContent='Полноэкранный режим недоступен в этом браузере';}};
 // Keep a visitor's shoulder clearance from geometry, not stale hand-written rectangles.
 const visitorRadius=.18;
 function allowed(x,z){if(Math.abs(x)>ROOM.width/2-visitorRadius||Math.abs(z)>ROOM.depth/2-visitorRadius)return false;return !obstacles.some(o=>{const a=o.bounds;return x>a[0]-visitorRadius&&x<a[1]+visitorRadius&&z>a[2]-visitorRadius&&z<a[3]+visitorRadius;});}
 function safePosition(p){if(allowed(p[0],p[2]))return p;let best=null,score=Infinity;for(let x=-ROOM.width/2+.25;x<ROOM.width/2-.25;x+=.12)for(let z=-ROOM.depth/2+.25;z<ROOM.depth/2-.25;z+=.12){const d=Math.hypot(x-p[0],z-p[2]);if(d<score&&allowed(x,z)){best=[x,p[1],z];score=d;}}return best||[0,p[1],0];}
 for(const l of Object.values(locations))l.pos=safePosition(l.pos);
 function queueHD(){clearTimeout(hdTimer);hdTimer=setTimeout(upgradeNearby,450);}
 async function upgradeNearby(){if(document.hidden||mode!=='walk')return;const ids=['forest','afghan','division','honour','memory','history','embroidery','bird'];let count=0;for(const id of ids){if(count>=2)break;if(hdLoaded.has(id)||pendingHD.has(id))continue;const loc=locations[id];if(!loc)continue;const target=new THREE.Vector3(...loc.target);if(camera.position.distanceTo(target)>(compact?2.2:3.4))continue;const url=compact?data.textures[id]:data.texturesHD?.[id];if(!url||texM[id].map.image.src.endsWith(url))continue;pendingHD.add(id);count++;try{const t=await loadTexture(url);const old=texM[id].map;texM[id].map=t;texM[id].needsUpdate=true;old.dispose();hdLoaded.add(id);invalidate();}catch(e){console.warn('Higher-resolution display unavailable',id);}finally{pendingHD.delete(id);}}}
 function resize(){const r=viewport.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.fov=mode==='walk'?walkFov():42;camera.updateProjectionMatrix();invalidate();}new ResizeObserver(resize).observe(viewport);resize();setMode('walk');
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 function animate(t){raf=0;const dt=Math.min((t-last)/1000,.04);last=t;const moving=mode==='walk'&&!gallery.open&&(keyset.size>0||Math.hypot(joystick.x,joystick.y)>.03);if(moving){let f=(keyset.has('KeyW')||keyset.has('ArrowUp')?1:0)-(keyset.has('KeyS')||keyset.has('ArrowDown')?1:0)+joystick.y;let s=(keyset.has('KeyD')||keyset.has('ArrowRight')?1:0)-(keyset.has('KeyA')||keyset.has('ArrowLeft')?1:0)+joystick.x;const norm=Math.max(1,Math.hypot(f,s));f/=norm;s/=norm;const speed=1.32,dx=(Math.sin(yaw)*f+Math.cos(yaw)*s)*dt*speed,dz=(-Math.cos(yaw)*f+Math.sin(yaw)*s)*dt*speed;if(allowed(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(allowed(camera.position.x,camera.position.z+dz))camera.position.z+=dz;dirty=true;}if(dirty){renderer.render(scene,camera);frames++;dirty=false;}if(moving)raf=requestAnimationFrame(animate);}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopInput();$('.museum-loading').hidden=false;$('.museum-loading').innerHTML='<h1>Прогулка приостановлена</h1><p>Браузер освободил память. Обновите страницу, чтобы вернуться.</p><button onclick="location.reload()">Открыть музей</button>';});
 $('.museum-loading').hidden=true;root.dataset.ready='true';invalidate();
 async function exportGLB(){if(!window.GLTFExporter)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='exporter-global.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});const old=new Map();model.traverse(o=>{old.set(o,o.visible);o.visible=true;});ceiling.visible=false;const exporter=new GLTFExporter();try{return await exporter.parseAsync(model,{binary:true,onlyVisible:true,maxTextureSize:2048});}finally{for(const [o,v]of old)o.visible=v;shell();}}
 const exportButton=$('[data-action="export"]');exportButton.hidden=false;exportButton.onclick=async()=>{exportButton.disabled=true;exportButton.textContent='Сохраняем…';try{const bytes=await exportGLB();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));a.download='school-museum.glb';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}catch(e){status.textContent='Не удалось сохранить модель';console.error(e);}finally{exportButton.disabled=false;exportButton.textContent='Скачать модель';}};
 return {scene,model,camera,renderer,solids,setMode,go,showDetail,exportGLB,setLook,invalidate,allowed,getInfo:()=>({mode,frames,meshes:clickables.length,position:camera.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,touch,compact,hd:[...hdLoaded],room:ROOM,obstacles:obstacles.map(o=>({...o})),locations})};

}
