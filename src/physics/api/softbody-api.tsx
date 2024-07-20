import { AmmoPhysicsContext } from "../physics-context";
import { UUID } from "../../three-ammo/lib/types";
import { Quaternion, Vector3 } from "three";
import { SoftBodyConfig } from "../../three-ammo/lib/types";

export interface SoftbodyApi {
  // setLinearVelocity(velocity: Vector3): void;
  //
  // applyImpulse(impulse: Vector3, relativeOffset?: Vector3): void;
  applyForce(force: Vector3, relativeOffset?: Vector3): void;
  removeAnchors(): void;
  updateConfig(options: SoftBodyConfig): void;
}

export function createSoftbodyApi(
  physicsContext: AmmoPhysicsContext,
  bodyUUID: UUID
) {
  return {
    // setLinearVelocity(velocity: Vector3) {
    //   physicsContext.bodySetLinearVelocity(bodyUUID, velocity);
    // },
    //
    // applyImpulse(impulse: Vector3, relativeOffset?: Vector3) {
    //   physicsContext.bodyApplyImpulse(bodyUUID, impulse, relativeOffset);
    // },
    //
    applyForce(force: Vector3, relativeOffset?: Vector3, nodeIndex?: Number) {
      // console.log("applying force");
      physicsContext.bodyApplyForce(bodyUUID, force, relativeOffset, nodeIndex);
    },
    removeAnchors() {
      // console.log("applying force");
      physicsContext.removeSoftBodyAnchors(bodyUUID);
    },
    updateConfig(options: SoftBodyConfig) {
      // console.log("applying force");
      physicsContext.updateSoftBodyConfig(bodyUUID, options);
    },
  };
}
