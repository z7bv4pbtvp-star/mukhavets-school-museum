import * as THREE from 'three';

// Decorative planting requested for the digital garden; not a documentary item.
export function addMemorialGarden(parent, {compact=false}={}) {
  const root=new THREE.Group();root.name='Цветы, низкие кусты и памятный венок';parent.add(root);
  let seed=731;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const dummy=new THREE.Object3D();
  const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.4,.25,-.3,.7,0,1);leafShape.bezierCurveTo(.3,.7,.4,.25,0,0);
  const leafGeo=new THREE.ShapeGeometry(leafShape,5);leafGeo.rotateX(-Math.PI/2);
  const foliage=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,side:THREE.DoubleSide});
  function instances(name,geo,mat,list,group=root){const m=new THREE.InstancedMesh(geo,mat,list.length);m.name=name;list.forEach((p,i)=>{dummy.position.fromArray(p.position);dummy.rotation.set(...p.rotation);dummy.scale.fromArray(p.scale);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);if(p.color)m.setColorAt(i,new THREE.Color(p.color));});m.castShadow=m.receiveShadow=true;group.add(m);return m;}
  const shrubs=[[-2.63,-.40,.29],[-3.37,-1.12,.28],[-1.55,-1.15,.26],[-3.44,.88,.25]],foliageItems=[];
  for(const[x,z,r] of shrubs)for(let j=0;j<(compact?180:290);j++){
    const a=rand()*Math.PI*2,h=rand(),radius=r*Math.sqrt(1-h*h),angle=a+rand()*.8;
    foliageItems.push({position:[x+Math.cos(a)*radius,.03+h*r*1.7,z+Math.sin(a)*radius],rotation:[rand()*.9-.45,angle,rand()*.8-.4],scale:[.045+rand()*.025,1,.075+rand()*.045],color:['#405237','#4b5b39','#56643e','#354b34'][j%4]});
  }
  instances('Листва низких кустов в клумбе',leafGeo,foliage,foliageItems);
  const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.012,0,0,.012,0,0,-.009,.26,.028,.009,.26,.028,0,.43,.095],3));bladeGeo.setIndex([0,1,2,1,3,2,2,3,4]);bladeGeo.computeVertexNormals();
  const grasses=[];for(const[x,z]of[[-3.58,-.55],[-3.56,.25],[-2.8,1.36],[-2.23,1.35],[-1.48,.42],[-2.6,-1.4],[-1.95,-1.4]])for(let j=0;j<(compact?22:34);j++){grasses.push({position:[x+(rand()-.5)*.13,.015,z+(rand()-.5)*.13],rotation:[rand()*.3,rand()*Math.PI*2,(rand()-.5)*.5],scale:[.7+rand()*.5,.45+rand()*.45,.7+rand()*.5],color:['#77866b','#89917a','#546b4c'][j%3]});}
  instances('Узкие листья многолетников',bladeGeo,foliage,grasses);
  // Oval evergreen wreath rests on the front step and leans against the plinth.
  const wreath=new THREE.Group();wreath.name='Памятный венок';wreath.position.set(-.72,.77,1.09);wreath.rotation.set(-.27,0,-.06);root.add(wreath);
  const supportMat=new THREE.MeshStandardMaterial({color:'#253d2a',roughness:.95});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.038,7,48),supportMat);ring.scale.set(.85,1.37,1);wreath.add(ring);
  const sprigs=[];
  for(let i=0;i<(compact?390:650);i++){
    const a=rand()*Math.PI*2,r=rand(),x=Math.sin(a)*(.25+r*.12),y=Math.cos(a)*(.39+r*.13);
    sprigs.push({position:[x,y,(rand()-.5)*.105],rotation:[Math.PI/2+(rand()-.5)*.8,-a+(rand()-.5)*.7,(rand()-.5)*.5],scale:[.035+rand()*.03,1,.105+rand()*.08],color:['#29472f','#3d5b37','#4c653c','#254432'][i%4]});
  }
  instances('Ветви памятного венка',leafGeo,foliage,sprigs,wreath);
  // Modelled carnation petals follow the oval, leaving its centre open.
  const petals=[],centers=[[-.22,.3],[.23,.3],[-.30,.03],[.29,.03],[-.20,-.29],[.20,-.29],[0,.47],[0,-.45]];
  for(let j=0;j<centers.length;j++){const[x,y]=centers[j];for(let layer=0;layer<4;layer++)for(let k=0;k<9;k++){const a=k/9*Math.PI*2+layer*.43;petals.push({position:[x+Math.sin(a)*.012,y+Math.cos(a)*.012,.09+layer*.009],rotation:[Math.PI/2+.35+layer*.2,-a,0],scale:[.046-layer*.007,1,.069-layer*.01],color:j===6||j===7?'#eee3c8':['#9b2934','#ad3540','#bd3c44'][layer%3]});}}
  instances('Красные и светлые гвоздики венка',leafGeo,new THREE.MeshStandardMaterial({color:'white',roughness:.85,side:THREE.DoubleSide}),petals,wreath);
  const ribbonMat=new THREE.MeshStandardMaterial({color:'#272b29',roughness:.65,side:THREE.DoubleSide});
  for(const side of[-1,1]){const shape=new THREE.Shape();shape.moveTo(-.055,0);shape.lineTo(.055,0);shape.lineTo(.07,-.38);shape.lineTo(0,-.33);shape.lineTo(-.07,-.4);shape.closePath();const ribbon=new THREE.Mesh(new THREE.ShapeGeometry(shape),ribbonMat);ribbon.position.set(side*.07,-.22,.16);ribbon.rotation.z=side*.25;wreath.add(ribbon);}
  return root;
}
