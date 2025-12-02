

import {
  AssetType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
  SphereGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  LocomotionEnvironment,
  EnvironmentType,
  PanelUI,
  Interactable,
  OneHandGrabbable,
  DistanceGrabbable,
  MovementMode,
  ScreenSpace,
  PhysicsBody, PhysicsShape, PhysicsShapeType, PhysicsState, PhysicsSystem,
  createSystem
} from '@iwsdk/core';


import { PanelSystem } from './panel.js';


const assets = {
  chimeSound: {
    url: '/audio/chime.mp3',
    type: AssetType.Audio,
    priority: 'background'
  },
  lamp: {
    url:'/gltf/lamp/scene.gltf',
    type: AssetType.GLTF,
    priority: 'critical',
  },
  keyroom1: {
    url: '/gltf/door_keys/scene.gltf',
    type: AssetType.GLTF,
    priority: 'critical',
  }
};

World.create(document.getElementById('scene-container'), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    // Optional structured features; layers/local-floor are offered by default
    features: { handTracking: true, layers: false } 
  },
  features: { locomotion: { useWorker: true }, grabbing: true, physics: true},
  level: '/glxf/2/Composition.glxf' 
}).then((world) => {
  const { camera } = world;
  
 // Create a green sphere
  const sphereGeometry = new SphereGeometry(0.25, 32, 32);
  const greenMaterial = new MeshStandardMaterial({ color: "red" });
  const sphere = new Mesh(sphereGeometry, greenMaterial);
  sphere.position.set(1, 1.5, -3);
  const sphereEntity = world.createTransformEntity(sphere);
  sphereEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 0.2, friction: 0.5, restitution: 0.9 });
  sphereEntity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

  // Global floor
  const floorMesh = new Mesh(new PlaneGeometry(40, 30), new MeshStandardMaterial({ color: "grey", side: 2}));
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);
  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });
  floorEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
  floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });

 //room1
 function createRoom(world, width = 10, depth = 10, height = 3, color = "pink") {
  const roomRoot = world.createTransformEntity();
  const wallmat= new MeshStandardMaterial({ color: "pink", side: 2 });
  const floorMat= new MeshStandardMaterial({ color: "tan", side: 2 });
  const ceilingMat= new MeshStandardMaterial({ color: "white", side: 2 });
  // Back Wall
  const back = new Mesh(new PlaneGeometry(width, height), wallmat);
  back.position.set(0, height / 2, -depth / 2);
  roomRoot.object3D.add(back);
  // no rotation (faces forward)
  // Front Wall (behind player)
  const front = new Mesh(new PlaneGeometry(width, height), wallmat);
  front.position.set(0, height / 2, depth / 2);
  front.rotation.y = Math.PI; // face inward
  roomRoot.object3D.add(front);
  // Left Wall
  const left = new Mesh(new PlaneGeometry(depth, height), wallmat);
  left.position.set(-width / 2, height / 2, 0);
  left.rotation.y = Math.PI / 2;
  roomRoot.object3D.add(left);
  // Right Wall
  const right = new Mesh(new PlaneGeometry(depth, height), wallmat);
  right.position.set(width / 2, height / 2, 0);
  right.rotation.y = -Math.PI / 2;
  roomRoot.object3D.add(right);
  // Floor
  const floor = new Mesh(new PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.002, 0);
  roomRoot.object3D.add(floor);
  // Ceiling (optional)
  const ceiling = new Mesh(new PlaneGeometry(width, depth), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, height, 0);
  roomRoot.object3D.add(ceiling);
  // Add all to world
  return roomRoot;
}
const room1= createRoom(world,7,10,3);
room1.object3D.position.set(-13,0,-5)

//ROOM#1 Moveable lamp-to find key
const cluelamp = AssetManager.getGLTF('lamp').scene;
cluelamp.scale.set(0.007,0.007,0.007);
cluelamp.position.set(-14,1.4,-6)
const cluelampEntity = world.createTransformEntity(cluelamp);
cluelampEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto});
cluelampEntity.addComponent(PhysicsBody, { state: PhysicsState.Kinematic});
cluelampEntity.addComponent(Interactable);
cluelampEntity.addComponent(OneHandGrabbable);


//ROOM#1 Moveable key-from lamp
const cluekey1 = AssetManager.getGLTF('keyroom1').scene;
cluekey1.scale.set(.5,.5,.5);
cluekey1.position.set(-8,2.5,-6)
const keyEntity = world.createTransformEntity(cluekey1);
keyEntity.addComponent(Interactable);
keyEntity.addComponent(DistanceGrabbable,{movementMode:MovementMode.MoveTowardsTarget});
keyEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
keyEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,
  density: 0.1,
  friction: 0.5,
  restitution: 0.3
});


  
  world.registerSystem(PhysicsSystem).registerComponent(PhysicsBody).registerComponent(PhysicsShape);
  





  // vvvvvvvv EVERYTHING BELOW WAS ADDED TO DISPLAY A BUTTON TO ENTER VR FOR QUEST 1 DEVICES vvvvvv
  //          (for some reason IWSDK doesn't show Enter VR button on Quest 1)
  world.registerSystem(PanelSystem);
  
  if (isMetaQuest1()) {
    const panelEntity = world
      .createTransformEntity()
      .addComponent(PanelUI, {
        config: '/ui/welcome.json',
        maxHeight: 0.8,
        maxWidth: 1.6
      })
      .addComponent(Interactable)
      .addComponent(ScreenSpace, {
        top: '20px',
        left: '20px',
        height: '40%'
      });
    panelEntity.object3D.position.set(0, 1.29, -1.9);
  } else {
    // Skip panel on non-Meta-Quest-1 devices
    // Useful for debugging on desktop or newer headsets.
    console.log('Panel UI skipped: not running on Meta Quest 1 (heuristic).');
  }
  function isMetaQuest1() {
    try {
      const ua = (navigator && (navigator.userAgent || '')) || '';
      const hasOculus = /Oculus|Quest|Meta Quest/i.test(ua);
      const isQuest2or3 = /Quest\s?2|Quest\s?3|Quest2|Quest3|MetaQuest2|Meta Quest 2/i.test(ua);
      return hasOculus && !isQuest2or3;
    } catch (e) {
      return false;
    }
  }
});
