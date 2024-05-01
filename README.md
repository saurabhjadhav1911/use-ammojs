[![npm](https://img.shields.io/npm/v/use-ammojs?color=%23F69500)](https://www.npmjs.com/package/use-ammojs)
[![npm](https://img.shields.io/badge/bulletphysics%20(fork)-3.17-%23F69500)](https://github.com/notrabs/ammo.js/tree/bullet_submodule)
![npm](https://img.shields.io/npm/types/use-ammojs?label=%20)
# use-ammojs

_Fast_ Physics hooks for use with [react-three-fiber](https://github.com/pmndrs/react-three-fiber).

Achieved by running the [ammo.js](https://github.com/kripken/ammo.js/) physics library in a web-worker. 
Ammo itself is a WebAssembly wrapper around the powerful [Bullet Physics](http://www.bulletphysics.org/) engine.
Data is synced with SharedArrayBuffers having minimal impact on the main thread.

```
yarn add use-ammojs
npm i use-ammojs
```

Built on top of [three-ammo](https://github.com/infinitelee/three-ammo) and its related work.

## Examples

#### API Demos

- [Hello Physics World](https://codesandbox.io/s/oc1op?file=/src/index.js)
- [Soft Bodies](https://codesandbox.io/s/use-ammojs-softbody-example-k59jz)
- [Crane (Constraint)](https://codesandbox.io/s/use-ammojs-constraint-example-inhkk)
- [Crane (Rope + Attachment)](https://codesandbox.io/s/use-ammojs-rope-example-wb9cg)
- [Raycast](https://codesandbox.io/s/use-ammojs-raycast-example-cibin?file=/src/index.js)

#### Stress Tests

- [Lots of cubes](https://codesandbox.io/s/use-ammojs-lotsofcubes-f5xdz?file=/src/index.js)

> ⚠️ Note that the codesandbox examples do not support SharedArrayBuffers [due to missing cross-origin isolation](https://web.dev/coop-coep/) and use regular ArrayBuffers as a fallback. Currently the debug-drawer has no ArrayBuffer fallback implemented and will not render anything.

## Why not use [use-cannon](https://github.com/pmndrs/use-cannon) instead?

use-cannon is great and a inspiration for this package, but it is missing features like soft-bodies and lacks performance in scenes with large triangle meshes. ammo.js is a direct wrapper around the powerful [Bullet Physics](http://www.bulletphysics.org/) engine, which solves these problems.

At the time of writing however use-cannon is more mature and great for most projects.

## Roadmap

#### Main goals:

- [x] Create a Physics World as a React context and simulate it in a web-worker
- [x] Sync three objects to physics Rigid Bodies
- [x] Add Rigid Body support
- [ ] Add [Soft Body](https://pybullet.org/Bullet/BulletFull/classbtSoftBody.html) support
  - [x] Volumes/Cloth from Triangle Mesh
  - [x] Ropes
  - [ ] Support textures on Soft Bodies
  - [ ] Deformables
- [ ] Add Constraints between Rigid Bodies
- [ ] Add Constraints to Soft Bodies (ability to pin nodes in place or to Rigid Bodies)
- [ ] Improve Physics API
  - [ ] Make _all_ props reactive
  - [ ] Expose more methods trough the hook (e.g. setPosition/applyImpulse/[more...](https://pybullet.org/Bullet/BulletFull/classbtRigidBody.html))
  - [ ] Support collision callbacks
- [ ] Add Examples to the documentation
- [ ] Set up Benchmarks to compare cannon, ammo with ArrayBuffers and ammo with SharedArrayBuffers

#### Low priority goals (for unchecked tasks):

- [ ] Automatic refresh rate detection and performance throttling (i.e. match the simulation rate to the requestAnimationFrame-rate and throttle performance if simulation steps take too long)
- [ ] Add [Raycast](https://pybullet.org/Bullet/BulletFull/classbtCollisionWorld.html#aaac6675c8134f6695fecb431c72b0a6a) queries
  - [x] One-time (async) ray-tests
  - [ ] Continuous queries trough a fixed scene component to mitigate worker latency (TODO: check if necessary)
- [x] Use ArrayBuffers as a fallback for missing cross-origin isolation
  - [x] Rigid Bodies
  - [x] Soft Bodies
  - [ ] Debug Rendering
- [x] Simulation managment
  - [x] Configurable simulation speed
  - [x] Expose performance info
    - [ ] Integrate to @react-three/drei Stats component
  - [ ] Automatically pause simulation if tab is out of focus or not rendering (as option)
- [ ] Improve the automatic shape detection (set shapeType automatically based on the three Mesh type)
- [ ] Raycast Vehicle API
- [ ] Support for instanced objects
- [ ] Support and document manual bundling of the wasm file
  - Currently the wasm library is inlined with a base64 string for ease of use. Users who want to save a few bytes can serve it as a seperate file with the `application/wasm` Content-Type in their own deployment. There should be a bundle available without the inlined wasm for that use-case.

## Quick Start

### 1. Wrap your scene in a Physics Provider

```tsx
import { Physics } from "use-ammojs";

<Physics drawDebug>[...]</Physics>;
```

### 2.a Make objects physical (Rigid Bodies)

Automatically parse Shape parameters from the three Mesh (courtesy of [three-to-ammo](https://github.com/InfiniteLee/three-to-ammo)):

```tsx
import { Box } from "@react-three/drei";
import { useRigidBody, ShapeType } from "use-ammojs";
import { Mesh } from "three";

function MyBox() {
  // If you need a ref with a narrower type than Object3D, provide a generic argument here
  const [ref] = useRigidBody<Mesh>(() => ({
    mass: 1,
    position: [0, 2, 4],
    shapeType: ShapeType.BOX,
  }));

  return (
    <Box ref={ref}>
      <meshBasicMaterial attach="material" color="red" />
    </Box>
  );
}
```

or define Collision Shapes manually:

```tsx
const [playerCapsuleRef] = useRigidBody(() => ({
  bodyType: BodyType.DYNAMIC,
  shapeType: ShapeType.CAPSULE,
  angularFactor: new Vector3(0, 0, 0),
  shapeConfig: {
    fit: ShapeFit.MANUAL,
    halfExtents: new Vector3(0.3, 0.6, 0.3),
  },
}));
```

or add collisions to an imported gltf scene:

```tsx
useRigidBody(
  () => ({
    shapeType: ShapeType.MESH,
    bodyType: BodyType.STATIC,
  }),
  gltf.scene
);
```

### 2.a Make objects squishy (Soft Bodies)

```tsx
const [ref] = useSoftBody(() => ({
  type: SoftBodyType.TRIMESH,
}));

return (
  <Sphere position={[0, 2, 7]} args={[1, 16, 16]} ref={ref}>
    <meshPhysicalMaterial attach="material" color="blue" />
  </Sphere>
);
```

### 2.c Add Constraints

```tsx
TODO;
```

### 3.a Raycasts

```tsx
const { rayTest } = useAmmo();

[...]

const hits = await rayTest({
  from: new Vector3(0, 5, 7),
  to: new Vector3(0, -1, 7),
  multiple: true
})

if (hits.length) {
    console.log(hits[0].object.name, hits[0].hitPosition)
}
```

### 3.b Update Motion State

```tsx
const [playerRef, api] = useRigidBody(() => ({
  bodyType: BodyType.DYNAMIC,
  shapeType: ShapeType.CAPSULE,
  angularFactor: new Vector3(0, 0, 0),
  shapeConfig: {
    fit: ShapeFit.MANUAL,
    halfExtents: new Vector3(0.3, 0.6, 0.3),
  },
}));

function handleRespawn() {
  api.setPosition(new Vector3(0, 0, 0));
  api.setLinearVelocity(new Vector3(0, 0, 0));
}
```

## Documentation

### Components

```tsx
<Physics />
```

Phyiscs Context. Use to wrap all physical objects within the same physics world.

```tsx
<PhysicsStats />
```

Shows a stats.js panel with physics timing info. Use within a `<Physics />` Context

### Hooks

```tsx
const { rayTest } = useAmmo();
```

Utility funcionts available anywhere in the `<Physics />` context.

```tsx
const [ref, api] = useRigidBody();
```

```tsx
const [ref, api] = useSoftBody();
```

### Cross-origin isolation

To use `SharedArrayBuffers` for better communication between the main-thread and the web-worker-thread, a cross-origin isolated environment is necessary in [modern browsers](https://caniuse.com/sharedarraybuffer).
This requires sending the following HTTP headers in the response of the main html document ([Learn more](https://web.dev/coop-coep/)):

```http request
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

use-ammojs will fallback to using `ArrayBuffers` and `postMessage()` transfers if `SharedArrayBuffers` are not available. This is not as bad as a full copy on each transfer, but it does not allow the data to be availble on both threads at the same time.

### Developing locally using use-ammojs

<details> 
<summary> Setting up react-scripts to work with yarn link using @craco/craco </summary>

1. `yarn add @craco/craco --dev`
2. Replace `react-scripts` with `craco` in your `package.json` (see [@craco/craco](https://www.npmjs.com/package/@craco/craco) documentation)
3. Add `craco.config.js` to project root:

```js
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix that prevents a duplicate react library being imported when using a linked yarn package
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        react: path.resolve("./node_modules/react"),
        "@react-three/fiber": path.resolve("./node_modules/@react-three/fiber"),
        three: path.resolve("./node_modules/three"),
      };

      return webpackConfig;
    },
  },

  // Make sure SharedArrayBuffers are available locally
  devServer: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
};
```

</details>

1. Run `yarn link` in use-ammojs root directory
2. Run `yarn link use-ammojs` in your project's directory
3. Run `yarn start` in use-ammojs to start the development bundler
4. Build and run your project as usual
