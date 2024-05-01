import { MathUtils, Mesh } from "three";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { useAmmoPhysicsContext } from "../physics-context";
import { SoftBodyAnchorRef, SoftBodyConfig } from "../../three-ammo/lib/types";
import { createSoftbodyApi, SoftbodyApi } from "../api/softbody-api";
import { isSoftBodyRigidBodyAnchorRef } from "../../three-ammo/worker/utils";

type UseSoftBodyOptions = Omit<SoftBodyConfig, "anchors"> & {
  anchors?: SoftBodyAnchorRef[];
};

export function useSoftBody<T extends Mesh = Mesh>(
  options: UseSoftBodyOptions | (() => UseSoftBodyOptions),
  mesh?: T
): [RefObject<T>, SoftbodyApi] {
  const ref = useRef<T>(null);

  const physicsContext = useAmmoPhysicsContext();
  const { addSoftBody, removeSoftBody } = physicsContext;

  const [bodyUUID] = useState(() => MathUtils.generateUUID());

  useEffect(() => {
    const meshToUse = mesh ? mesh : ref.current!;

    if (typeof options === "function") {
      options = options();
    }

    const { anchors, ...rest } = options;

    if (!meshToUse) {
      throw new Error("useSoftBody ref does not contain a mesh");
    }

    addSoftBody(bodyUUID, meshToUse, {
      anchors:
        anchors &&
        anchors.map((anchor) => {
          if (isSoftBodyRigidBodyAnchorRef(anchor)) {
            const { rigidBodyRef, ...anchorProps } = anchor;

            return {
              ...anchorProps,
              rigidBodyUUID:
                anchor.rigidBodyRef.current?.userData?.useAmmo?.rigidBody?.uuid,
            };
          }
          return anchor;
        }),
      ...rest,
    });

    return () => {
      removeSoftBody(bodyUUID);
    };
  }, []);

  return [ref, createSoftbodyApi(physicsContext, bodyUUID)];
}
