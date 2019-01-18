export async function loadMesh(path, mtl, obj) {
    let onProgress = function(name) {
        return function(xhr) {
            if (xhr.lengthComputable) {
                let percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log(
                    `${name} ${Math.round(percentComplete, 2)} % downloaded`
                );
            }
        };
    };

    return new Promise((resolve, reject) => {
        new THREE.MTLLoader().setPath(path).load(
            mtl,
            function(materials) {
                materials.preload();

                new THREE.OBJLoader()
                    .setMaterials(materials)
                    .setPath(path)
                    .load(
                        obj,
                        function(object) {
                            resolve({ materials, object });
                        },
                        onProgress(obj),
                        reject
                    );
            },
            onProgress(mtl),
            reject
        );
    });
}
