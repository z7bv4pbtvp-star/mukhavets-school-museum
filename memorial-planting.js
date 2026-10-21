import * as THREE from 'three';

// Bed limits align with the 30 cm paving module. These same rectangles exclude
// paving, support the gravel and constrain planting and pedestrian movement.
export const plantingBeds = [
  {id:'wall',minX:-7.47,maxX:-6.30,minZ:-8.70,maxZ:7.20},
  {id:'rear',minX:2.10,maxX:6.90,minZ:-8.70,maxZ:-7.50},
  {id:'right',minX:5.70,maxX:6.90,minZ:-7.50,maxZ:-2.10},
];
export function tileTouchesBed(x0,x1,z0,z1){
  const e=.0001;
  return plantingBeds.some(b=>x1>b.minX+e&&x0<b.maxX-e&&z1>b.minZ+e&&z0<b.maxZ-e);
}
export const shrubPositions = [
  ...Array.from({length:18},(_,i)=>[-6.88,-8.10+i*.85,.255]),
  ...Array.from({length:5},(_,i)=>[2.70+i*.77,-8.10,.25]),
  ...Array.from({length:6},(_,i)=>[6.30,-6.90+i*.80,.24]),
];

export function addMemorialPlanting(root,{compact=false}={}){
  let seed=447;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const groundY=.252, matrix=new THREE.Object3D();
  const stone=new THREE.MeshStandardMaterial({color:'#8e9285',roughness:.92});
  const curbGeo=new THREE.BoxGeometry(1,1,1);
  function curb(x,z,w,d){const mesh=new THREE.Mesh(curbGeo,stone);mesh.name='Каменный край клумбы';mesh.position.set(x,.247,z);mesh.scale.set(w,.12,d);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  curb(-6.30,-.75,.085,15.9);curb(-6.88,7.2,1.17,.085);
  curb(4.50,-7.50,4.8,.085);curb(2.10,-8.10,.085,1.2);
  curb(5.70,-4.80,.085,5.4);curb(6.30,-2.10,1.2,.085);

  // Small actual stones give the bed depth in close and oblique views.
  const pebbles=[], pebbleGeo=new THREE.IcosahedronGeometry(1,0);
  for(const b of plantingBeds){
    const count=Math.round((b.maxX-b.minX)*(b.maxZ-b.minZ)*(compact?115:190));
    for(let i=0;i<count;i++)pebbles.push([b.minX+.04+random()*(b.maxX-b.minX-.08),b.minZ+.04+random()*(b.maxZ-b.minZ-.08)]);
  }
  const gravel=new THREE.InstancedMesh(pebbleGeo,new THREE.MeshStandardMaterial({color:'white',roughness:1}),pebbles.length);gravel.name='Светлый гравий в выделенных клумбах';
  pebbles.forEach(([x,z],i)=>{matrix.position.set(x,groundY,z);matrix.rotation.set(random()*3,random()*3,random()*3);matrix.scale.set(.018+random()*.025,.011+random()*.012,.019+random()*.021);matrix.updateMatrix();gravel.setMatrixAt(i,matrix.matrix);gravel.setColorAt(i,new THREE.Color(['#b1ac99','#95937e','#c6bfaa','#828578'][i%4]));});gravel.receiveShadow=true;root.add(gravel);

  // Every sprig has closed, folded leaf geometry; no upright billboard cutouts.
  const positions=[],indices=[];
  function leaf(x0,y0,x1,y1,width,z){const k=positions.length/3;positions.push(x0,y0,z,x1-width,y1,z,x1,y1+.014,z+.012,x1+width,y1,z);indices.push(k,k+1,k+2,k,k+2,k+3);}
  for(let i=0;i<6;i++){const y=i*.023,len=.047*(1-i*.115);leaf(0,y,-len,y+.025,.012,0);leaf(0,y,len,y+.025,.012,0);}
  leaf(0,.12,0,.17,.012,0);
  const spray=new THREE.BufferGeometry();spray.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));spray.setIndex(indices);spray.computeVertexNormals();
  const leafMaterial=new THREE.MeshStandardMaterial({color:'white',roughness:.96,side:THREE.DoubleSide});
  const coreGeometry=new THREE.IcosahedronGeometry(1,2),corePositions=coreGeometry.attributes.position;
  for(let i=0;i<corePositions.count;i++){const x=corePositions.getX(i),y=corePositions.getY(i),z=corePositions.getZ(i),r=1+.055*Math.sin(x*19+y*7)*Math.cos(z*17);corePositions.setXYZ(i,x*r,y*r,z*r);}
  coreGeometry.computeVertexNormals();
  const cores=new THREE.InstancedMesh(coreGeometry,new THREE.MeshStandardMaterial({color:'#50623b',roughness:1}),shrubPositions.length*3);cores.name='Плотная внутренняя крона кустов';let coreIndex=0;
  const count=compact?145:230, shrubs=new THREE.InstancedMesh(spray,leafMaterial,shrubPositions.length*count);
  shrubs.name='Объёмные ветви кустов — корни в гравии';let index=0;
  for(const[x,z,r]of shrubPositions){
    for(let k=0;k<3;k++){const angle=k/3*Math.PI*2;matrix.position.set(x+Math.cos(angle)*r*.25,groundY+.22,z+Math.sin(angle)*r*.25);matrix.rotation.set(0,angle,0);matrix.scale.set(r*.71,.23+(k===0?.035:0),r*.71);matrix.updateMatrix();cores.setMatrixAt(coreIndex++,matrix.matrix);}
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.014,.025,.26,6),new THREE.MeshStandardMaterial({color:'#675d45',roughness:1}));trunk.name='Ствол куста внутри клумбы';trunk.position.set(x,groundY+.11,z);root.add(trunk);
    for(let i=0;i<count;i++){
      const theta=random()*Math.PI*2,h=random(),radius=r*Math.sqrt(1-h*h)*(.65+random()*.35);
      matrix.position.set(x+Math.cos(theta)*radius,groundY+.055+h*.39,z+Math.sin(theta)*radius);
      matrix.rotation.set((random()-.5)*1.5,theta,(random()-.5)*1.9);matrix.scale.setScalar(.65+random()*.42);matrix.updateMatrix();shrubs.setMatrixAt(index,matrix.matrix);
      shrubs.setColorAt(index++,new THREE.Color(['#4f6440','#687a48','#788650','#3e5737'][i%4]));
    }
  }
  shrubs.castShadow=shrubs.receiveShadow=true;root.add(shrubs);
  cores.castShadow=cores.receiveShadow=true;root.add(cores);
  return {gravel,shrubs};
}
