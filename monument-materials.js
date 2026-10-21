import * as THREE from 'three';

// World-scale stone mapping stays continuous across the individual cladding slabs.
export async function refineStoneMaterials(model, renderer) {
  const map=await new THREE.TextureLoader().loadAsync('assets/monument/granite-grain.jpg');
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const bump=map.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
  const stone=new THREE.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.001,roughness:.43,metalness:.03,envMapIntensity:.6});
  // Exposure compensation belongs to the albedo, not to all of the daylight.
  stone.color.setRGB(2.7,2.75,2.8);
  const p=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();model.updateMatrixWorld(true);
  model.traverse(o=>{
    if(!o.isMesh||!o.material?.name?.startsWith('Granite cladding'))return;
    o.material=stone;
    const pos=o.geometry.attributes.position,norm=o.geometry.attributes.normal,uv=o.geometry.attributes.uv;
    normalMatrix.getNormalMatrix(o.matrixWorld);
    for(let i=0;i<pos.count;i++){
      p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);n.fromBufferAttribute(norm,i).applyMatrix3(normalMatrix);
      const x=Math.abs(n.x),y=Math.abs(n.y),z=Math.abs(n.z);
      if(x>y&&x>z)uv.setXY(i,p.z*2.2,p.y*2.2);
      else if(y>z)uv.setXY(i,p.x*2.2,p.z*2.2);
      else uv.setXY(i,p.x*2.2,p.y*2.2);
    }
    uv.needsUpdate=true;
  });
}
