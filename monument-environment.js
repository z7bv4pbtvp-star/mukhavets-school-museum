import * as THREE from 'three';

// Ground plan follows the supplied walk-around: flower bed against the left
// edge of the base, paved approach in front, and a narrow route behind it.
export function createMonumentEnvironment(scene, { compact = false } = {}) {
  const root = new THREE.Group(); root.name = 'Memorial paved garden'; scene.add(root);
  const geometries = [], materials = [], textures = [], colliders = [], clickables = [];
  const loader = new THREE.TextureLoader();
  let seed = 5241;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const geometry = g => (geometries.push(g), g);
  const material = p => { const m = new THREE.MeshStandardMaterial(p); materials.push(m); return m; };
  const plane = geometry(new THREE.PlaneGeometry(1, 1));
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  function load(file, repeat = 1) {
    const t = loader.load('assets/monument/' + file, () => window.dispatchEvent(new Event('resize')));
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat); t.anisotropy = compact ? 4 : 8; textures.push(t); return t;
  }
  function ground(name, x, z, w, d, mat, y = 0) {
    const g = geometry(new THREE.PlaneGeometry(w, d));
    const uv = g.attributes.uv;
    for (let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*w+x-w/2, uv.getY(i)*d+z-d/2);
    const mesh = new THREE.Mesh(g, mat); mesh.name=name; mesh.rotation.x=-Math.PI/2;
    mesh.position.set(x,y,z); mesh.receiveShadow=true; root.add(mesh); return mesh;
  }
  // Continuous procedural material detail, without baking perspective into surfaces.
  function grain(mat, scale, strength, key) {
    mat.onBeforeCompile = s => {
      s.vertexShader = 'varying vec3 vSurfacePosition;\n' + s.vertexShader;
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePosition=position;');
      s.fragmentShader = 'varying vec3 vSurfacePosition;\nfloat surfaceHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}\n' + s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\nfloat grain=surfaceHash(floor(vSurfacePosition*${scale.toFixed(1)})); diffuseColor.rgb*=1.0+(grain-.5)*${strength.toFixed(2)};`);
    };
    mat.customProgramCacheKey=()=>key; return mat;
  }
  const lawn=grain(material({color:0x68715a,roughness:1}),18,.08,'ground-grain');
  ground('Quiet grass surround',0,0,160,160,lawn,-.08);
  const bed={minX:-3.82,maxX:-1.185,minZ:-1.62,maxZ:1.55};
  colliders.push({...bed});
  const pavingBounds={minX:-4.9,maxX:4.5,minZ:-3.65,maxZ:9.1};
  const underlay=material({color:0x41463b,roughness:1});
  ground('Fine dark joints under paving',-.2,2.725,9.4,12.75,underlay,-.039);
  // A true interlocking I-shaped paver. Adjacent columns offset half a stone.
  const path=new THREE.Shape();
  const outline=[[-.1,-.12],[.1,-.12],[.1,-.08],[.06,-.04],[.06,.04],[.1,.08],[.1,.12],[-.1,.12],[-.1,.08],[-.06,.04],[-.06,-.04],[-.1,-.08]];
  outline.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();
  const paverGeo=geometry(new THREE.ExtrudeGeometry(path,{depth:.045,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,steps:1,curveSegments:1}));
  const paverMat=grain(material({color:0x656960,roughness:.94}),1200,.18,'concrete-fine');
  const transforms=[]; const dummy=new THREE.Object3D();
  for(let col=-30;col<=27;col++) for(let row=-14;row<=36;row++){
    const x=col*.16,z=row*.24+(Math.abs(col)%2)*.12;
    if(x<bed.maxX+.11&&x>bed.minX-.11&&z>bed.minZ-.12&&z<bed.maxZ+.12)continue;
    transforms.push({x,z});
  }
  const paving=new THREE.InstancedMesh(paverGeo,paverMat,transforms.length);paving.name='Individual interlocking concrete pavers';
  transforms.forEach(({x,z},i)=>{
    dummy.position.set(x,-.041+(random()-.5)*.0014,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(.963,.98,1);dummy.updateMatrix();paving.setMatrixAt(i,dummy.matrix);
    const value=.76+random()*.075;paving.setColorAt(i,new THREE.Color().setRGB(value,value*.995,value*.94));
  });paving.receiveShadow=true;root.add(paving);
  // Border blocks follow the edges of the real bed, and stop at the granite.
  const edgeMat=grain(material({color:0x6b7067,roughness:.96}),450,.16,'border-grain');
  const edges=[];
  for(let z=bed.minZ;z<bed.maxZ;z+=.32)edges.push([bed.minX-.055,z+.16,.105,.312]);
  for(let x=bed.minX;x<bed.maxX;x+=.32){edges.push([x+.16,bed.minZ-.05,.312,.1]);edges.push([x+.16,bed.maxZ+.05,.312,.1]);}
  const border=new THREE.InstancedMesh(box,edgeMat,edges.length);
  edges.forEach(([x,z,w,d],i)=>{dummy.position.set(x,-.014,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,.055,d);dummy.updateMatrix();border.setMatrixAt(i,dummy.matrix);});border.receiveShadow=true;root.add(border);
  const soil=load('soil-v2.webp',1.25); const bump=load('soil-v2.webp',1.25);bump.colorSpace=THREE.NoColorSpace;
  const soilMat=material({map:soil,color:0xa29b90,roughness:1,bumpMap:bump,bumpScale:.009});
  ground('Garden soil adjoining the granite',(bed.minX+bed.maxX)/2,(bed.minZ+bed.maxZ)/2,bed.maxX-bed.minX,bed.maxZ-bed.minZ,soilMat,-.008);

  // Modelled chrysanthemums: curved leaves and petals, visible from every side.
  function petalGeometry(){
    const points=[],indices=[];
    for(let j=0;j<=5;j++){const t=j/5,w=Math.sin(Math.PI*t)*.48;
      points.push(-w,t*t*.23,t,0,t*t*.23+.09*Math.sin(t*Math.PI),t,w,t*t*.23,t);
      if(j<5){const a=j*3;indices.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return geometry(g);
  }
  const petalGeo=petalGeometry(),stemGeo=geometry(new THREE.CylinderGeometry(.0015,.002,1,4));
  const leafMat=material({color:0xffffff,roughness:1,side:THREE.DoubleSide});
  const petalMat=material({color:0xffffff,roughness:.84,side:THREE.DoubleSide});
  const stemMat=material({color:0x4a5431,roughness:1});
  const leaves=[],petals=[],stems=[];
  const flowerPositions=[[-3.22,-1.12,.31,0],[-2.12,-.97,.31,1],[-3.36,.06,.30,1],[-1.77,-.05,.29,0],[-3.10,1.04,.35,0],[-2.06,.98,.30,1]];
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),euler=new THREE.Euler();
  const crowns=new THREE.InstancedMesh(geometry(new THREE.SphereGeometry(1,16,10)),material({color:0x27351e,roughness:1}),flowerPositions.length); crowns.name='Dense chrysanthemum foliage';
  flowerPositions.forEach(([x,z,size],i)=>{dummy.position.set(x,size*.27,z);dummy.rotation.set(0,0,0);dummy.scale.set(size*.53,size*.28,size*.53);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);}); crowns.receiveShadow=true;crowns.castShadow=true;root.add(crowns);
  for(const [x,z,size,tone] of flowerPositions){
    const foliageCount=compact?160:220;
    for(let i=0;i<foliageCount;i++){
      const a=random()*Math.PI*2,r=size*.53*Math.sqrt(random()),h=.045+(1-r/(size*.65))*.16+random()*.035;
      dummy.position.set(x+Math.cos(a)*r,h,z+Math.sin(a)*r);dummy.rotation.set(-.5+random()*1.4,a,random()*.6);dummy.scale.set(.024+random()*.016,.06,.05+random()*.035);dummy.updateMatrix();
      leaves.push({matrix:dummy.matrix.clone(),color:new THREE.Color().setHSL(.20+random()*.06,.30+random()*.25,.12+random()*.1).multiplyScalar(.22)});
    }
    const headCount=compact?64:92;
    for(let i=0;i<headCount;i++){
      const a=i*2.399963,r=size*(.47+random()*.1)*Math.sqrt((i+.5)/headCount),h=.045+random()*.025+size*.44*Math.sqrt(Math.max(0,1-r*r/(size*size*.31)));
      const center=new THREE.Vector3(x+Math.cos(a)*r,h,z+Math.sin(a)*r),normal=new THREE.Vector3(Math.cos(a)*r*2.2,.9,Math.sin(a)*r*2.2).normalize();
      q.setFromUnitVectors(up,normal);const head=new THREE.Matrix4().compose(center,q,new THREE.Vector3(1,1,1));
      for(let layer=0;layer<3;layer++){
        const count=layer===0?13:layer===1?11:8,length=(.026-layer*.004)*(0.8+random()*.4);
        for(let k=0;k<count;k++){
          const angle=k/count*Math.PI*2+layer*.35;
          dummy.position.set(Math.sin(angle)*.002,.004+layer*.003,Math.cos(angle)*.002);
          dummy.rotation.set(-.12-layer*.18,angle,0);dummy.scale.set(length*.65,length,length);dummy.updateMatrix();matrix.multiplyMatrices(head,dummy.matrix);
          const color=new THREE.Color().setHSL(tone?.90+random()*.035:.11+random()*.035,tone?.4+random()*.16:.76+random()*.18,tone?.27+random()*.13:.47+random()*.13).multiplyScalar(.42);
          petals.push({matrix:matrix.clone(),color});
        }
      }
      dummy.position.set(center.x,h/2,center.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,h,1);dummy.updateMatrix();stems.push({matrix:dummy.matrix.clone()});
    }
  }
  function instances(name,geo,mat,list,cast=false){const mesh=new THREE.InstancedMesh(geo,mat,list.length);mesh.name=name;list.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);if(item.color)mesh.setColorAt(i,item.color);});mesh.castShadow=cast;mesh.receiveShadow=true;root.add(mesh);return mesh;}
  instances('Chrysanthemum curved foliage',petalGeo,leafMat,leaves,true);
  instances('Chrysanthemum layered petals',petalGeo,petalMat,petals,false);
  instances('Chrysanthemum stems',stemGeo,stemMat,stems);
  // Sparse fallen leaves give a sense of scale, without extra scene objects.
  const litter=[];
  for(let i=0;i<170;i++){
    let x=bed.minX+random()*(bed.maxX-bed.minX),z=bed.minZ+random()*(bed.maxZ-bed.minZ);
    if(i%4===0){x=bed.minX-.15-random()*.45;z=bed.minZ+random()*3.4;}
    dummy.position.set(x,.006,z);dummy.rotation.set(-.05,random()*Math.PI*2,(random()-.5)*.15);dummy.scale.set(.018+random()*.015,.025,.03+random()*.027);dummy.updateMatrix();
    litter.push({matrix:dummy.matrix.clone(),color:new THREE.Color().setHSL(.085+random()*.06,.35+random()*.25,.22+random()*.17).multiplyScalar(.42)});
  }
  instances('Scattered autumn leaves',petalGeo,leafMat,litter);
  // Original sign including the actual QR, sampled without rewriting its text.
  const signGeo=geometry(plane.clone()),uv=signGeo.attributes.uv;
  [[97,533],[777,527],[133,961],[758,989]].forEach(([x,y],i)=>uv.setXY(i,x/960,1-y/1280));
  const signTexture=load('sign.jpg');signTexture.wrapS=signTexture.wrapT=THREE.ClampToEdgeWrapping;
  const signMat=material({map:signTexture,roughness:.7});
  const sign=new THREE.Mesh(signGeo,signMat);sign.name='Authentic information sign';
  sign.position.set(-2.06,.94,1.91);sign.scale.set(.65,.42,1);sign.rotation.x=-.2;sign.castShadow=true;sign.receiveShadow=true;root.add(sign);clickables.push({mesh:sign,kind:'sign'});
  const metal=material({color:0x30332e,metalness:.48,roughness:.52});
  const post=new THREE.Mesh(box,metal);post.position.set(-2.06,.46,1.87);post.scale.set(.025,.92,.025);post.castShadow=true;root.add(post);
  const backing=new THREE.Mesh(box,metal);backing.position.copy(sign.position);backing.position.z-=.012;backing.rotation.copy(sign.rotation);backing.scale.set(.655,.425,.012);root.add(backing);
  colliders.push({minX:-2.12,maxX:-2,minZ:1.81,maxZ:1.99});
  // Local contact occlusion under masonry and plants complements soft daylight.
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
  const gradient=ctx.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(19,24,17,.28)');gradient.addColorStop(.48,'rgba(19,24,17,.13)');gradient.addColorStop(1,'rgba(19,24,17,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const contact=new THREE.CanvasTexture(c);textures.push(contact);const contactMat=new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false});materials.push(contactMat);
  for(const [x,z,w,d] of [[.18,-.25,3.5,2.9],...flowerPositions.map(([x,z,s])=>[x,z,s*1.5,s*1.5])]){const o=new THREE.Mesh(plane,contactMat);o.rotation.x=-Math.PI/2;o.position.set(x,.008,z);o.scale.set(w,d,1);root.add(o);}
  return {root,colliders,clickables,bedBounds:bed,pavingBounds,signPosition:sign.position.clone(),dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
