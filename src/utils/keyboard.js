export const addKeybinding = (...valuesToLog) => {
    // ctrl for position and shift for scale
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case "ArrowUp": {
                    offsetY += 10;
                    break;
                }
                case "ArrowDown": {
                    offsetY -= 10;
                    break;
                }
                case "ArrowRight": {
                    offsetX -= 10;
                    break;
                }
                case "ArrowLeft": {
                    offsetX += 10;
                    break;
                }
            }
        } else if (e.shiftKey) {
            switch (e.key) {
                case "ArrowUp": {
                    pivot.scale.x += 0.01;
                    pivot.scale.y += 0.01;
                    break;
                }
                case "ArrowDown": {
                    pivot.scale.x -= 0.01;
                    pivot.scale.y -= 0.01;
                    break;
                }

            }
        } else if (e.key == "c") {
            for (let val of valuesToLog) {
                console.log(val);
            }
        }
    });
}