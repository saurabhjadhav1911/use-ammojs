import { Euler, EulerOrder, MathUtils, Object3D, Quaternion, Vector3 } from "three";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { useAmmoPhysicsContext } from "../physics-context";
import { BodyConfig, BodyType, ShapeConfig, ShapeType, } from "../../three-ammo/lib/types";
import { createRigidBodyApi, RigidbodyApi } from "../api/rigidbody-api";
import { isEuler, isQuaternion, isVector3, } from "../../three-ammo/worker/utils";

type UseRigidBodyOptions = Omit<BodyConfig, "type"> & {
  shapeType: ShapeType;
  bodyType?: BodyType;

  // Overrides the physics shape. If not defined the referenced object3Ds mesh will be used. Origins must match.
  mesh?: Object3D;

  // use for manual overrides with the physics shape.
  shapeConfig?: Omit<ShapeConfig, "type">;

  position?: Vector3 | [number, number, number];

  rotation?:
    | Euler
    | [number, number, number]
    | [number, number, number, EulerOrder]
    | Quaternion;
};

export function useRigidBody<T extends Object3D = Object3D>(
  options: UseRigidBodyOptions | (() => UseRigidBodyOptions),
  object3D?: Object3D
): [RefObject<T>, RigidbodyApi] {
  const ref = useRef<T>(null);

  const physicsContext = useAmmoPhysicsContext();
  const { addRigidBody, removeRigidBody } = physicsContext;

  const [bodyUUID] = useState(() => MathUtils.generateUUID());

  useEffect(() => {
    const objectToUse = object3D ? object3D : ref.current!;

    if (typeof options === "function") {
      options = options();
    }
    const {
      bodyType,
      shapeType,
      shapeConfig,
      position,
      rotation,
      mesh,
      ...rest
    } = options;

    if (position) {
      if (isVector3(position)) {
        objectToUse.position.set(position.x, position.y, position.z);
      } else if (position.length === 3) {
        objectToUse.position.set(position[0], position[1], position[2]);
      } else {
        throw new Error("invalid position: expected Vector3 or VectorTuple");
      }

      objectToUse.updateMatrixWorld();
    }

    if (rotation) {
      if (isEuler(rotation)) {
        objectToUse.rotation.copy(rotation);
      } else if (isQuaternion(rotation)) {
        objectToUse.rotation.setFromQuaternion(rotation);
      } else if (rotation.length === 3 || rotation.length === 4) {
        objectToUse.rotation.set(
            rotation[0],
            rotation[1],
            rotation[2],
            rotation[3]
        );
      } else {
        throw new Error("invalid rotation: expected Euler or EulerTuple");
      }

      objectToUse.updateMatrixWorld();
    }

    if (!objectToUse) {
      throw new Error("useRigidBody ref does not contain a object");
    }

    const meshToUse = mesh ? mesh : objectToUse;

    addRigidBody(
      bodyUUID,
      objectToUse,
      {
        meshToUse,
        shapeConfig: {
          type: shapeType,
          ...shapeConfig,
        },
      },
      {
        type: bodyType,
        ...rest,
      }
    );

    return () => {
      removeRigidBody(bodyUUID);
    };
  }, []);

  return [ref, createRigidBodyApi(physicsContext, bodyUUID)];
}

/**
 * @deprecated use useRigidBody instead
 */
export const usePhysics = useRigidBody;
