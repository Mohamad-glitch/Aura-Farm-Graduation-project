import { playerMovement} from './utils/playerMovment.js';
import { playerShooting } from './utils/playerShooting.js';
// import {treeAnimation} from '../scripts/utils/loading_animation.js';

document.addEventListener('DOMContentLoaded', () => {
    // treeAnimation();
    playerMovement();
    playerShooting();
});
