/* Shared by the classic museum renderer and the module-based outdoor walks. */
window.HeritagePerformance = {
  createQuality(renderer, root, compact, invalidate) {
    const stillRatio=renderer.getPixelRatio(),walkRatio=Math.min(stillRatio,compact?1.1:1.35);
    let active=false,restoreTimer=0;
    return {
      moving(value) {
        if(value===active)return;
        active=value;clearTimeout(restoreTimer);
        if(value){root.dataset.moving='true';if(renderer.getPixelRatio()!==walkRatio)renderer.setPixelRatio(walkRatio);}
        else restoreTimer=setTimeout(()=>{delete root.dataset.moving;if(renderer.getPixelRatio()!==stillRatio){renderer.setPixelRatio(stillRatio);invalidate();}},220);
      }
    };
  },
  frameDelta(time,last) {
    const seconds=(time-last)/1000;
    return seconds>.2?1/60:Math.max(0,Math.min(seconds,.1));
  },
  move(position,dx,dz,allowed) {
    // Small collision steps preserve walking speed through brief frame drops.
    const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));
    for(let i=0;i<count;i++){
      if(allowed(position.x+dx/count,position.z))position.x+=dx/count;
      if(allowed(position.x,position.z+dz/count))position.z+=dz/count;
    }
  },
  freeze(root) {root.updateMatrixWorld(true);root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});},
  batchExhibits(THREE,root,excluded=[]) {
    // Batch only opaque meshes inside a single assembly. Keep walls, transparent
    // glass, instance meshes and separate exhibit hit targets intact.
    root.updateMatrixWorld(true);let removed=0;
    for(const assembly of root.children){
      if(!assembly.isGroup||excluded.includes(assembly))continue;
      const inverse=assembly.matrixWorld.clone().invert(),buckets=new Map();
      assembly.traverse(mesh=>{
        if(!mesh.isMesh||mesh.isInstancedMesh||!mesh.visible||Array.isArray(mesh.material)||mesh.material.transparent)return;
        let owner=mesh;while(owner&&!owner.userData.exhibit)owner=owner.parent;
        const exhibit=owner?.userData.exhibit||'';
        const signature=Object.entries(mesh.geometry.attributes).map(([n,a])=>`${n}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`).sort().join('|');
        const key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,exhibit,signature].join('/');
        if(!buckets.has(key))buckets.set(key,{meshes:[],exhibit});buckets.get(key).meshes.push(mesh);
      });
      for(const {meshes,exhibit} of buckets.values()){
        if(meshes.length<3)continue;
        const geometries=meshes.map(mesh=>mesh.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld)));
        const geometry=new THREE.BufferGeometry(),vertices=geometries.reduce((n,g)=>n+g.attributes.position.count,0);
        for(const [name,attribute] of Object.entries(geometries[0].attributes)){
          const values=new attribute.array.constructor(vertices*attribute.itemSize);let offset=0;
          for(const g of geometries){values.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}
          geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
        }
        const indexCount=geometries.reduce((n,g)=>n+(g.index?.count||g.attributes.position.count),0),indices=new Uint32Array(indexCount);
        let offset=0,base=0;
        for(const g of geometries){const count=g.index?.count||g.attributes.position.count;for(let i=0;i<count;i++)indices[offset++]=base+(g.index?g.index.getX(i):i);base+=g.attributes.position.count;g.dispose();}
        geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingBox();geometry.computeBoundingSphere();
        const first=meshes[0],batch=new THREE.Mesh(geometry,first.material);batch.name=assembly.name+' — '+first.material.type;
        batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;if(exhibit)batch.userData.exhibit=exhibit;
        for(const mesh of meshes)mesh.removeFromParent();assembly.add(batch);removed+=meshes.length-1;
      }
    }
    return removed;
  }
};
