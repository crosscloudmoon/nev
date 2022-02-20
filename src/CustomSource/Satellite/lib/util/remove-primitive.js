/* global Cesium */
const defined = Cesium.defined;

export default function removePrimitive(entity, hash, primitives) {
    let data = hash[entity.id];
    if (defined(data)) {
        let primitive = data.primitive;
        primitives.remove(primitive);
        if (!primitive.isDestroyed()) {
            primitive.destroy();
        }
        delete hash[entity.id];
    }
}
