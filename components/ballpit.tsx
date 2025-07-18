import React, { useRef, useEffect } from "react";
import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  WebGLRendererParameters,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

interface XConfig {
  canvas?: HTMLCanvasElement;
  id?: string;
  rendererOptions?: Partial<WebGLRendererParameters>;
  size?: "parent" | { width: number; height: number };
}

interface SizeData {
  width: number;
  height: number;
  wWidth: number;
  wHeight: number;
  ratio: number;
  pixelRatio: number;
}

class X {
  #config: XConfig;
  #resizeObserver?: ResizeObserver;
  #intersectionObserver?: IntersectionObserver;
  #resizeTimer?: number;
  #animationFrameId: number = 0;
  #clock: Clock = new Clock();
  #animationState = { elapsed: 0, delta: 0 };
  #isAnimating: boolean = false;
  #isVisible: boolean = false;

  canvas!: HTMLCanvasElement;
  camera!: PerspectiveCamera;
  cameraMinAspect?: number;
  cameraMaxAspect?: number;
  cameraFov!: number;
  maxPixelRatio?: number;
  minPixelRatio?: number;
  scene!: Scene;
  renderer!: WebGLRenderer;
  size: SizeData = {
    width: 0,
    height: 0,
    wWidth: 0,
    wHeight: 0,
    ratio: 0,
    pixelRatio: 0,
  };

  render: () => void = this.#render.bind(this);
  onBeforeRender: (state: { elapsed: number; delta: number }) => void = () => {};
  onAfterRender: (state: { elapsed: number; delta: number }) => void = () => {};
  onAfterResize: (size: SizeData) => void = () => {};
  isDisposed: boolean = false;

  constructor(config: XConfig) {
    this.#config = { ...config };
    this.#initCamera();
    this.#initScene();
    this.#initRenderer();
    this.resize();
    this.#initObservers();
  }

  #initCamera() {
    this.camera = new PerspectiveCamera();
    this.cameraFov = this.camera.fov;
  }

  #initScene() {
    this.scene = new Scene();
  }

  #initRenderer() {
    if (this.#config.canvas) {
      this.canvas = this.#config.canvas;
    } else if (this.#config.id) {
      const elem = document.getElementById(this.#config.id);
      if (elem instanceof HTMLCanvasElement) {
        this.canvas = elem;
      } else {
        console.error("Three: Missing canvas or id parameter");
        return;
      }
    } else {
      console.error("Three: Missing canvas or id parameter");
      return;
    }
    
    this.canvas!.style.display = "block";
    const rendererOptions: WebGLRendererParameters = {
      canvas: this.canvas,
      powerPreference: "high-performance",
      ...(this.#config.rendererOptions ?? {}),
    };
    this.renderer = new WebGLRenderer(rendererOptions);
    this.renderer.outputColorSpace = SRGBColorSpace;
  }

  #initObservers() {
    if (!(this.#config.size instanceof Object)) {
      window.addEventListener("resize", this.#onResize.bind(this));
      if (this.#config.size === "parent" && this.canvas.parentNode) {
        this.#resizeObserver = new ResizeObserver(this.#onResize.bind(this));
        this.#resizeObserver.observe(this.canvas.parentNode as Element);
      }
    }
    this.#intersectionObserver = new IntersectionObserver(
      this.#onIntersection.bind(this),
      { root: null, rootMargin: "0px", threshold: 0 }
    );
    this.#intersectionObserver.observe(this.canvas);
    document.addEventListener("visibilitychange", this.#onVisibilityChange.bind(this));
  }

  #onResize() {
    if (this.#resizeTimer) clearTimeout(this.#resizeTimer);
    this.#resizeTimer = window.setTimeout(this.resize.bind(this), 100);
  }

  resize() {
    let w: number, h: number;
    if (this.#config.size instanceof Object) {
      w = this.#config.size.width;
      h = this.#config.size.height;
    } else if (this.#config.size === "parent" && this.canvas.parentNode) {
      w = (this.canvas.parentNode as HTMLElement).offsetWidth;
      h = (this.canvas.parentNode as HTMLElement).offsetHeight;
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    this.size.width = w;
    this.size.height = h;
    this.size.ratio = w / h;
    this.#updateCamera();
    this.#updateRenderer();
    this.onAfterResize(this.size);
  }

  #updateCamera() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#adjustFov(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#adjustFov(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }

  #adjustFov(aspect: number) {
    const tanFov = Math.tan(MathUtils.degToRad(this.cameraFov / 2));
    const newTan = tanFov / (this.camera.aspect / aspect);
    this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(newTan));
  }

  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    }
  }

  #updateRenderer() {
    this.renderer.setSize(this.size.width, this.size.height);
    let pr = window.devicePixelRatio;
    if (this.maxPixelRatio && pr > this.maxPixelRatio) {
      pr = this.maxPixelRatio;
    } else if (this.minPixelRatio && pr < this.minPixelRatio) {
      pr = this.minPixelRatio;
    }
    this.renderer.setPixelRatio(Math.min(pr, 2)); // Cap at 2 for performance
    this.size.pixelRatio = pr;
  }

  #onIntersection(entries: IntersectionObserverEntry[]) {
    this.#isAnimating = entries[0].isIntersecting;
    this.#isAnimating ? this.#startAnimation() : this.#stopAnimation();
  }

  #onVisibilityChange() {
    if (this.#isAnimating) {
      document.hidden ? this.#stopAnimation() : this.#startAnimation();
    }
  }

  #startAnimation() {
    if (this.#isVisible) return;
    const animateFrame = () => {
      this.#animationFrameId = requestAnimationFrame(animateFrame);
      this.#animationState.delta = Math.min(this.#clock.getDelta(), 1/30); // Cap delta time
      this.#animationState.elapsed += this.#animationState.delta;
      this.onBeforeRender(this.#animationState);
      this.render();
      this.onAfterRender(this.#animationState);
    };
    this.#isVisible = true;
    this.#clock.start();
    animateFrame();
  }

  #stopAnimation() {
    if (this.#isVisible) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#isVisible = false;
      this.#clock.stop();
    }
  }

  #render() {
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    this.scene.traverse((obj: Object3D) => {
      if ((obj as any).isMesh) {
        const mesh = obj as any;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: any) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      }
    });
    this.scene.clear();
  }

  dispose() {
    this.#onResizeCleanup();
    this.#stopAnimation();
    this.clear();
    this.renderer.dispose();
    this.isDisposed = true;
  }

  #onResizeCleanup() {
    window.removeEventListener("resize", this.#onResize.bind(this));
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.#onVisibilityChange.bind(this));
  }
}

// Optimized Physics System
interface Ball {
  position: Vector3;
  velocity: Vector3;
  radius: number;
  mass: number;
  color: Color;
}

interface WConfig {
  count: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  maxSize: number;
  minSize: number;
  size0: number;
  gravity: number;
  friction: number;
  wallBounce: number;
  maxVelocity: number;
  controlSphere0?: boolean;
  followCursor?: boolean;
  cursorRadius?: number;
  cursorForce?: number;
  dampingThreshold?: number;
}

class W {
  config: WConfig;
  balls: Ball[] = [];
  center: Vector3 = new Vector3();
  tempVec1 = new Vector3();
  tempVec2 = new Vector3();

  constructor(config: WConfig) {
    this.config = config;
    this.initializeBalls();
  }

  initializeBalls() {
    this.balls = [];
    
    // First ball (controlled)
    this.balls.push({
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      radius: this.config.size0,
      mass: 1,
      color: new Color(0x00ff00)
    });

    // Generate remaining balls with better distribution
    const gridSize = Math.ceil(Math.cbrt(this.config.count - 1));
    const spacing = Math.min(this.config.maxX, this.config.maxY, this.config.maxZ) * 1.2 / gridSize;
    
    let ballIndex = 1;
    
    // Create grid-based distribution with more spread
    for (let x = 0; x < gridSize && ballIndex < this.config.count; x++) {
      for (let y = 0; y < gridSize && ballIndex < this.config.count; y++) {
        for (let z = 0; z < gridSize && ballIndex < this.config.count; z++) {
          const gridX = (x - gridSize / 2) * spacing;
          const gridY = (y - gridSize / 2) * spacing + 2; // Start higher up
          const gridZ = (z - gridSize / 2) * spacing;
          
          const randomOffset = spacing * 0.4;
          const radius = MathUtils.randFloat(this.config.minSize, this.config.maxSize);
          
          this.balls.push({
            position: new Vector3(
              gridX + MathUtils.randFloatSpread(randomOffset),
              gridY + MathUtils.randFloatSpread(randomOffset),
              gridZ + MathUtils.randFloatSpread(randomOffset)
            ),
            velocity: new Vector3(
              MathUtils.randFloatSpread(0.1),
              MathUtils.randFloatSpread(0.1),
              MathUtils.randFloatSpread(0.1)
            ),
            radius,
            mass: radius, // Simplified mass calculation
            color: new Color() // Will be set by updateColors() with gradient
          });
          
          ballIndex++;
        }
      }
    }

    // Fill remaining with random positions (higher up)
    while (ballIndex < this.config.count) {
      const radius = MathUtils.randFloat(this.config.minSize, this.config.maxSize);
      this.balls.push({
        position: new Vector3(
          MathUtils.randFloatSpread(this.config.maxX * 1.2),
          MathUtils.randFloat(0, this.config.maxY), // Start above ground
          MathUtils.randFloatSpread(this.config.maxZ * 1.2)
        ),
        velocity: new Vector3(
          MathUtils.randFloatSpread(0.1),
          MathUtils.randFloatSpread(0.1),
          MathUtils.randFloatSpread(0.1)
        ),
        radius,
        mass: radius,
        color: new Color() // Will be set by updateColors() with gradient
      });
      ballIndex++;
    }
  }

  update(deltaInfo: { delta: number }) {
    const delta = Math.min(deltaInfo.delta, 1/30); // Cap delta for stability
    const subSteps = 3; // Multiple physics steps per frame for stability
    const subDelta = delta / subSteps;

    for (let step = 0; step < subSteps; step++) {
      this.updatePhysicsStep(subDelta);
    }
  }

  updatePhysicsStep(delta: number) {
    const startIdx = this.config.controlSphere0 ? 1 : 0;

    // Update controlled ball - smooth following without violent movement
    if (this.config.controlSphere0 && this.config.followCursor) {
      const ball = this.balls[0];
      ball.position.lerp(this.center, 0.12); // Smoother following
      ball.velocity.set(0, 0, 0);
    }

    // Apply cursor fluid-like forces to nearby balls
    if (this.config.followCursor && this.config.cursorRadius && this.config.cursorForce) {
      const cursorInfluence = new Vector3();
      for (let i = startIdx; i < this.balls.length; i++) {
        const ball = this.balls[i];
        cursorInfluence.copy(this.center).sub(ball.position);
        const distance = cursorInfluence.length();
        
        if (distance < this.config.cursorRadius && distance > 0.1) {
          // Fluid-like displacement force
          const influence = Math.pow(1 - (distance / this.config.cursorRadius), 2);
          cursorInfluence.normalize();
          
          // Push away from cursor like water displacement
          ball.velocity.add(
            cursorInfluence.multiplyScalar(-this.config.cursorForce * influence * delta)
          );
        }
      }
    }

    // Apply forces and update velocities
    for (let i = startIdx; i < this.balls.length; i++) {
      const ball = this.balls[i];
      
      // Apply gravity
      ball.velocity.y -= this.config.gravity * delta;
      
      // Apply velocity-dependent damping for realistic settling
      const speed = ball.velocity.length();
      let frictionMultiplier = this.config.friction;
      
      // Stronger damping when slow (helps with settling)
      if (speed < this.config.dampingThreshold!) {
        frictionMultiplier = Math.pow(this.config.friction, 3);
      }
      
      ball.velocity.multiplyScalar(Math.pow(frictionMultiplier, delta * 60));
      
      // Clamp velocity
      if (ball.velocity.length() > this.config.maxVelocity) {
        ball.velocity.normalize().multiplyScalar(this.config.maxVelocity);
      }
      
      // Sleep very slow balls to prevent micro-jitter
      if (speed < 0.005) {
        ball.velocity.multiplyScalar(0.8);
      }
    }

    // Ball-to-ball collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        this.resolveBallCollision(this.balls[i], this.balls[j], delta);
      }
    }

    // Update positions and wall collisions
    for (let i = startIdx; i < this.balls.length; i++) {
      const ball = this.balls[i];
      
      // Update position
      ball.position.add(this.tempVec1.copy(ball.velocity).multiplyScalar(delta * 16));
      
      // Wall collisions
      this.resolveWallCollisions(ball);
    }
  }

  resolveBallCollision(ball1: Ball, ball2: Ball, delta: number) {
    this.tempVec1.copy(ball2.position).sub(ball1.position);
    const distance = this.tempVec1.length();
    const minDistance = ball1.radius + ball2.radius;
    
    if (distance < minDistance && distance > 0.001) {
      // Normalize collision vector
      this.tempVec1.divideScalar(distance);
      
      // Gentle separation to prevent stacking issues
      const overlap = minDistance - distance;
      const separation = overlap * 0.52; // Slightly more than half
      
      ball1.position.add(this.tempVec2.copy(this.tempVec1).multiplyScalar(-separation));
      ball2.position.add(this.tempVec2.copy(this.tempVec1).multiplyScalar(separation));
      
      // Realistic collision response with energy loss
      const relativeVelocity = this.tempVec2.copy(ball2.velocity).sub(ball1.velocity);
      const separatingVelocity = relativeVelocity.dot(this.tempVec1);
      
      if (separatingVelocity < 0) {
        const restitution = 0.3; // Much less bouncy for realistic settling
        const totalMass = ball1.mass + ball2.mass;
        const impulse = -(1 + restitution) * separatingVelocity / totalMass;
        
        const impulseVector = this.tempVec2.copy(this.tempVec1).multiplyScalar(impulse);
        
        ball1.velocity.add(impulseVector.clone().multiplyScalar(-ball2.mass));
        ball2.velocity.add(impulseVector.clone().multiplyScalar(ball1.mass));
        
        // Add some friction in collision for more realistic behavior
        const tangentialVelocity = relativeVelocity.clone().sub(
          this.tempVec1.clone().multiplyScalar(separatingVelocity)
        );
        const frictionImpulse = tangentialVelocity.multiplyScalar(-0.1); // Friction coefficient
        
        ball1.velocity.add(frictionImpulse.clone().multiplyScalar(-ball2.mass / totalMass));
        ball2.velocity.add(frictionImpulse.clone().multiplyScalar(ball1.mass / totalMass));
      }
    }
  }

  resolveWallCollisions(ball: Ball) {
    const bounce = this.config.wallBounce;
    
    // X walls
    if (ball.position.x + ball.radius > this.config.maxX) {
      ball.position.x = this.config.maxX - ball.radius;
      ball.velocity.x = -Math.abs(ball.velocity.x) * bounce;
    } else if (ball.position.x - ball.radius < -this.config.maxX) {
      ball.position.x = -this.config.maxX + ball.radius;
      ball.velocity.x = Math.abs(ball.velocity.x) * bounce;
    }
    
    // Y walls (floor has more damping)
    if (ball.position.y + ball.radius > this.config.maxY) {
      ball.position.y = this.config.maxY - ball.radius;
      ball.velocity.y = -Math.abs(ball.velocity.y) * bounce;
    } else if (ball.position.y - ball.radius < -this.config.maxY) {
      ball.position.y = -this.config.maxY + ball.radius;
      ball.velocity.y = Math.abs(ball.velocity.y) * bounce;
      
      // Extra damping when hitting the floor to prevent endless bouncing
      ball.velocity.multiplyScalar(0.8);
    }
    
    // Z walls
    if (ball.position.z + ball.radius > this.config.maxZ) {
      ball.position.z = this.config.maxZ - ball.radius;
      ball.velocity.z = -Math.abs(ball.velocity.z) * bounce;
    } else if (ball.position.z - ball.radius < -this.config.maxZ) {
      ball.position.z = -this.config.maxZ + ball.radius;
      ball.velocity.z = Math.abs(ball.velocity.z) * bounce;
    }
  }
}

// Updated configuration with realistic physics
const ballpitConfig = {
  count: 80,
  colors: [0x003300],
  ambientColor: 0x003300,
  ambientIntensity: 1,
  lightIntensity: 150,
  materialParams: {
    metalness: 0.9,
    roughness: 0.6,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  },
  minSize: 0.5,
  maxSize: 0.8,
  size0: 0.7,
  gravity: 1, // Stronger gravity for settling
  friction: 0.95, // More friction for settling
  wallBounce: 0.5, // Much less bouncy
  maxVelocity: 2,
  maxX: 8,
  maxY: 8,
  maxZ: 2,
  controlSphere0: true,
  followCursor: true,
  // New fluid-like cursor interaction
  cursorRadius: 1.5, // Radius of influence
  cursorForce: 150000000000.0, // Force strength
  dampingThreshold: 0.01, // Below this velocity, balls start to settle
};

// Enhanced Material
class EnhancedMaterial extends MeshPhysicalMaterial {
  constructor(params: any) {
    super(params);
    this.transmission = 0.9;
    this.thickness = 0.5;
    this.ior = 1.5;
  }
}

const matrixObject = new Object3D();

class BallRenderer extends Object3D {
  config: typeof ballpitConfig;
  physics: W;
  ambientLight?: AmbientLight;
  light?: PointLight;
  mesh: InstancedMesh;

  constructor(renderer: WebGLRenderer, params: Partial<typeof ballpitConfig> = {}) {
    super();
    this.config = { ...ballpitConfig, ...params };
    
    // Setup environment
    const roomEnv = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(roomEnv).texture;
    
    // Create geometry and material
    const geometry = new SphereGeometry(1, 32, 16); // Reduced segments for performance
    const material = new EnhancedMaterial({ 
      envMap: envTexture, 
      ...this.config.materialParams 
    });
    
    this.mesh = new InstancedMesh(geometry, material, this.config.count);
    this.physics = new W(this.config);
    
    this.setupLights();
    this.updateColors();
    this.add(this.mesh);
    
    pmrem.dispose();
  }

  setupLights() {
    this.ambientLight = new AmbientLight(
      this.config.ambientColor,
      this.config.ambientIntensity
    );
    this.add(this.ambientLight);
    
    this.light = new PointLight(0xffffff, this.config.lightIntensity);
    this.light.position.set(0, 0, 10);
    this.add(this.light);
  }

  updateColors() {
    if (this.config.colors.length > 1) {
      // Create smooth gradient between colors
      const colorUtils = this.createColorUtils(this.config.colors);
      
      for (let i = 0; i < this.mesh.count; i++) {
        const ball = this.physics.balls[i];
        const gradientColor = colorUtils.getColorAt(i / this.mesh.count);
        ball.color.copy(gradientColor);
        this.mesh.setColorAt(i, ball.color);
      }
    } else {
      const color = new Color(this.config.colors[0]);
      for (let i = 0; i < this.mesh.count; i++) {
        const ball = this.physics.balls[i];
        ball.color.copy(color);
        this.mesh.setColorAt(i, color);
      }
    }
    
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  createColorUtils(colors: number[]) {
    const colorObjects: Color[] = colors.map(col => new Color(col));
    
    return {
      getColorAt: (ratio: number, out: Color = new Color()) => {
        const clamped = Math.max(0, Math.min(1, ratio));
        const scaled = clamped * (colors.length - 1);
        const idx = Math.floor(scaled);
        const start = colorObjects[idx];
        
        if (idx >= colors.length - 1) return start.clone();
        
        const alpha = scaled - idx;
        const end = colorObjects[idx + 1];
        
        out.r = start.r + alpha * (end.r - start.r);
        out.g = start.g + alpha * (end.g - start.g);
        out.b = start.b + alpha * (end.b - start.b);
        
        return out;
      },
    };
  }

  update(deltaInfo: { delta: number }) {
    this.physics.update(deltaInfo);
    
    for (let i = 0; i < this.mesh.count; i++) {
      const ball = this.physics.balls[i];
      
      matrixObject.position.copy(ball.position);
      matrixObject.scale.setScalar(ball.radius);
      matrixObject.updateMatrix();
      
      this.mesh.setMatrixAt(i, matrixObject.matrix);
      
      if (i === 0 && this.light) {
        this.light.position.copy(ball.position);
      }
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Pointer handling
let globalPointerActive = false;
const pointerPosition = new Vector2();

interface PointerData {
  position: Vector2;
  nPosition: Vector2;
  hover: boolean;
  onEnter: (data: PointerData) => void;
  onMove: (data: PointerData) => void;
  onClick: (data: PointerData) => void;
  onLeave: (data: PointerData) => void;
  dispose?: () => void;
}

const pointerMap = new Map<HTMLElement, PointerData>();

function createPointerData(
  options: Partial<PointerData> & { domElement: HTMLElement }
): PointerData {
  const defaultData: PointerData = {
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    onEnter: () => {},
    onMove: () => {},
    onClick: () => {},
    onLeave: () => {},
    ...options,
  };
  
  if (!pointerMap.has(options.domElement)) {
    pointerMap.set(options.domElement, defaultData);
    if (!globalPointerActive) {
      document.body.addEventListener("pointermove", onPointerMove as EventListener);
      document.body.addEventListener("pointerleave", onPointerLeave as EventListener);
      document.body.addEventListener("click", onPointerClick as EventListener);
      globalPointerActive = true;
    }
  }
  
  defaultData.dispose = () => {
    pointerMap.delete(options.domElement);
    if (pointerMap.size === 0) {
      document.body.removeEventListener("pointermove", onPointerMove as EventListener);
      document.body.removeEventListener("pointerleave", onPointerLeave as EventListener);
      document.body.removeEventListener("click", onPointerClick as EventListener);
      globalPointerActive = false;
    }
  };
  
  return defaultData;
}

function onPointerMove(e: PointerEvent) {
  pointerPosition.set(e.clientX, e.clientY);
  for (const [elem, data] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    if (isInside(rect)) {
      updatePointerData(data, rect);
      if (!data.hover) {
        data.hover = true;
        data.onEnter(data);
      }
      data.onMove(data);
    } else if (data.hover) {
      data.hover = false;
      data.onLeave(data);
    }
  }
}

function onPointerClick(e: PointerEvent) {
  pointerPosition.set(e.clientX, e.clientY);
  for (const [elem, data] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    updatePointerData(data, rect);
    if (isInside(rect)) data.onClick(data);
  }
}

function onPointerLeave() {
  for (const data of pointerMap.values()) {
    if (data.hover) {
      data.hover = false;
      data.onLeave(data);
    }
  }
}

function updatePointerData(data: PointerData, rect: DOMRect) {
  data.position.set(
    pointerPosition.x - rect.left,
    pointerPosition.y - rect.top
  );
  data.nPosition.set(
    (data.position.x / rect.width) * 2 - 1,
    (-data.position.y / rect.height) * 2 + 1
  );
}

function isInside(rect: DOMRect) {
  return (
    pointerPosition.x >= rect.left &&
    pointerPosition.x <= rect.left + rect.width &&
    pointerPosition.y >= rect.top &&
    pointerPosition.y <= rect.top + rect.height
  );
}

// Main creation function
interface CreateBallpitReturn {
  three: X;
  spheres: BallRenderer;
  setCount: (count: number) => void;
  togglePause: () => void;
  dispose: () => void;
}

function createBallpit(
  canvas: HTMLCanvasElement,
  config: any = {}
): CreateBallpitReturn {
  const threeInstance = new X({
    canvas,
    size: "parent",
    rendererOptions: { antialias: true, alpha: true },
  });
  
  let spheres: BallRenderer;
  threeInstance.renderer.toneMapping = ACESFilmicToneMapping;
  threeInstance.renderer.toneMappingExposure = 1.0;
  threeInstance.camera.position.set(0, 0, 20);
  threeInstance.camera.lookAt(0, 0, 0);
  threeInstance.cameraMaxAspect = 1.5;
  threeInstance.maxPixelRatio = 2;
  threeInstance.resize();
  
  initialize(config);
  
  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const intersectionPoint = new Vector3();
  let isPaused = false;
  
  const pointerData = createPointerData({
    domElement: canvas,
    onMove() {
      if (spheres?.config.followCursor) {
        raycaster.setFromCamera(pointerData.nPosition, threeInstance.camera);
        threeInstance.camera.getWorldDirection(plane.normal);
        raycaster.ray.intersectPlane(plane, intersectionPoint);
        spheres.physics.center.copy(intersectionPoint);
        spheres.config.controlSphere0 = true;
      }
    },
    onLeave() {
      if (spheres) {
        spheres.config.controlSphere0 = false;
      }
    },
  });
  
  function initialize(cfg: any) {
    if (spheres) {
      threeInstance.clear();
      threeInstance.scene.remove(spheres);
    }
    spheres = new BallRenderer(threeInstance.renderer, cfg);
    threeInstance.scene.add(spheres);
  }
  
  threeInstance.onBeforeRender = (deltaInfo) => {
    if (!isPaused && spheres) {
      spheres.update(deltaInfo);
    }
  };
  
  threeInstance.onAfterResize = (size) => {
    if (spheres) {
      spheres.config.maxX = size.wWidth / 2;
      spheres.config.maxY = size.wHeight / 2;
    }
  };
  
  return {
    three: threeInstance,
    get spheres() {
      return spheres;
    },
    setCount(count: number) {
      initialize({ ...spheres.config, count });
    },
    togglePause() {
      isPaused = !isPaused;
    },
    dispose() {
      pointerData.dispose?.();
      threeInstance.dispose();
    },
  };
}

// React Component
interface BallpitProps {
  className?: string;
  followCursor?: boolean;
  count?: number;
  colors?: number[];
  gravity?: number;
  [key: string]: any;
}

const Ballpit: React.FC<BallpitProps> = ({
  className = "",
  followCursor = true,
  count = 200,
  colors= [0x001100, 0x00aa00, 0x33cc33, 0x55bb55, 0x77dd77],
  gravity = 3.0,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spheresInstanceRef = useRef<CreateBallpitReturn | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    spheresInstanceRef.current = createBallpit(canvas, {
      followCursor,
      count,
      colors,
      gravity,
      ...props,
    });

    return () => {
      if (spheresInstanceRef.current) {
        spheresInstanceRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update config when props change
  useEffect(() => {
    if (spheresInstanceRef.current?.spheres) {
      const spheres = spheresInstanceRef.current.spheres;
      spheres.config.followCursor = followCursor;
      spheres.config.gravity = gravity;
      spheres.config.colors = colors;
      
      // Force color update
      spheres.updateColors();
    }
  }, [followCursor, gravity, colors]);

  return (
    <canvas
      className={className}
      ref={canvasRef}
      style={{ 
        width: "100%", 
        height: "100%",
        display: "block"
      }}
    />
  );
};

export default Ballpit;