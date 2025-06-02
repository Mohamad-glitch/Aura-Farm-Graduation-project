import { getPlayerPosition, getPlayerAngle } from './playerMovment.js';

export function playerShooting() {
    setInterval(() => {
        const player = document.getElementById('player');
        const container = document.getElementById('game-container');
        const { x, y } = getPlayerPosition();

        const centerX = x +  (player.offsetWidth / 2);
        const centerY = y + (player.offsetHeight / 2);   

        // Get angle of player and convert to radians
        const angleDeg = getPlayerAngle() + 135;
        const angle = (angleDeg ) * Math.PI / 180;

        // Create bullet
        const bullet = document.createElement('div');
        bullet.className = 'bullet';

        // Animate bullet
        const speed = 8;
        let bx = centerX - 8;
        let by = centerY - 8;

        function moveBullet() {
            bx += Math.cos(angle) * speed;
            by += Math.sin(angle) * speed;
            bullet.style.left = bx + 'px';
            bullet.style.top = by + 'px';

            // Remove bullet if out of bounds
            if (
                bx < 0 || bx > container.offsetWidth ||
                by < 0 || by > container.offsetHeight
            ) {
                bullet.remove();
            } else {
                requestAnimationFrame(moveBullet);
            }
        }

        container.appendChild(bullet);
        moveBullet();
    }, 500);
}