let x = 100;
let y = 100; // starting position
const player = document.getElementById('player');
const step = 5; // pixels
const keysPressed = {}; // recording multiple keys pressed
const rotate = 4; // degrees
let angle = 0; // around 240 degree to make it look the other way
// const ball = document.getElementById('ball');

export function playerMovement() {
    // player starting position
    player.style.position = 'absolute';
    player.style.left = `${x}px`;  
    player.style.top = `${y}px`;   
    
        // keydown events
        document.addEventListener('keydown', function (e) {
            if (['a', 'w', 'd', 's', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                keysPressed[e.key] = true;
                e.preventDefault(); // Prevent default scrolling behavior
            }
        });

        // Track keyup events
        document.addEventListener('keyup', function (e) {
            if (['a', 'w', 'd', 's', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                keysPressed[e.key] = false;
            }
        });

        // Animation loop for smooth movement
        function gameLoop() {
            let moveX = 0;
            let moveY = 0;

            // Calculate movement based on currently pressed keys
            if (keysPressed['a']) moveX -= step;
            if (keysPressed['d']) moveX += step;
            if (keysPressed['w']) moveY -= step;
            if (keysPressed['s']) moveY += step;
            if (keysPressed['ArrowLeft'])  angle -= rotate; 
            if (keysPressed['ArrowRight'])  angle += rotate;


            // Apply movement if any key is pressed
            if (moveX !== 0 || moveY !== 0 || keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {

                const container = document.getElementById('game-container');
                const rect = container.getBoundingClientRect();
                const header = document.querySelector('.header');
                const headerHeight = header.offsetHeight - 35;

                const newX = Math.max(0, Math.min(rect.width - player.offsetWidth, x + moveX));
                const newY = Math.max(headerHeight, Math.min(rect.height - player.offsetHeight, y + moveY));
                // update if position changed
                if (newX !== x || newY !== y || keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {
                    x = newX;
                    y = newY;
                    updatePosition();
                }
            }
            requestAnimationFrame(gameLoop);
        }

        gameLoop(); 
}

function updatePosition() {
    player.style.left = `${x}px`;
    player.style.top = `${y}px`;
    player.style.transform = `rotate(${angle}deg)`;


//     // const ballRect = ball.getBoundingClientRect();
//     // const playerRect = player.getBoundingClientRect();
//     // console.log(playerRect);
//     // console.log(ballRect);

//     let center = {
//     x: (window.innerWidth / 2),
//     y: (window.innerHeight / 2)
//     };
//     const playerRect = player.getBoundingClientRect();
//     let playerCenter = {
//         x: playerRect.left + (playerRect.width / 2),
//         y: playerRect.top + (playerRect.height / 2)
//     };
//     // console.log(center, center.x, center.y);

//     const angleRad = Math.atan2(center.y - (playerCenter.y), center.x - (playerCenter.x));
//     const angleDeg = angleRad * (180 / Math.PI);
//     // console.log(angleDeg);
//     player.style.transform = `rotate(${angleDeg}deg)`;
}

export function getPlayerPosition() {
    return { x, y };
}
export function getPlayerAngle() {
    return angle;
}