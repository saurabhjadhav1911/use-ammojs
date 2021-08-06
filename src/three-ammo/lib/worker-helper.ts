import { Matrix4 } from "three";
import { iterateGeometries } from "three-to-ammo";
import AmmoWorker from "web-worker:../worker/ammo.worker";
import { MessageType, SoftBodyConfig, UUID } from "./types";
import {
  CompatibleBuffer,
  isSharedArrayBufferSupported,
} from "../../utils/utils";

export function createAmmoWorker(): Worker {
  return new AmmoWorker();
}

export function WorkerHelpers(ammoWorker: Worker) {
  const transform = new Matrix4();
  const inverse = new Matrix4();

  return {
    transferData(objectMatricesFloatArray: Float32Array) {
      ammoWorker.postMessage(
        { type: MessageType.TRANSFER_DATA, objectMatricesFloatArray },
        [objectMatricesFloatArray.buffer]
      );
    },

    addRigidBody(uuid, mesh, options = {}) {
      inverse.copy(mesh.parent.matrixWorld).invert();
      transform.multiplyMatrices(inverse, mesh.matrixWorld);
      ammoWorker.postMessage({
        type: MessageType.ADD_RIGIDBODY,
        uuid,
        matrix: transform.elements,
        options,
      });
    },

    updateRigidBody(uuid, options) {
      ammoWorker.postMessage({
        type: MessageType.UPDATE_RIGIDBODY,
        uuid,
        options,
      });
    },

    removeRigidBody(uuid) {
      ammoWorker.postMessage({
        type: MessageType.REMOVE_RIGIDBODY,
        uuid,
      });
    },

    addSoftBody(uuid: UUID, buffer: CompatibleBuffer, options: SoftBodyConfig) {
      if (isSharedArrayBufferSupported) {
        ammoWorker.postMessage({
          type: MessageType.ADD_SOFTBODY,
          uuid,
          sharedArrayBuffer: buffer,
        });
      } else {
        ammoWorker.postMessage(
          {
            type: MessageType.ADD_SOFTBODY,
            uuid,
            arrayBuffer: buffer,
          },
          [buffer]
        );
      }
    },

    removeSoftBody(uuid: UUID) {
      ammoWorker.postMessage({
        type: MessageType.REMOVE_SOFTBODY,
        uuid,
      });
    },

    addShapes(bodyUuid, shapesUuid, mesh, options = {}) {
      if (mesh) {
        inverse.copy(mesh.parent.matrix).invert();
        transform.multiplyMatrices(inverse, mesh.parent.matrix);
        const vertices: any[] = [];
        const matrices: any[] = [];
        const indexes: any[] = [];

        mesh.updateMatrixWorld(true);
        iterateGeometries(mesh, options, (vertexArray, matrix, index) => {
          vertices.push(vertexArray);
          matrices.push(matrix);
          indexes.push(index);
        });

        ammoWorker.postMessage({
          type: MessageType.ADD_SHAPES,
          bodyUuid,
          shapesUuid,
          vertices,
          matrices,
          indexes,
          matrixWorld: mesh.matrixWorld.elements,
          options,
        });
      } else {
        ammoWorker.postMessage({
          type: MessageType.ADD_SHAPES,
          bodyUuid,
          shapesUuid,
          options,
        });
      }
    },

    bodySetShapesOffset(bodyUuid, offset) {
      ammoWorker.postMessage({
        type: MessageType.SET_SHAPES_OFFSET,
        bodyUuid,
        offset,
      });
    },

    removeShapes(bodyUuid, shapesUuid) {
      ammoWorker.postMessage({
        type: MessageType.REMOVE_SHAPES,
        bodyUuid,
        shapesUuid,
      });
    },

    addConstraint(constraintId, bodyUuid, targetUuid, options = {}) {
      ammoWorker.postMessage({
        type: MessageType.ADD_CONSTRAINT,
        constraintId,
        bodyUuid,
        targetUuid,
        options,
      });
    },

    removeConstraint(constraintId) {
      ammoWorker.postMessage({
        type: MessageType.REMOVE_CONSTRAINT,
        constraintId,
      });
    },

    enableDebug(enable, debugSharedArrayBuffer) {
      ammoWorker.postMessage({
        type: MessageType.ENABLE_DEBUG,
        enable,
        debugSharedArrayBuffer,
      });
    },

    resetDynamicBody(uuid) {
      ammoWorker.postMessage({
        type: MessageType.RESET_DYNAMIC_BODY,
        uuid,
      });
    },

    activateBody(uuid) {
      ammoWorker.postMessage({
        type: MessageType.ACTIVATE_BODY,
        uuid,
      });
    },

    bodySetMotionState(uuid, position, rotation) {
      ammoWorker.postMessage({
        type: MessageType.SET_MOTION_STATE,
        uuid,
        position,
        rotation,
      });
    },

    bodySetLinearVelocity(uuid, velocity) {
      ammoWorker.postMessage({
        type: MessageType.SET_LINEAR_VELOCITY,
        uuid,
        velocity,
      });
    },

    bodyApplyImpulse(uuid, impulse, relativeOffset) {
      if (!relativeOffset) {
        ammoWorker.postMessage({
          type: MessageType.APPLY_CENTRAL_IMPULSE,
          uuid,
          impulse,
        });
      } else {
        ammoWorker.postMessage({
          type: MessageType.APPLY_IMPULSE,
          uuid,
          impulse,
          relativeOffset,
        });
      }
    },

    bodyApplyForce(uuid, force, relativeOffset) {
      if (!relativeOffset) {
        ammoWorker.postMessage({
          type: MessageType.APPLY_CENTRAL_FORCE,
          uuid,
          force,
        });
      } else {
        ammoWorker.postMessage({
          type: MessageType.APPLY_FORCE,
          uuid,
          force,
          relativeOffset,
        });
      }
    },
  };
}
