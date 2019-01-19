/**
 * Tween the camera to a given position and rotation.  Duration and easing are optional.
 */
export default function tweenCamera(camera, {
    position,
    rotation,
    duration = 2000,
    easing = TWEEN.Easing.Quartic.Out
}) {
    return new Promise((resolve, reject) => {
        // TODO show other title state stuff like text, logo, etc.

        // tween to camera position
        new TWEEN.Tween(camera.rotation) // Create a new tween that modifies 'coords'.
            .to(rotation, duration) // Move to (300, 200) in 1 second.
            .easing(easing) // Use an easing function to make the animation smooth.
            .start(); // Start the tween immediately.
        new TWEEN.Tween(camera.position) // Create a new tween that modifies 'coords'.
            .to(position, duration) // Move to (300, 200) in 1 second.
            .easing(easing) // Use an easing function to make the animation smooth.
            .onComplete(resolve)
            .start(); // Start the tween immediately.
    });
}

