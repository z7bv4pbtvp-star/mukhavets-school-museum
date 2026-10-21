import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {plantingBeds, tileTouchesBed, addMemorialPlanting} from './memorial-planting.js?v=1';

// Scene metres are estimated from the paving, benches and reference views.
// The wall and the date return retain their photographed relationship to the plaza.
export function createMemorialEnvironment(scene,{compact=false,invalidate=()=>{}}={}){
 const root=new THREE.Group();root.name='Площадь памятника землякам';scene.add(root);
 const colliders=[],clickables=[],loader=new THREE.TextureLoader(),pending=[];
 let seed=1945;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const cube=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1);
 const material=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
 function grain(color){const m=material(color);const c=document.createElement('canvas');c.width=c.height=256;const cx=c.getContext('2d'),pixels=cx.createImageData(256,256);for(let i=0;i<pixels.data.length;i+=4){const v=190+rand()*55;pixels.data.set([v,v,v,255],i);}cx.putImageData(pixels,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;m.map=t;m.bumpMap=t;m.bumpScale=.012;return m;}
 const white=material('#deded6'),gray=grain('#676c65'),cap=material('#5b6262',.63),dark=material('#333d36'),wood=grain('#54463b'),lawn=grain('#69715c'),gravel=grain('#a39e8c'),red=grain('#8e5551'),joint=material('#575e56');
 function box(name,x,y,z,w,h,d,mat=white,parent=root){const o=new THREE.Mesh(cube,mat);o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function floor(name,x,z,w,d,mat,y=0){const o=new THREE.Mesh(plane,mat);o.name=name;o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.scale.set(w,d,1);o.receiveShadow=true;root.add(o);return o;}
 function obstacle(x,z,w,d){colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});}
 floor('Газон',0,0,220,220,lawn,-.085);
 box('Основание приподнятой площади',0,.105,-.1,13.8,.21,17.2,joint);
 floor('Швы подходной дорожки',0,12.4,23,8.6,joint,-.026);
 floor('Швы правой дорожки',8.65,1.7,3.5,25.8,joint,-.026);
 floor('Швы левой дорожки',-10,1.7,3,25.8,joint,-.026);
 // Interlocking pairs with real joints, individual colour variation and depth.
 const tileGeo=new THREE.BoxGeometry(.294,.038,.144),dummy=new THREE.Object3D();
 // Multi-scale variation keeps nearby grass detailed and avoids a flat horizon.
 const grassCanvas=document.createElement('canvas');grassCanvas.width=grassCanvas.height=512;
 const grassPixels=new ImageData(512,512),hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const patch=noise(x/73,y/73)*.5+noise(x/19,y/19)*.3+noise(x/4,y/4)*.2,fibre=hash(x,y)*14,i=(y*512+x)*4;grassPixels.data.set([68+patch*41+fibre,77+patch*42+fibre,47+patch*32+fibre,255],i);}
 grassCanvas.getContext('2d').putImageData(grassPixels,0,0);
 const grassTexture=new THREE.CanvasTexture(grassCanvas);grassTexture.colorSpace=THREE.SRGBColorSpace;grassTexture.wrapS=grassTexture.wrapT=THREE.RepeatWrapping;grassTexture.repeat.set(24,24);grassTexture.anisotropy=compact?4:8;
 lawn.map.dispose();lawn.color.set('#ffffff');lawn.map=grassTexture;lawn.bumpMap=grassTexture;lawn.bumpScale=.025;
 const placements={red:[],gray:[]};
 function fill(x0,x1,z0,z1,y,kind){let col=0;for(let x=x0;x<x1-.29;x+=.3,col++){let row=0;for(let z=z0;z<z1-.29;z+=.3,row++){
  // Reserve the entire paving cell: roots and gravel never share a tile surface.
  if(tileTouchesBed(x,x+.3,z,z+.3))continue;
  if((col+row)%2===0){placements[kind].push([x+.15,y,z+.075,0],[x+.15,y,z+.225,0]);}else{placements[kind].push([x+.075,y,z+.15,Math.PI/2],[x+.225,y,z+.15,Math.PI/2]);}
 }}}
 fill(-4.8,4.8,-4.8,8.4,.235,'red');
 fill(-6.9,-4.8,-8.7,8.4,.235,'gray');fill(4.8,6.9,-8.7,8.4,.235,'gray');fill(-4.8,4.8,-8.7,-4.8,.235,'gray');
 fill(-11.5,11.5,9,16.7,-.005,'gray');fill(7,10.8,-11.2,9,-.005,'gray');fill(-11.5,-8.5,-11.2,9,-.005,'gray');
 for(const [kind,points]of Object.entries(placements)){const mesh=new THREE.InstancedMesh(tileGeo,kind==='red'?red:gray,points.length);mesh.name=kind==='red'?'Красная брусчатка центральной площади':'Серая брусчатка подходов';points.forEach(([x,y,z,r],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,r,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);const c=.82+rand()*.25;mesh.setColorAt(i,new THREE.Color().setRGB(c,c,c));});mesh.receiveShadow=true;root.add(mesh);}
 // Two low red risers at the front, with individual curb blocks.
 for(let x=-7.15;x<7.15;x+=.3){box('Нижняя красная ступень',x+.147,.045,8.83,.292,.09,.45,red);box('Верхняя красная ступень',x+.147,.145,8.46,.292,.11,.34,red);}
 for(let z=-8.7;z<8.4;z+=.3){box('Боковой бордюр',6.99,.145,z+.147,.16,.22,.293,gray);}
 // Long wall on the left. Inside face points +X; lettering reads from the entry.
 box('Белая стена памяти',-7.65,1.16,-.6,.35,2.14,17.6,white);
 box('Нижний кирпичный цоколь стены',-7.42,.27,-.6,.2,.5,17.6,material('#704a39'));
 const bricks=new THREE.InstancedMesh(new THREE.BoxGeometry(.022,.112,.242),material('#835740'),280);bricks.name='Ряды кирпича под плитами стены';
 for(let row=0,i=0;row<4;row++)for(let col=0;col<70;col++,i++){
  dummy.position.set(-7.316,.083+row*.124,-9.31+col*.249+(row%2)*.06);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();bricks.setMatrixAt(i,dummy.matrix);const shade=.88+rand()*.16;bricks.setColorAt(i,new THREE.Color().setRGB(shade,shade,shade));
 }
 bricks.receiveShadow=true;root.add(bricks);
 box('Углублённый фон объёмных букв',-7.463,1.765,-.6,.018,.93,17.0,material('#62665e'));
 box('Металлический верх стены',-7.65,2.29,-.6,.55,.115,17.78,cap);
 obstacle(-7.65,-.6,.5,17.9);
 // Each documented name slab is one complete photograph quad, in physical order.
 // A projective mapping straightens camera perspective without changing any letters.
 const photoTextures=new Map();
 function photo(file,corners,iw,ih,w,h){
  const [p0,p1,p2,p3]=corners,dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],sx=p0[0]-p1[0]+p2[0]-p3[0],sy=p0[1]-p1[1]+p2[1]-p3[1],den=dx1*dy2-dx2*dy1;
  const G=Math.abs(den)>1e-9?(sx*dy2-dx2*sy)/den:0,H=Math.abs(den)>1e-9?(dx1*sy-sx*dy1)/den:0;
  const A=p1[0]-p0[0]+G*p1[0],B=p3[0]-p0[0]+H*p3[0],D=p1[1]-p0[1]+G*p1[1],E=p3[1]-p0[1]+H*p3[1];
  const g=new THREE.PlaneGeometry(w,h,32,16),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=1-uv.getY(i),q=G*u+H*v+1;uv.setXY(i,(A*u+B*v+p0[0])/q/iw,1-(D*u+E*v+p0[1])/q/ih);}
  let t=photoTextures.get(file);if(!t){t=loader.load('assets/memorial/'+file,invalidate);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=compact?4:8;photoTextures.set(file,t);}
  const m=new THREE.MeshStandardMaterial({map:t,roughness:.92,color:'#ffffff'}),mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;return mesh;
 }
 pending.push(fetch('assets/memorial/wall-panels.json?v=3').then(r=>{if(!r.ok)throw new Error('Wall source unavailable');return r.json();}).then(data=>{
  const panels=Array.isArray(data)?data:data.panels,w=16.5/panels.length;let along=7.65;
  for(const panel of panels){const p=photo(panel.file,panel.corners,panel.imageWidth,panel.imageHeight,w-.008,.79);p.name='Подлинная плита стены памяти '+(panel.index??panels.indexOf(panel)+1);p.position.set(-7.409,.90,along-w/2);p.rotation.y=Math.PI/2;root.add(p);clickables.push({mesh:p,kind:'wall'});along-=w;}
  invalidate();
 }));
 pending.push(new GLTFLoader().loadAsync('assets/memorial/wall-lettering.glb?v=5').then(g=>{g.scene.position.set(-7.438,1.30,7.65);g.scene.scale.y=.92/.72;g.scene.rotation.y=Math.PI/2;g.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});root.add(g.scene);invalidate();}));
 // Return at the near end: freestanding architectural date numerals.
 box('Серая нижняя часть торца с датами',-9.65,.31,7.98,4.35,.55,1.15,gray);
 box('Задняя плоскость торца',-9.65,1.41,7.49,4.35,1.64,.13,material('#62675f'));
 box('Левый торец дат',-11.78,1.41,7.96,.13,1.64,1.05,white);
 box('Правый торец дат — примыкание к стене',-7.51,1.41,8.115,.17,1.64,.59,white);
 box('Крышка торца с датами',-9.65,2.29,7.96,4.53,.115,1.3,cap);
 // Square architectural numerals, with deep rectangular apertures.
 // Unlike electronic seven-segment figures, these share continuous concrete faces.
 const digitPaths={
  '1':[[[.10,0],[.36,0],[.36,1],[.10,1]]],
  '9':[[[0,.38],[.27,.38],[.27,0],[.48,0],[.48,1],[0,1]],[[.17,.57],[.31,.57],[.31,.85],[.17,.85]]],
  '4':[[[0,.36],[.27,.36],[.27,0],[.48,0],[.48,1],[.29,1],[.29,.54],[.18,.54],[.18,1],[0,1]]],
  '5':[[[0,0],[.48,0],[.48,.59],[.18,.59],[.18,.82],[.48,.82],[.48,1],[0,1],[0,.4],[.29,.4],[.29,.18],[0,.18]]]
 };
 const dateSides=material('#92978d');
 let dx=-11.70;
 for(const ch of '1941 1945'){
  if(ch===' '){dx+=.40;continue;}
  const [outer,hole]=digitPaths[ch],shape=new THREE.Shape();outer.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  if(hole){const cut=new THREE.Path();hole.forEach(([x,y],i)=>i?cut.lineTo(x,y):cut.moveTo(x,y));cut.closePath();shape.holes.push(cut);}
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.54,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,curveSegments:1});
  const glyph=new THREE.Mesh(geometry,[white,dateSides]);glyph.name='Архитектурная дата '+ch;glyph.scale.set(.88,1.61,1);glyph.position.set(dx,.61,7.77);glyph.castShadow=glyph.receiveShadow=true;root.add(glyph);dx+=.47;
 }
 obstacle(-9.65,7.98,4.55,1.3);
 // Ground beds are cut out of the paving and finished with gravel and stone edging.
 for(const bed of plantingBeds){
  box('Грунт клумбы '+bed.id,(bed.minX+bed.maxX)/2,.218,(bed.minZ+bed.maxZ)/2,bed.maxX-bed.minX,.065,bed.maxZ-bed.minZ,material('#696355'));
  obstacle((bed.minX+bed.maxX)/2,(bed.minZ+bed.maxZ)/2,bed.maxX-bed.minX,bed.maxZ-bed.minZ);
 }
 addMemorialPlanting(root,{compact});
 // Stone-ended benches on the right of the approach; no scenery trees are invented.
 function bench(x,z){const b=new THREE.Group();b.position.set(x,0,z);b.rotation.y=-Math.PI/2;root.add(b);for(const sx of[-.86,.86]){box('Бетонная ножка скамьи',sx,.29,0,.15,.58,.62,white,b);box('Бетонная спинка скамьи',sx,.64,-.25,.15,.75,.15,white,b);box('Подлокотник',sx,.63,0,.15,.12,.62,white,b);}for(let i=0;i<4;i++){box('Деревянная рейка сиденья',0,.48,-.2+i*.135,1.8,.055,.112,wood,b);const slat=box('Деревянная рейка спинки',0,.64+i*.105,-.29-i*.012,1.8,.082,.045,wood,b);slat.rotation.x=-.12;}for(const sx of[-.65,.65])for(const y of[.68,.89]){const bolt=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),dark);bolt.position.set(sx,y,-.26);b.add(bolt);}obstacle(x,z,.8,2.0);}
 bench(10.35,7.1);bench(10.35,11.25);
 // Open slatted bin between the two benches.
 const bin=new THREE.Group();bin.position.set(10.33,0,9.13);root.add(bin);box('Урна, внутренний контейнер',0,.3,0,.28,.6,.28,dark,bin);for(let side=0;side<4;side++)for(let i=0;i<4;i++){const a=side*Math.PI/2,x=(i-1.5)*.095,z=.2;box('Деревянные рейки урны',x*Math.cos(a)+z*Math.sin(a),.33,-x*Math.sin(a)+z*Math.cos(a),side%2?.035:.075,.64,side%2?.075:.035,wood,bin);}obstacle(10.33,9.13,.55,.55);
 // Documentary information sign beside the right-hand corner.
 box('Стойка информационной таблички',7.9,.63,5.6,.045,1.26,.045,dark);const signBacking=box('Информационная табличка',7.9,1.27,5.6,.69,.43,.022,white);signBacking.rotation.x=-.16;
 const sign=photo('sign-full.jpg',[[58,307],[683,289],[719,816],[38,827]],720,1280,.67,.41);sign.position.set(7.9,1.273,5.62);sign.rotation.x=-.16;root.add(sign);clickables.push({mesh:sign,kind:'sign'});obstacle(7.9,5.6,.15,.15);
 // Sparse fallen leaves are small objects on the paths, in subdued autumn colours.
 const leafGeo=new THREE.PlaneGeometry(.07,.11),fallen=new THREE.InstancedMesh(leafGeo,new THREE.MeshStandardMaterial({color:'#a38a4d',side:THREE.DoubleSide,roughness:1}),compact?140:280);for(let i=0;i<fallen.count;i++){const x=-11.2+rand()*22.3,z=-8+rand()*24;const y=heightAt(x,z)+.028;dummy.position.set(x,y,z);dummy.rotation.set(-Math.PI/2+(rand()-.5)*.35,0,rand()*Math.PI*2);dummy.scale.setScalar(.6+rand()*.7);dummy.updateMatrix();fallen.setMatrixAt(i,dummy.matrix);fallen.setColorAt(i,new THREE.Color().setHSL(.08+rand()*.07,.24+rand()*.18,.28+rand()*.15));}root.add(fallen);
 function heightAt(x,z){if(x>=-6.9&&x<=6.9&&z>=-8.7&&z<8.5)return .254;if(x>=-7.3&&x<=7.3&&z>=8.5&&z<9.08)return .09;return .014;}
 return {root,colliders,clickables,heightAt,photo,ready:Promise.all(pending)};
}
