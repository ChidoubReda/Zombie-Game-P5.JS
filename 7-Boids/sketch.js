// Zombie Swarm Survival Game
// Based on flocking AI behaviors (boids)
// Player must survive zombies, collect resources, and reach safe zones

// Game entities
let player;
let zombies = [];
let missiles = []; // Tableau pour gérer les missiles
let obstacles = [];
let resources = [];
let safeZones = [];

// Camera
let cameraPos;

// Game state
let gameState = "playing"; // "playing", "won", "lost"
let safeZonesActivated = 0;
let totalSafeZones = 3;
let currentLevel = 1; // Niveau actuel du jeu
let zombiesKilled = 0; // Nombre de zombies tués

// World bounds (infinite scrolling world)
let worldSize = 4000;

// Frame counter for spawning
let lastZombieSpawn = 0;
let zombieSpawnInterval = 1800; // 30 seconds at 60fps

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);

  // Initialize player at world center
  player = new Player(0, 0);
  cameraPos = createVector(0, 0);

  // Generate obstacles (scattered debris/ruins)
  for (let i = 0; i < 100; i++) {
    let x = random(-worldSize/2, worldSize/2);
    let y = random(-worldSize/2, worldSize/2);
    let r = random(20, 60);
    obstacles.push(new Obstacle(x, y, r, color(60, 60, 70)));
  }

  // Generate initial zombies
  for (let i = 0; i < 15; i++) {
    let x = random(-500, 500);
    let y = random(-500, 500);
    zombies.push(new Zombie(x, y, currentLevel)); // Avec le niveau actuel
  }

  // Generate resources scattered in world
  for (let i = 0; i < 80; i++) {
    let x = random(-worldSize/2, worldSize/2);
    let y = random(-worldSize/2, worldSize/2);
    let type = random() < 0.7 ? "resource" : "medkit";
    resources.push(new Resource(x, y, type));
  }

  // Create safe zones (objectives)
  safeZones.push(new SafeZone(800, 800, 120));
  safeZones.push(new SafeZone(-800, 800, 120));
  safeZones.push(new SafeZone(0, -1000, 120));
}

function draw() {
  if (gameState === "playing") {
    // Update camera to follow player
    cameraPos = player.pos.copy();

    // Update player
    player.update();
    player.checkCollisionWithObstacles(obstacles);
    
    // Apply flashlight force if active
    player.applyFlashlightForce(zombies);

    // Update all zombies
    for (let zombie of zombies) {
      zombie.applyBehaviors(zombies, player, obstacles);
      zombie.update();
    }
    
    // Supprimer les zombies morts
    zombies = zombies.filter(z => {
      if (z.dead) {
        zombiesKilled++;
        return false;
      }
      return true;
    });
    
    // Augmenter le niveau tous les 10 zombies tués
    if (zombiesKilled > 0 && zombiesKilled % 10 === 0) {
      let newLevel = floor(zombiesKilled / 10) + 1;
      if (newLevel > currentLevel) {
        currentLevel = newLevel;
        console.log("🎉 Niveau augmenté à", currentLevel);
      }
    }
    
    // Mettre à jour les missiles
    for (let i = missiles.length - 1; i >= 0; i--) {
      missiles[i].updateMissile();
      
      // Supprimer les missiles qui ont expiré
      if (!missiles[i].isAlive()) {
        missiles.splice(i, 1);
      }
    }
    
    // Vérifier les collisions missile-zombie
    for (let i = missiles.length - 1; i >= 0; i--) {
      let missileHit = false;
      for (let zombie of zombies) {
        if (!zombie.dead && missiles[i].hits(zombie)) {
          zombie.takeDamage(1);
          missileHit = true;
          break;
        }
      }
      if (missileHit) {
        missiles.splice(i, 1);
      }
    }

    // Check collisions: player vs zombies
    for (let zombie of zombies) {
      let d = player.pos.dist(zombie.pos);
      if (d < player.r + zombie.r) {
        // Le zombie est en contact avec le joueur
        zombie.contactTime++;
        
        // Calculer les dégâts basés sur le temps de contact (croissance exponentielle)
        // Plus le zombie reste collé, plus il inflige de dégâts
        let secondsOfContact = zombie.contactTime / 60;
        let damageMultiplier = 1 + secondsOfContact; // +100% par seconde de contact
        
        // Infliger des dégâts toutes les 15 frames (4 fois par seconde)
        if (frameCount - zombie.lastDamageFrame >= 15) {
          let damage = 0.5 * damageMultiplier; // Base de 0.5 point tous les 1/4 seconde
          player.takeDamage(damage);
          zombie.lastDamageFrame = frameCount;
          
          // Debug: afficher les dégâts
          if (frameCount % 60 === 0) {
            console.log(`💀 Zombie dégâts: ${damage.toFixed(2)} (x${damageMultiplier.toFixed(2)} après ${secondsOfContact.toFixed(1)}s)`);
          }
        }
        
        // Effet visuel: faire vibrer le zombie quand il attaque
        if (frameCount % 4 === 0) {
          zombie.pos.x += random(-1, 1);
          zombie.pos.y += random(-1, 1);
        }
        
        // Push zombie away slightly (moins fort maintenant pour qu'il reste collé)
        let push = p5.Vector.sub(zombie.pos, player.pos);
        push.setMag(0.5);
        zombie.pos.add(push);
      } else {
        // Réinitialiser le temps de contact si le zombie n'est plus en contact
        zombie.contactTime = 0;
      }
    }

    // Check resource collection
    for (let resource of resources) {
      resource.checkCollision(player);
    }

    // Update safe zones and check activation
    for (let zone of safeZones) {
      if (zone.update(player, zombies)) {
        safeZonesActivated++;
      }
    }

    // Spawn new zombies periodically
    if (frameCount - lastZombieSpawn > zombieSpawnInterval && zombies.length < 50) {
      spawnZombie();
      lastZombieSpawn = frameCount;
    }

    // Check win/lose conditions
    checkGameState();

    // Render everything
    renderGame();
    
    // Draw UI
    drawUI();
  } else {
  
  // Draw missiles
  for (let missile of missiles) {
    if (isOnScreen(missile.pos, missile.r)) {
      missile.show();
    }
  }
    // Game over screen
    drawGameOver();
  }
}

function renderGame() {
  // Background
  background(26, 31, 30); // Dark apocalyptic color

  // Apply camera transform (world space)
  push();
  translate(-cameraPos.x + width/2, -cameraPos.y + height/2);

  // Draw hexagonal grid background
  drawHexagonalGrid();

  // Draw obstacles (only visible ones)
  for (let obs of obstacles) {
    if (isOnScreen(obs.pos, obs.r)) {
      obs.show();
    }
  }

  // Draw resources
  for (let res of resources) {
    if (!res.collected && isOnScreen(res.pos, res.r)) {
      res.show();
    }
  }

  // Draw safe zones
  for (let zone of safeZones) {
    if (isOnScreen(zone.pos, zone.r)) {
      zone.show();
    }
  }

  // Draw zombies
  for (let zombie of zombies) {
    if (isOnScreen(zombie.pos, zombie.r)) {
      zombie.show();
    }
  }
  
  // Draw missiles
  for (let missile of missiles) {
    if (isOnScreen(missile.pos, missile.r + 50)) {
      missile.show();
    }
  }

  // Draw player
  player.show();

  pop(); // End world space
}

function drawHexagonalGrid() {
  push();
  stroke(100, 120, 100, 20);
  strokeWeight(1);
  noFill();
  
  let hexSize = 80;
  let startX = floor((cameraPos.x - width/2) / hexSize) * hexSize;
  let startY = floor((cameraPos.y - height/2) / hexSize) * hexSize;
  
  for (let x = startX - hexSize; x < cameraPos.x + width/2 + hexSize; x += hexSize * 1.5) {
    for (let y = startY - hexSize; y < cameraPos.y + height/2 + hexSize; y += hexSize * sqrt(3)) {
      let offsetX = (floor((y - startY) / (hexSize * sqrt(3))) % 2) * hexSize * 0.75;
      drawHexagon(x + offsetX, y, hexSize * 0.5);
    }
  }
  pop();
}

function drawHexagon(x, y, size) {
  beginShape();
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i;
    let vx = x + cos(angle) * size;
    let vy = y + sin(angle) * size;
    vertex(vx, vy);
  }
  endShape(CLOSE);
}

function drawUI() {
  push();
  
  // Health bar (top-left)
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Health: ${floor(player.health)}/${player.maxHealth}`, 20, 20);
  
  // Health bar visual
  fill(100, 0, 0);
  rect(20, 45, 150, 16);
  fill(255, 0, 0);
  rect(20, 45, (player.health / player.maxHealth) * 150, 16);
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(20, 45, 150, 16);
  
  // Resources collected
  fill(255, 200, 50);
  noStroke();
  text(`Resources: ${player.resourcesCollected}`, 20, 75);
  
  // Zombie count and level (top-right)
  fill(255);
  textAlign(RIGHT, TOP);
  text(`Zombies: ${zombies.length}`, width - 20, 20);
  text(`Zombies killed: ${zombiesKilled}`, width - 20, 45);
  
  // Afficher le niveau actuel
  fill(255, 200, 0);
  textSize(20);
  text(`Level: ${currentLevel}`, width - 20, 70);
  textSize(16);
  
  // Time survived
  let minutes = floor(frameCount / 3600);
  let seconds = floor((frameCount % 3600) / 60);
  text(`Time: ${minutes}:${nf(seconds, 2)}`, width - 20, 100);
  
  // Safe zones progress
  text(`Safe Zones: ${safeZonesActivated}/${totalSafeZones}`, width - 20, 125);
  
  // Controls (bottom-left)
  textAlign(LEFT, BOTTOM);
  textSize(14);
  fill(255, 200);
  let controlY = height - 120;
  text("WASD / Arrows - Move", 20, controlY);
  text("SHIFT - Sprint", 20, controlY + 20);
  text("CLICK - Shoot missiles", 20, controlY + 40);
  
  if (player.flashlightCooldown <= 0) {
    fill(255, 255, 0);
    text("[SPACE] Flashlight (Ready)", 20, controlY + 60);
  } else {
    fill(255, 100);
    let cooldownSec = ceil(player.flashlightCooldown / 60);
    text(`[SPACE] Flashlight (Cooldown: ${cooldownSec}s)`, 20, controlY + 60);
  }
  
  text("D - Debug mode", 20, controlY + 80);
  
  // Mini-map (bottom-right)
  drawMiniMap();
  
  pop();
}

function drawMiniMap() {
  let mapX = width - 120;
  let mapY = height - 120;
  let mapR = 80;
  
  // Background circle
  fill(20, 30, 30, 200);
  stroke(100);
  strokeWeight(2);
  circle(mapX, mapY, mapR * 2);
  
  // World scale
  let scale = mapR / 1000; // Show 1000 units around player
  
  // Player (center, green)
  fill(50, 255, 50);
  noStroke();
  circle(mapX, mapY, 8);
  
  // Zombies (red dots)
  fill(255, 50, 50);
  for (let zombie of zombies) {
    let relPos = p5.Vector.sub(zombie.pos, player.pos).mult(scale);
    if (relPos.mag() < mapR) {
      circle(mapX + relPos.x, mapY + relPos.y, 4);
    }
  }
  
  // Safe zones (blue circles)
  for (let zone of safeZones) {
    if (zone.activated) {
      fill(50, 255, 50);
    } else {
      fill(50, 150, 255);
    }
    let relPos = p5.Vector.sub(zone.pos, player.pos).mult(scale);
    if (relPos.mag() < mapR) {
      circle(mapX + relPos.x, mapY + relPos.y, 10);
    }
  }
  
  // Resources (yellow dots)
  fill(255, 200, 50);
  let resourceCount = 0;
  for (let res of resources) {
    if (!res.collected && resourceCount < 20) { // Limit to 20 nearest
      let relPos = p5.Vector.sub(res.pos, player.pos).mult(scale);
      if (relPos.mag() < mapR) {
        circle(mapX + relPos.x, mapY + relPos.y, 3);
        resourceCount++;
      }
    }
  }
  
  // Minimap label
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  text("MAP", mapX, mapY + mapR + 15);
}

function drawGameOver() {
  background(0);
  
  push();
  fill(255);
  textAlign(CENTER, CENTER);
  
  if (gameState === "won") {
    textSize(48);
    fill(50, 255, 50);
    text("YOU SURVIVED!", width/2, height/2 - 50);
    
    textSize(24);
    fill(255);
    text(`Resources Collected: ${player.resourcesCollected}`, width/2, height/2 + 20);
    text(`Zombies Defeated: ${zombiesKilled}`, width/2, height/2 + 80);
  } else {
    textSize(48);
    fill(255, 50, 50);
    text("YOU DIED", width/2, height/2 - 50);
    
    textSize(24);
    fill(255);
    text(`Resources Collected: ${player.resourcesCollected}`, width/2, height/2 + 20);
    text(`Zombies Defeated: ${zombiesKilled}: ${player.resourcesCollected}`, width/2, height/2 + 20);
    text(`Zombies Defeated: 0`, width/2, height/2 + 50);
  }
  
  textSize(18);
  fill(200);
  text("Press R to Restart", width/2, height/2 + 100);
  
  pop();
}

function checkGameState() {
  // Lose condition - health depleted
  if (player.health <= 0) {
    gameState = "lost";
  }
  
  // Win condition - all safe zones activated
  if (safeZonesActivated >= totalSafeZones) {
    gameState = "won";
  }
}

function spawnZombie() {
  // Spawn at edge of screen (offscreen)
  let angle = random(TWO_PI);
  let spawnDist = 600; // Distance from player
  let spawnX = player.pos.x + cos(angle) * spawnDist;
  let spawnY = player.pos.y + sin(angle) * spawnDist;
  
  zombies.push(new Zombie(spawnX, spawnY, currentLevel)); // Avec le niveau actuel
}

function isOnScreen(worldPos, radius = 0) {
  let screenX = worldPos.x - cameraPos.x + width/2;
  let screenY = worldPos.y - cameraPos.y + height/2;
  
  return screenX > -radius - 100 && screenX < width + radius + 100 &&
         screenY > -radius - 100 && screenY < height + radius + 100;
}

function keyPressed() {
  if (key === ' ') {
    console.log("🎮 SPACE pressed! gameState:", gameState);
    // Flashlight
    if (gameState === "playing") {
      player.useFlashlight(zombies);
    }
  } else if (key === 'd' || key === 'D') {
    // Toggle debug mode
    Vehicle.debug = !Vehicle.debug;
  } else if (key === 'r' || key === 'R') {
    // Restart game
    if (gameState !== "playing") {
      restartGame();
    }
  }
}

// Gestion du clic de souris pour tirer
function mousePressed() {
  if (gameState === "playing") {
    let newMissiles = player.shoot(zombies);
    missiles.push(...newMissiles);
  }
}

function restartGame() {
  // Reset all game state
  player = new Player(0, 0);
  zombies = [];
  missiles = [];
  resources = [];
  safeZones = [];
  gameState = "playing";
  safeZonesActivated = 0;
  lastZombieSpawn = 0;
  currentLevel = 1;
  zombiesKilled = 0;
  
  // Regenerate world
  for (let i = 0; i < 15; i++) {
    let x = random(-500, 500);
    let y = random(-500, 500);
    zombies.push(new Zombie(x, y, currentLevel));
  }
  
  for (let i = 0; i < 80; i++) {
    let x = random(-worldSize/2, worldSize/2);
    let y = random(-worldSize/2, worldSize/2);
    let type = random() < 0.7 ? "resource" : "medkit";
    resources.push(new Resource(x, y, type));
  }
  
  safeZones.push(new SafeZone(800, 800, 120));
  safeZones.push(new SafeZone(-800, 800, 120));
  safeZones.push(new SafeZone(0, -1000, 120));
  
  loop(); // Resume game loop
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}