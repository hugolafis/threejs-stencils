import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Viewer {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private readonly scene = new THREE.Scene();

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly canvas: HTMLCanvasElement) {
    this.initCamera();
    this.initControls();
    this.initLights();

    this.initMeshes();
  }

  readonly update = (dt: number) => {
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };

  readonly resize = () => {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  };

  private initCamera() {
    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight);

    this.camera.position.set(5, 5, 0);

    this.scene.add(this.camera);
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.dampingFactor = 0.05;
    this.controls.enableDamping = true;

    this.controls.target.set(0, 0, 0);
  }

  private initLights() {
    const light = new THREE.DirectionalLight();

    const lightPos = new THREE.Vector3(0.5, 0.5, 0.5).multiplyScalar(25);
    light.position.copy(lightPos);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = 0.00005;

    const shadowCameraExtents = 12.5;
    light.shadow.camera.left = -shadowCameraExtents;
    light.shadow.camera.right = shadowCameraExtents;
    light.shadow.camera.top = shadowCameraExtents;
    light.shadow.camera.bottom = -shadowCameraExtents;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);

    const helper = new THREE.CameraHelper(light.shadow.camera);
    this.scene.add(light);
    this.scene.add(helper);

    this.scene.add(ambient);
  }

  private async initMeshes() {
    // Create the vis planes
    const planeGeometry = new THREE.PlaneGeometry(4.6, 4.6).translate(0, 2.5, 2.5);
    const planeMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      stencilWrite: true,
      stencilZPass: THREE.ReplaceStencilOp,
    });
    for (let i = 1; i < 5; i++) {
      const planeMatCopy = planeMaterial.clone();
      planeMatCopy.stencilRef = i;

      const mesh = new THREE.Mesh(planeGeometry, planeMatCopy);
      mesh.rotation.y = i * (Math.PI / 2);

      this.scene.add(mesh);
    }

    const loader = new GLTFLoader();

    const frame = await loader.loadAsync('./assets/frame.glb');
    this.updateGLTFSceneMaterials(frame.scene, THREE.FrontSide);
    this.scene.add(frame.scene);

    const roomA = await loader.loadAsync('./assets/roomA.glb');
    this.updateGLTFSceneMaterials(roomA.scene, THREE.FrontSide, 1);
    this.scene.add(roomA.scene);

    const roomB = await loader.loadAsync('./assets/roomB.glb');
    this.updateGLTFSceneMaterials(roomB.scene, THREE.FrontSide, 4);
    this.scene.add(roomB.scene);

    const roomC = await loader.loadAsync('./assets/roomC.glb');
    this.updateGLTFSceneMaterials(roomC.scene, THREE.FrontSide, 2);
    this.scene.add(roomC.scene);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(25, 25).rotateX(-Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.EqualStencilFunc,
      })
    );

    //floor.receiveShadow = true;
    this.scene.add(floor);

    /*
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const portalMaterial = new THREE.MeshBasicMaterial();
    portalMaterial.stencilWrite = true;
    portalMaterial.colorWrite = false;
    portalMaterial.depthWrite = false;
    portalMaterial.stencilZPass = THREE.ReplaceStencilOp;

    // Plane / Scene A
    const portalAMaterial = portalMaterial.clone();
    portalAMaterial.stencilRef = 1;
    const portalA = new THREE.Mesh(planeGeometry.clone(), portalAMaterial);
    portalA.position.y += 1;
    portalA.position.z += 1;

    const testCubeMat = new THREE.MeshPhysicalMaterial();
    testCubeMat.stencilFunc = THREE.EqualStencilFunc;
    testCubeMat.stencilWrite = true;
    testCubeMat.stencilRef = 1;

    const testCube = new THREE.Mesh(new THREE.BoxGeometry(), testCubeMat);
    testCube.castShadow = true;
    testCube.receiveShadow = true;


    this.scene.add(portalA);
    this.scene.add(testCube);
        */
  }

  private updateGLTFSceneMaterials(scene: THREE.Group, side: THREE.Side, stencilRef?: number) {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const material = child.material as THREE.Material;

      if (stencilRef) {
        material.stencilFunc = THREE.EqualStencilFunc;
        material.stencilWrite = true;
        material.stencilRef = stencilRef;
      }

      material.side = side;
    });
  }
}
