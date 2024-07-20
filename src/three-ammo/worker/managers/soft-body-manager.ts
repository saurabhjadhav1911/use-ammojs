import {
  ClientMessageType,
  MessageType,
  SharedBuffers,
  SharedSoftBodyBuffers,
  SoftBodyConfig,
  UUID,
  BodyActivationState,
} from "../../lib/types";
import { SoftBody } from "../wrappers/soft-body";
import { usingSharedArrayBuffer, world ,vector3Tmp1} from "./world-manager";


const softbodies: Record<UUID, SoftBody> = {};

export const ptrToSoftBody: Record<number, UUID> = {};
// export let vector3Tmp1: Ammo.btVector3;
// export let vector3Tmp2: Ammo.btVector3;

function addSoftbody({
  uuid,
  sharedSoftBodyBuffers,
  softBodyConfig,
}: {
  uuid: UUID;
  sharedSoftBodyBuffers: SharedSoftBodyBuffers;
  softBodyConfig: SoftBodyConfig;
}) {
  softbodies[uuid] = new SoftBody(world, sharedSoftBodyBuffers, softBodyConfig);

  ptrToSoftBody[Ammo.getPointer(softbodies[uuid].physicsBody)] = uuid;

  if (usingSharedArrayBuffer) {
    postMessage({
      type: ClientMessageType.SOFTBODY_READY,
      uuid,
      sharedSoftBodyBuffers,
    });
  } else {
    postMessage(
      { type: ClientMessageType.SOFTBODY_READY, uuid, sharedSoftBodyBuffers },
      [sharedSoftBodyBuffers.vertexFloatArray.buffer]
    );
  }
}

function removeSoftbody({ uuid }: { uuid: UUID }) {
  if (softbodies[uuid]) {
    delete ptrToSoftBody[Ammo.getPointer(softbodies[uuid].physicsBody)];

    softbodies[uuid].destroy();

    delete softbodies[uuid];
  }
}

export function updateSoftBodyBuffers(sharedBuffers: SharedBuffers) {
  for (const ssbb of sharedBuffers.softBodies) {
    if (softbodies[ssbb.uuid]) {
      softbodies[ssbb.uuid].buffers = ssbb;
    }
  }
}

function softBodyApplyForce({ uuid, force, relativeOffset,nodeIndex }) {
  const body = softbodies[uuid];
  // console.log('softBodyApplyForce',body.physicsBody,vector3Tmp1)
  if (body) {
    // console.log('if body',body.physicsBody,vector3Tmp1)
    vector3Tmp1.setValue(force.x, force.y, force.z);
    // vector3Tmp2.setValue(relativeOffset.x, relativeOffset.y, relativeOffset.z);
    body.physicsBody!.addForce(vector3Tmp1, nodeIndex);
    body.physicsBody!.activate(true);
  }
}


function removeSoftbodyAnchors({ uuid }) {
  const body = softbodies[uuid];
  body.removeAnchors();

}

function updateSoftBodyConfig({ uuid, options}: {uuid:UUID, options: SoftBodyConfig})  {
  console.log('updating config');
  const body = softbodies[uuid];
  let activationState = BodyActivationState.DISABLE_DEACTIVATION
  body.updateConfig({ ...options ,activationState });

}

export function copyToSoftBodyBuffers() {
  for (const softBody of Object.values(softbodies)) {
    softBody.copyStateToBuffer();
  }
}

export const softBodyEventReceivers = {
  [MessageType.ADD_SOFTBODY]: addSoftbody,
  [MessageType.REMOVE_SOFTBODY]: removeSoftbody,
  [MessageType.REMOVE_SOFTBODY_ANCHORS]: removeSoftbodyAnchors,
  [MessageType.UPDATE_SOFTBODY_CONFIG]: updateSoftBodyConfig,  
  [MessageType.APPLY_FORCE]: softBodyApplyForce,

};
