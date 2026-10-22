import * as THREE from 'three';

// Commemorative decoration requested for the virtual scene, not a source exhibit.
export function addMemorialWreath(parent,{compact=false}={}){
 const wreath=new THREE.Group();wreath.name='Памятный хвойный венок с красными гвоздиками';
 // The lower branches rest on the plaza; the upper reverse touches the plinth.
 // The dedication remains visible to the right of the wreath.
 wreath.position.set(-.99,.867,-4.46);wreath.rotation.set(-.26,0,-.025);parent.add(wreath);
 let seed=812;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const dummy=new THREE.Object3D();
 function instances(name,geometry,material,items){
  const mesh=new THREE.InstancedMesh(geometry,material,items.length);mesh.name=name;
  items.forEach((item,i)=>{dummy.position.fromArray(item.position);dummy.rotation.set(...item.rotation);dummy.scale.fromArray(item.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(item.color)mesh.setColorAt(i,new THREE.Color(item.color));});
  mesh.castShadow=mesh.receiveShadow=true;wreath.add(mesh);return mesh;
 }
 const foliage=new THREE.MeshStandardMaterial({color:'white',roughness:.96,side:THREE.DoubleSide});
 const backing=new THREE.Mesh(new THREE.TorusGeometry(1,.105,8,64),new THREE.MeshStandardMaterial({color:'#20392b',roughness:1}));
 backing.name='Объёмная хвойная основа венка';backing.scale.set(.30,.49,.48);backing.castShadow=backing.receiveShadow=true;wreath.add(backing);
 // Each branch has a central stem and paired narrow needles with folded faces.
 const vertices=[],indices=[];
 function needle(a,b,width){
  const start=vertices.length/3,side=new THREE.Vector3(b[1]-a[1],a[0]-b[0],0).normalize().multiplyScalar(width);
  const mid=new THREE.Vector3().fromArray(a).lerp(new THREE.Vector3().fromArray(b),.4);
  vertices.push(...a,mid.x+side.x,mid.y+side.y,mid.z-.001,...b,mid.x-side.x,mid.y-side.y,mid.z-.001,mid.x,mid.y,mid.z+.0018);
  indices.push(start,start+1,start+4,start+1,start+2,start+4,start+2,start+3,start+4,start+3,start,start+4);
 }
 needle([0,0,0],[0,.185,.013],.0022);
 for(let j=0;j<9;j++)for(const sign of[-1,1]){
  const y=.014+j*.018,length=.043*(1-j*.062);
  needle([0,y,j*.0012],[sign*length,y+.035,.011+Math.sin(j*.7)*.006],.0015);
 }
 const branch=new THREE.BufferGeometry();branch.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));branch.setIndex(indices);branch.computeVertexNormals();
 const sprigs=[],count=compact?170:240;
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2+(random()-.5)*.13,r=(random()-.5)*.10;
  const tx=.30*Math.cos(a),ty=-.49*Math.sin(a);
  sprigs.push({position:[Math.sin(a)*(.30+r),Math.cos(a)*(.49+r),.015+(random()-.5)*.095],rotation:[(random()-.5)*.7,(random()-.5)*.8,Math.atan2(-tx,ty)+(random()-.5)*.7],scale:[.8+random()*.5,.78+random()*.45,1],color:['#264631','#35543a','#4b6241','#2d4c35'][i%4]});
 }
 instances('Объёмные еловые ветви и иголки',branch,foliage,sprigs);
 // Cupped, scalloped petal geometry gives the carnations depth from the side.
 const pv=[],pi=[],steps=10,rows=4;
 for(let j=0;j<=rows;j++)for(let i=0;i<=steps;i++){
  const t=j/rows,u=i/steps*2-1,angle=u*.71,r=.018+t*.050;
  pv.push(Math.sin(angle)*r,(.5-Math.cos(angle))*r+.015,.008+Math.pow(t,1.7)*.022+(j===rows?Math.sin(i*2.4)*.004:0));
 }
 for(let j=0;j<rows;j++)for(let i=0;i<steps;i++){const a=j*(steps+1)+i;pi.push(a,a+1,a+steps+2,a,a+steps+2,a+steps+1);}
 const petal=new THREE.BufferGeometry();petal.setAttribute('position',new THREE.Float32BufferAttribute(pv,3));petal.setIndex(pi);petal.computeVertexNormals();
 const petals=[],calyces=[],flowerCount=11,layers=compact?3:4;
 for(let f=0;f<flowerCount;f++){
  const a=f/flowerCount*Math.PI*2+.05,x=Math.sin(a)*.295,y=Math.cos(a)*.49,z=.10+random()*.015;
  calyces.push({position:[x,y,z-.01],rotation:[Math.PI/2,0,0],scale:[.025,.025,.025]});
  for(let layer=0;layer<layers;layer++)for(let k=0;k<8;k++){
   const rotation=k/8*Math.PI*2+layer*.43,scale=1-layer*.16;
   petals.push({position:[x,y,z+layer*.010],rotation:[.10*Math.sin(a),.10*Math.cos(a),rotation],scale:[scale,scale,scale],color:['#8e1e2c','#b52d3b','#c53b46','#a42535'][(layer+f)%4]});
  }
 }
 instances('Чашелистики гвоздик',new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#354d32',roughness:1}),calyces);
 instances('Рельефные лепестки красных гвоздик',petal,new THREE.MeshStandardMaterial({color:'white',roughness:.83,side:THREE.DoubleSide}),petals);
 // Satin ribbons are curved surfaces, including their reverse and forked ends.
 const ribbonCanvas=document.createElement('canvas');ribbonCanvas.width=256;ribbonCanvas.height=1024;
 const ctx=ribbonCanvas.getContext('2d');ctx.fillStyle='#252422';ctx.fillRect(0,0,256,1024);
 ctx.strokeStyle='#aa9562';ctx.lineWidth=3;ctx.strokeRect(10,0,236,1024);
 ctx.fillStyle='#d3bf86';ctx.font='500 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const [i,letter]of Array.from('ПОМНИМ').entries())ctx.fillText(letter,128,160+i*120);
 const ribbonTexture=new THREE.CanvasTexture(ribbonCanvas);ribbonTexture.colorSpace=THREE.SRGBColorSpace;
 const ribbonMaterial=new THREE.MeshStandardMaterial({map:ribbonTexture,roughness:.57,side:THREE.DoubleSide});
 for(const side of[-1,1]){
  const positions=[],uv=[],index=[],sections=16;
  for(let j=0;j<=sections;j++)for(let edge=0;edge<2;edge++){
   const t=j/sections,x=(edge-.5)*.093+side*(.045+t*.075),tip=j===sections?(edge===0?.018:0):0;
   positions.push(x,-.20-t*.38+tip,.16+Math.sin(t*Math.PI*1.7)*.024);uv.push(edge,1-t);
  }
  for(let j=0;j<sections;j++){const a=j*2;index.push(a,a+2,a+3,a,a+3,a+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(index);geometry.computeVertexNormals();
  const ribbon=new THREE.Mesh(geometry,ribbonMaterial);ribbon.name='Траурная лента «Помним»';ribbon.castShadow=ribbon.receiveShadow=true;wreath.add(ribbon);
 }
 const bowMaterial=new THREE.MeshStandardMaterial({color:'#292724',roughness:.6,side:THREE.DoubleSide});
 for(const side of[-1,1]){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.20,.17),new THREE.Vector3(side*.16,-.12,.19),new THREE.Vector3(side*.18,-.22,.14),new THREE.Vector3(0,-.20,.17)]);
  const bow=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.022,5,false),bowMaterial);bow.name='Узел памятной ленты';bow.castShadow=true;wreath.add(bow);
 }
 return wreath;
}
