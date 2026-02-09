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
let gameState = "playing"; // "playing", "won", "lost", "paused"
let safeZonesActivated = 0;
let totalSafeZones = 3;
let currentLevel = 1; // Niveau actuel du jeu
let zombiesKilled = 0; // Nombre de zombies tués
let explosions = []; // Effets d'explosion visuels
let lastBossSpawn = 0; // Dernier spawn de boss
let bossSpawnInterval = 1800; // 30 secondes

// Game stats
let totalDamageTaken = 0;
let totalShotsFired = 0;
let startTime = 0;

// Particle system
let particleSystem;
let sprintTrail = []; // Traînée de particules du sprint

// Screen effects
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
let lastScreenShake = 0; // Dernier tremblement d'écran
let screenShakeCooldown = 120; // 2 secondes à 60 FPS
let chromaticAberration = 0; // Intensité de l'effet chromatique
let slowMotionActive = false;
let normalFrameRate = 60;

// World bounds (infinite scrolling world)
let worldSize = 4000;
let maxZombieDistance = 1500; // Distance max avant respawn automatique

// Frame counter for spawning
let lastZombieSpawn = 0;
let zombieSpawnInterval = 1800; // 30 seconds at 60fps
let baseZombieSpawnInterval = 1800; // Intervalle de base
let lastResourceSpawn = 0;
let resourceSpawnInterval = 2400; // 40 seconds
let baseResourceSpawnInterval = 2400;

// Système de difficulté adaptative
let difficultyLevel = 1.0; // 1.0 = normal, <1 = plus facile, >1 = plus dur
let performanceScore = 0; // Score de performance du joueur
let lastPerformanceCheck = 0;
let performanceCheckInterval = 300; // Vérifier toutes les 5 secondes

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(normalFrameRate);
  startTime = millis(); // Initialiser le temps de départ

  // Initialize particle system
  particleSystem = new ParticleSystem();
  
  // Initialize start time
  startTime = millis();

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

  // Generate initial zombies with varied types
  for (let i = 0; i < 15; i++) {
    let x = random(-500, 500);
    let y = random(-500, 500);
    let rand = random();
    let type = "normal";
    if (rand < 0.3) type = "fast";
    else if (rand < 0.5) type = "tank";
    else if (rand < 0.6) type = "explosive";
    zombies.push(new Zombie(x, y, currentLevel, type));
  }

  // Generate resources scattered in world
  for (let i = 0; i < 80; i++) {
    let x = random(-worldSize/2, worldSize/2);
    let y = random(-worldSize/2, worldSize/2);
    let rand = random();
    let type;
    if (rand < 0.5) type = "resource";
    else if (rand < 0.7) type = "medkit";
    else type = "ammo"; // 30% de munitions
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
    
    // Supprimer les zombies morts et gérer les effets
    zombies = zombies.filter(z => {
      if (z.dead) {
        zombiesKilled++;
        
        // Créer particules de sang selon le type
        let particleColor;
        switch(z.type) {
          case "fast": particleColor = color(100, 200, 100); break;
          case "tank": particleColor = color(80, 80, 120); break;
          case "explosive": particleColor = color(255, 150, 50); break;
          case "boss": particleColor = color(200, 100, 200); break;
          default: particleColor = color(100, 150, 100);
        }
        // Particules réduites pour performance (optimisé)
        let particleCount = z.type === "boss" ? 30 : (z.type === "tank" ? 20 : 15);
        particleSystem.createBloodSplatter(z.pos.x, z.pos.y, particleColor, particleCount);
        
        // Gérer l'effet de mort (explosion, etc.)
        let deathEffect = z.onDeath(player, zombies);
        if (deathEffect && deathEffect.explosion) {
          explosions.push({
            pos: deathEffect.pos,
            radius: deathEffect.radius,
            frame: frameCount,
            maxFrames: 30
          });
          // Screen shake pour explosion - utiliser le cooldown global
          if (frameCount - lastScreenShake >= screenShakeCooldown) {
            screenShake.intensity = 15;
            screenShake.duration = 20;
            lastScreenShake = frameCount;
          }
        }
        
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
    
    // Gérer les zombies trop éloignés du joueur
    for (let zombie of zombies) {
      let distToPlayer = zombie.pos.dist(player.pos);
      
      // Si le zombie est trop loin, le respawn plus près
      if (distToPlayer > maxZombieDistance) {
        // Respawn dans un rayon de 400-700px autour du joueur
        let angle = random(TWO_PI);
        let spawnDist = random(400, 700);
        zombie.pos.x = player.pos.x + cos(angle) * spawnDist;
        zombie.pos.y = player.pos.y + sin(angle) * spawnDist;
        zombie.vel.mult(0); // Réinitialiser la vélocité
      }
      // Si le zombie est assez loin (>800px), ajouter une force d'attraction légère
      else if (distToPlayer > 800) {
        let pullForce = p5.Vector.sub(player.pos, zombie.pos);
        pullForce.setMag(0.05); // Force très subtile
        zombie.applyForce(pullForce);
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
        
        // Dégâts de base selon le type de zombie
        let baseDamage;
        let attackFrequency = 15; // Frames entre attaques (4x par seconde par défaut)
        
        switch(zombie.type) {
          case "fast":
            baseDamage = 0.3; // Rapide mais faible
            attackFrequency = 12; // Attaque plus vite (5x par seconde)
            break;
          case "tank":
            baseDamage = 1.2; // Très fort
            attackFrequency = 20; // Attaque plus lentement (3x par seconde)
            break;
          case "explosive":
            baseDamage = 0.4; // Dégâts modérés en contact
            attackFrequency = 15;
            break;
          case "boss":
            baseDamage = 2.0; // Dégâts massifs
            attackFrequency = 18; // Attaque assez vite mais pas trop
            break;
          default: // normal
            baseDamage = 0.5;
            attackFrequency = 15;
        }
        
        // Infliger des dégâts selon la fréquence d'attaque du type
        if (frameCount - zombie.lastDamageFrame >= attackFrequency) {
          let damage = baseDamage * damageMultiplier;
          player.takeDamage(damage);
          totalDamageTaken += damage;
          zombie.lastDamageFrame = frameCount;
          
          // Screen shake uniquement toutes les 2 secondes (cooldown global)
          if (frameCount - lastScreenShake >= screenShakeCooldown) {
            let shakeIntensity = zombie.type === "boss" ? 15 : (zombie.type === "tank" ? 10 : 5);
            screenShake.intensity = shakeIntensity + damage;
            screenShake.duration = zombie.type === "boss" ? 15 : 10;
            lastScreenShake = frameCount;
          }
        }
        
        // Push zombie away slightly - réduit pour éviter bugs
        // Seulement toutes les 5 frames pour performance
        if (frameCount % 5 === 0) {
          let push = p5.Vector.sub(zombie.pos, player.pos);
          push.setMag(0.3);
          zombie.pos.add(push);
        }
      } else {
        // Réinitialiser le temps de contact si le zombie n'est plus en contact
        zombie.contactTime = 0;
      }
    }

    // Update and check resource collection
    for (let resource of resources) {
      resource.updateMovement(player);
      resource.checkCollision(player);
    }

    // Update safe zones and check activation
    for (let zone of safeZones) {
      if (zone.update(player, zombies)) {
        safeZonesActivated++;
      }
    }

    // Mettre à jour la difficulté adaptative
    updateAdaptiveDifficulty();
    
    // Spawn new zombies periodically (avec difficulté adaptée)
    let maxZombies = floor(50 * difficultyLevel); // Plus de zombies si performant
    if (frameCount - lastZombieSpawn > zombieSpawnInterval && zombies.length < maxZombies) {
      spawnZombie();
      lastZombieSpawn = frameCount;
    }
    
    // Spawn ressources adaptatives (plus si le joueur galère)
    if (frameCount - lastResourceSpawn > resourceSpawnInterval) {
      spawnAdaptiveResource();
      lastResourceSpawn = frameCount;
    }
    
    // Spawn boss periodically
    if (frameCount - lastBossSpawn > bossSpawnInterval && currentLevel >= 2) {
      spawnBoss();
      lastBossSpawn = frameCount;
    }
    
    // Update explosions (limiter à 10 max pour performance)
    for (let i = explosions.length - 1; i >= 0; i--) {
      if (frameCount - explosions[i].frame > explosions[i].maxFrames) {
        explosions.splice(i, 1);
      }
    }
    // Supprimer les explosions les plus anciennes si trop nombreuses
    while (explosions.length > 10) {
      explosions.shift();
    }
    
    // Update particle system
    particleSystem.update();
    
    // Update sprint trail
    if (player.isSprinting && frameCount % 3 === 0) {
      sprintTrail.push({
        pos: player.pos.copy(),
        life: 30,
        maxLife: 30
      });
    }
    for (let i = sprintTrail.length - 1; i >= 0; i--) {
      sprintTrail[i].life--;
      if (sprintTrail[i].life <= 0) {
        sprintTrail.splice(i, 1);
      }
    }
    // Limiter la traînée
    while (sprintTrail.length > 50) {
      sprintTrail.shift();
    }
    
    // Update screen shake
    if (screenShake.duration > 0) {
      screenShake.x = random(-screenShake.intensity, screenShake.intensity);
      screenShake.y = random(-screenShake.intensity, screenShake.intensity);
      screenShake.duration--;
      screenShake.intensity *= 0.9; // Décroissance
    } else {
      screenShake.x = 0;
      screenShake.y = 0;
      screenShake.intensity = 0;
    }
    
    // Update chromatic aberration based on health
    chromaticAberration = map(player.health, 0, player.maxHealth, 8, 0);
    chromaticAberration = constrain(chromaticAberration, 0, 8);
    
    // Slow motion when low health
    if (player.health < player.maxHealth * 0.3 && !slowMotionActive) {
      slowMotionActive = true;
      frameRate(30); // Ralentir à 30 fps
    } else if (player.health >= player.maxHealth * 0.3 && slowMotionActive) {
      slowMotionActive = false;
      frameRate(normalFrameRate);
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

  // Apply camera transform (world space) with screen shake
  push();
  translate(-cameraPos.x + width/2 + screenShake.x, -cameraPos.y + height/2 + screenShake.y);

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
  
  // Draw explosions
  for (let explosion of explosions) {
    let progress = (frameCount - explosion.frame) / explosion.maxFrames;
    let currentRadius = explosion.radius * (1 + progress * 2);
    let alpha = 255 * (1 - progress);
    
    // Cercle extérieur
    noFill();
    stroke(255, 150, 0, alpha);
    strokeWeight(4);
    circle(explosion.pos.x, explosion.pos.y, currentRadius * 2);
    
    // Cercle intérieur
    fill(255, 100, 0, alpha * 0.5);
    noStroke();
    circle(explosion.pos.x, explosion.pos.y, currentRadius);
  }
  
  // Draw particles
  particleSystem.show();
  
  // Draw sprint trail
  for (let trail of sprintTrail) {
    let alpha = map(trail.life, 0, trail.maxLife, 0, 150);
    fill(100, 255, 255, alpha);
    noStroke();
    let size = map(trail.life, 0, trail.maxLife, 2, 8);
    circle(trail.pos.x, trail.pos.y, size);
  }
  
  // Draw player aura based on health
  drawPlayerAura();

  // Draw player
  player.show();

  pop(); // End world space
  
  // Chromatic aberration effect when hurt (skip if too many particles for performance)
  if (chromaticAberration > 0.5 && particleSystem.particles.length < 200) {
    drawChromaticAberration();
  }
}

// Effet d'aberration chromatique
function drawChromaticAberration() {
  loadPixels();
  let offset = Math.floor(chromaticAberration);
  
  // Copier les pixels actuels
  let tempPixels = [...pixels];
  
  // Appliquer le décalage RGB
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (x + y * width) * 4;
      
      // Rouge décalé à gauche
      let redIndex = ((x - offset) + y * width) * 4;
      if (redIndex >= 0 && redIndex < tempPixels.length) {
        pixels[index] = tempPixels[redIndex];
      }
      
      // Vert reste en place
      pixels[index + 1] = tempPixels[index + 1];
      
      // Bleu décalé à droite
      let blueIndex = ((x + offset) + y * width) * 4;
      if (blueIndex >= 0 && blueIndex < tempPixels.length) {
        pixels[index + 2] = tempPixels[blueIndex + 2];
      }
    }
  }
  
  updatePixels();
}

function drawPlayerAura() {
  // Aura visuelle selon la vie du joueur
  let healthRatio = player.health / player.maxHealth;
  let auraColor;
  let auraSize;
  
  if (healthRatio > 0.7) {
    // Santé élevée - Vert
    auraColor = color(100, 255, 100, 80);
    auraSize = 1.3;
  } else if (healthRatio > 0.4) {
    // Santé moyenne - Jaune
    auraColor = color(255, 255, 100, 100);
    auraSize = 1.5;
  } else {
    // Santé faible - Rouge pulsant
    let pulse = sin(frameCount * 0.3) * 50 + 150;
    auraColor = color(255, 100, 100, pulse);
    auraSize = 1.8;
  }
  
  // Dessiner l'aura
  noStroke();
  fill(auraColor);
  circle(player.pos.x, player.pos.y, player.r * 2 * auraSize);
  
  // Aura secondaire pour l'effet de lueur
  if (healthRatio < 0.4) {
    let pulse2 = sin(frameCount * 0.2) * 30 + 60;
    fill(255, 50, 50, pulse2);
    circle(player.pos.x, player.pos.y, player.r * 2 * (auraSize + 0.5));
  }
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
  
  // Ammo counter with progress bar
  fill(255, 100, 255);
  text(`Ammo: ${player.ammoCount}/7`, 20, 95);
  
  // Ammo progress bar
  fill(100, 0, 100);
  rect(20, 115, 100, 8);
  fill(255, 100, 255);
  rect(20, 115, (player.ammoCount / 7) * 100, 8);
  stroke(255);
  strokeWeight(1);
  noFill();
  rect(20, 115, 100, 8);
  
  // Power-up indicator
  if (player.ammoPowerUpActive) {
    fill(255, 50, 255);
    noStroke();
    textSize(20);
    let timeLeft = ceil(player.ammoPowerUpDuration / 60);
    text(`🔥 POWER-UP! ${timeLeft}s`, 20, 135);
    textSize(16);
    
    // Effet de lueur pulsante
    let pulse = sin(frameCount * 0.2) * 50 + 205;
    fill(255, pulse, 255, 100);
    rect(15, 130, 180, 30);
  }
  
  // Slow motion indicator
  if (slowMotionActive) {
    fill(255, 100, 100);
    noStroke();
    textSize(18);
    textAlign(CENTER, TOP);
    text("⏱️ SLOW MOTION", width/2, 20);
    textAlign(LEFT, TOP);
    textSize(16);
  }
  
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
  
  // Indicateur de difficulté adaptative
  let diffColor;
  let diffText;
  if (difficultyLevel < 0.8) {
    diffColor = color(100, 255, 100); // Vert = plus facile
    diffText = "⬇️ Easier";
  } else if (difficultyLevel > 1.3) {
    diffColor = color(255, 100, 100); // Rouge = plus dur
    diffText = "⬆️ Harder";
  } else {
    diffColor = color(200, 200, 200); // Gris = normal
    diffText = "➡️ Normal";
  }
  fill(diffColor);
  textSize(14);
  text(diffText, width - 20, 95);
  
  text(diffText, width - 20, 95);
  
  // Time survived
  let minutes = floor(frameCount / 3600);
  let seconds = floor((frameCount % 3600) / 60);
  text(`Time: ${minutes}:${nf(seconds, 2)}`, width - 20, 115);
  
  // Safe zones progress
  text(`Safe Zones: ${safeZonesActivated}/${totalSafeZones}`, width - 20, 140);
  
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
  
  // Indicateurs de zombies hors écran
  drawOffscreenIndicators();
  
  // Indicateur de prochaine vague
  drawWaveIndicator();
  
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
  
  // Zones dangereuses (optimisé - ne vérifie que tous les 30 frames)
  if (frameCount % 30 === 0 || !window.dangerZones) {
    window.dangerZones = [];
    // Calculer les zones dangereuses seulement périodiquement
    for (let zombie of zombies) {
      let nearbyCount = zombies.filter(z => zombie.pos.dist(z.pos) < 200).length;
      if (nearbyCount > 5) {
        window.dangerZones.push(zombie.pos.copy());
      }
    }
  }
  
  // Afficher les zones dangereuses précalculées
  noStroke();
  fill(255, 0, 0, 100);
  for (let dangerPos of window.dangerZones) {
    let relPos = p5.Vector.sub(dangerPos, player.pos).mult(scale);
    if (relPos.mag() < mapR) {
      circle(mapX + relPos.x, mapY + relPos.y, 15);
    }
  }
  
  // Player (center, green)
  fill(50, 255, 50);
  noStroke();
  circle(mapX, mapY, 8);
  
  // Zombies (red dots with color by type) - limité aux zombies proches pour performance
  let visibleZombies = zombies.filter(z => z.pos.dist(player.pos) < 1000).slice(0, 50);
  for (let zombie of visibleZombies) {
    let relPos = p5.Vector.sub(zombie.pos, player.pos).mult(scale);
    if (relPos.mag() < mapR) {
      switch(zombie.type) {
        case "boss":
          fill(200, 50, 200);
          circle(mapX + relPos.x, mapY + relPos.y, 8);
          break;
        case "tank":
          fill(100, 100, 200);
          circle(mapX + relPos.x, mapY + relPos.y, 6);
          break;
        case "explosive":
          fill(255, 150, 50);
          circle(mapX + relPos.x, mapY + relPos.y, 5);
          break;
        case "fast":
          fill(150, 255, 150);
          circle(mapX + relPos.x, mapY + relPos.y, 3);
          break;
        default:
          fill(255, 50, 50);
          circle(mapX + relPos.x, mapY + relPos.y, 4);
      }
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
    text(`Zombies Defeated: ${zombiesKilled}`, width/2, height/2 + 50);
  } else {
    textSize(48);
    fill(255, 50, 50);
    text("YOU DIED", width/2, height/2 - 50);
    
    textSize(24);
    fill(255);
    text(`Resources Collected: ${player.resourcesCollected}`, width/2, height/2 + 20);
    text(`Zombies Defeated: ${zombiesKilled}`, width/2, height/2 + 50);
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
  
  // Déterminer le type de zombie (probabilités)
  let rand = random();
  let type = "normal";
  
  if (rand < 0.3) type = "fast"; // 30%
  else if (rand < 0.5) type = "tank"; // 20%
  else if (rand < 0.65) type = "explosive"; // 15%
  // 35% restant = normal
  
  zombies.push(new Zombie(spawnX, spawnY, currentLevel, type));
}

function spawnBoss() {
  // Spawn boss loin du joueur
  let angle = random(TWO_PI);
  let spawnDist = 800;
  let spawnX = player.pos.x + cos(angle) * spawnDist;
  let spawnY = player.pos.y + sin(angle) * spawnDist;
  
  zombies.push(new Zombie(spawnX, spawnY, currentLevel, "boss"));
  console.log("🔴 BOSS ZOMBIE SPAWNED!");
}

function isOnScreen(worldPos, radius = 0) {
  let screenX = worldPos.x - cameraPos.x + width/2;
  let screenY = worldPos.y - cameraPos.y + height/2;
  
  return screenX > -radius - 100 && screenX < width + radius + 100 &&
         screenY > -radius - 100 && screenY < height + radius + 100;
}
// Indicateurs de zombies hors écran
function drawOffscreenIndicators() {
  let edgeMargin = 50;
  
  for (let zombie of zombies) {
    if (!isOnScreen(zombie.pos, zombie.r)) {
      // Calculer la direction vers le zombie
      let dir = p5.Vector.sub(zombie.pos, player.pos);
      let angle = dir.heading();
      
      // Position sur le bord de l'écran
      let indicatorDist = min(width, height) / 2 - edgeMargin;
      let x = width/2 + cos(angle) * indicatorDist;
      let y = height/2 + sin(angle) * indicatorDist;
      
      // Couleur selon le type
      let indicatorColor;
      let size = 15;
      switch(zombie.type) {
        case "boss":
          indicatorColor = color(200, 50, 200);
          size = 25;
          break;
        case "tank":
          indicatorColor = color(100, 100, 200);
          size = 18;
          break;
        case "explosive":
          indicatorColor = color(255, 150, 50);
          size = 16;
          break;
        default:
          indicatorColor = color(255, 50, 50);
      }
      
      push();
      translate(x, y);
      rotate(angle + HALF_PI);
      
      // Triangle pointant vers le zombie
      fill(indicatorColor);
      stroke(255);
      strokeWeight(2);
      triangle(0, -size, -size/2, size/2, size/2, size/2);
      
      // Distance au zombie
      let dist = floor(dir.mag());
      fill(255);
      noStroke();
      textSize(10);
      textAlign(CENTER, CENTER);
      text(dist, 0, size + 10);
      
      pop();
    }
  }
}

// Indicateur de prochaine vague
function drawWaveIndicator() {
  // Temps jusqu'au prochain zombie normal
  let timeUntilNextZombie = (zombieSpawnInterval - (frameCount - lastZombieSpawn)) / 60;
  
  // Temps jusqu'au prochain boss
  let timeUntilBoss = (bossSpawnInterval - (frameCount - lastBossSpawn)) / 60;
  
  if (currentLevel >= 2 && timeUntilBoss > 0 && timeUntilBoss < 10) {
    // Alerte boss imminent
    push();
    fill(255, 0, 0);
    noStroke();
    textSize(24);
    textAlign(CENTER, TOP);
    let pulse = sin(frameCount * 0.2) * 50 + 205;
    fill(pulse, 0, 0);
    text(`⚠️ BOSS in ${ceil(timeUntilBoss)}s ⚠️`, width/2, 60);
    pop();
  }
  
  // Indicateur de vague en cours
  push();
  fill(255, 200);
  noStroke();
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text(`Next wave: ${max(0, ceil(timeUntilNextZombie))}s`, 20, height - 20);
  pop();
}

// Menu pause avec statistiques détaillées
function drawPauseMenu() {
  push();
  
  // Overlay semi-transparent
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  
  // Titre
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("⏸ PAUSED", width/2, height/4);
  
  // Stats box
  let boxWidth = 400;
  let boxHeight = 400;
  let boxX = width/2 - boxWidth/2;
  let boxY = height/2 - boxHeight/2;
  
  fill(30, 30, 40, 220);
  stroke(100, 150, 255);
  strokeWeight(3);
  rect(boxX, boxY, boxWidth, boxHeight, 10);
  
  // Statistiques
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  let statsY = boxY + 30;
  let lineHeight = 35;
  
  text("📊 STATISTICS", boxX + 20, statsY);
  
  textSize(18);
  statsY += 50;
  
  // Temps de survie
  let survivalTime = (millis() - startTime) / 1000;
  let minutes = floor(survivalTime / 60);
  let seconds = floor(survivalTime % 60);
  text(`⏱️  Survival Time: ${minutes}m ${seconds}s`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Zombies tués
  text(`💀 Zombies Killed: ${zombiesKilled}`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Niveau actuel
  text(`📈 Current Level: ${currentLevel}`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Tirs effectués
  text(`🎯 Shots Fired: ${totalShotsFired}`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Précision (si au moins un tir)
  if (totalShotsFired > 0) {
    let accuracy = (zombiesKilled / totalShotsFired * 100).toFixed(1);
    text(`🎯 Accuracy: ${accuracy}%`, boxX + 20, statsY);
    statsY += lineHeight;
  }
  
  // Dégâts pris
  text(`❤️  Damage Taken: ${floor(totalDamageTaken)}`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Santé actuelle
  text(`💚 Current Health: ${floor(player.health)}/${player.maxHealth}`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Ressources
  text(`💰 Resources: ${player.resourcesCollected}`, boxX + 20, statsY);
  statsY += lineHeight;
  
  // Munitions
  text(`🔫 Ammo: ${player.ammoCount}/7`, boxX + 20, statsY);
  
  // Instructions
  textSize(16);
  fill(200, 200, 255);
  textAlign(CENTER, BOTTOM);
  text("Press P to Resume", width/2, boxY + boxHeight + 40);
  text("Press R to Restart", width/2, boxY + boxHeight + 65);
  
  pop();
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
  } else if (key === 'p' || key === 'P') {
    // Toggle pause
    if (gameState === "playing") {
      gameState = "paused";
    } else if (gameState === "paused") {
      gameState = "playing";
    }
  } else if (key === 'r' || key === 'R') {
    // Restart game
    if (gameState !== "playing" && gameState !== "paused") {
      restartGame();
    }
  }
}

// Gestion du clic de souris pour tirer
function mousePressed() {
  if (gameState === "playing") {
    let newMissiles = player.shoot(zombies);
    missiles.push(...newMissiles);
    totalShotsFired += newMissiles.length;
  }
}

// ============================================
// SYSTÈME DE DIFFICULTÉ ADAPTATIVE
// ============================================

function updateAdaptiveDifficulty() {
  // Vérifier la performance toutes les 5 secondes
  if (frameCount - lastPerformanceCheck < performanceCheckInterval) {
    return;
  }
  
  lastPerformanceCheck = frameCount;
  
  // Calculer le score de performance basé sur plusieurs critères
  let healthRatio = player.health / player.maxHealth;
  let killRate = zombiesKilled / max(1, (millis() - startTime) / 1000); // Zombies par seconde
  let damageRate = totalDamageTaken / max(1, (millis() - startTime) / 1000); // Dégâts par seconde
  
  // Score composite (0 = galère, 1 = normal, 2+ = domine)
  performanceScore = 0;
  
  // Critère 1: Santé (40% du score)
  if (healthRatio > 0.7) performanceScore += 0.8; // Bonne santé
  else if (healthRatio > 0.4) performanceScore += 0.4; // Santé moyenne
  else performanceScore += 0.1; // Peu de santé
  
  // Critère 2: Taux d'élimination (40% du score)
  if (killRate > 0.5) performanceScore += 0.8; // Tue rapidement
  else if (killRate > 0.2) performanceScore += 0.4; // Taux normal
  else performanceScore += 0.1; // Tue lentement
  
  // Critère 3: Résistance aux dégâts (20% du score)
  if (damageRate < 0.5) performanceScore += 0.4; // Prend peu de dégâts
  else if (damageRate < 2) performanceScore += 0.2; // Dégâts modérés
  // Si prend beaucoup de dégâts, pas de bonus
  
  // Ajuster la difficulté progressivement (smooth transition)
  let targetDifficulty = constrain(performanceScore, 0.6, 1.8);
  difficultyLevel = lerp(difficultyLevel, targetDifficulty, 0.1); // Transition douce
  
  // Ajuster les intervalles de spawn
  if (difficultyLevel > 1.2) {
    // Joueur domine → plus de zombies, moins de ressources
    zombieSpawnInterval = baseZombieSpawnInterval / (1 + (difficultyLevel - 1) * 0.5);
    resourceSpawnInterval = baseResourceSpawnInterval * (1 + (difficultyLevel - 1) * 0.3);
  } else if (difficultyLevel < 0.8) {
    // Joueur galère → moins de zombies, plus de ressources
    zombieSpawnInterval = baseZombieSpawnInterval * (1.5 - difficultyLevel * 0.5);
    resourceSpawnInterval = baseResourceSpawnInterval / (1.5 - difficultyLevel * 0.5);
  } else {
    // Performance normale → valeurs de base
    zombieSpawnInterval = baseZombieSpawnInterval;
    resourceSpawnInterval = baseResourceSpawnInterval;
  }
  
  // Debug log (toutes les 10 secondes)
  if (frameCount % 600 === 0) {
    console.log(`📊 Difficulté: ${difficultyLevel.toFixed(2)} | Performance: ${performanceScore.toFixed(2)} | HP: ${healthRatio.toFixed(2)} | Kill/s: ${killRate.toFixed(2)}`);
  }
}

function spawnAdaptiveResource() {
  // Spawn de ressources adaptatif selon la difficulté
  let x = player.pos.x + random(-1000, 1000);
  let y = player.pos.y + random(-1000, 1000);
  
  let type;
  
  if (difficultyLevel < 0.8) {
    // Joueur galère → plus de medkits et ammo
    let rand = random();
    if (rand < 0.3) type = "resource";
    else if (rand < 0.7) type = "medkit"; // 40% medkits
    else type = "ammo"; // 30% ammo
  } else if (difficultyLevel > 1.3) {
    // Joueur domine → moins de ressources premium
    let rand = random();
    if (rand < 0.7) type = "resource"; // Surtout des ressources basiques
    else if (rand < 0.85) type = "medkit";
    else type = "ammo";
  } else {
    // Normal
    let rand = random();
    if (rand < 0.5) type = "resource";
    else if (rand < 0.7) type = "medkit";
    else type = "ammo";
  }
  
  resources.push(new Resource(x, y, type));
}

function restartGame() {
  // Reset all game state
  player = new Player(0, 0);
  zombies = [];
  missiles = [];
  resources = [];
  safeZones = [];
  explosions = [];
  particleSystem.clear();
  screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
  lastScreenShake = 0;
  chromaticAberration = 0;
  slowMotionActive = false;
  frameRate(normalFrameRate);
  gameState = "playing";
  safeZonesActivated = 0;
  lastZombieSpawn = 0;
  lastBossSpawn = 0;
  lastResourceSpawn = 0;
  currentLevel = 1;
  zombiesKilled = 0;
  totalDamageTaken = 0;
  totalShotsFired = 0;
  startTime = millis();
  
  // Réinitialiser la difficulté adaptative
  difficultyLevel = 1.0;
  performanceScore = 0;
  lastPerformanceCheck = 0;
  zombieSpawnInterval = baseZombieSpawnInterval;
  resourceSpawnInterval = baseResourceSpawnInterval;
  
  // Regenerate world with varied zombie types
  for (let i = 0; i < 15; i++) {
    let x = random(-500, 500);
    let y = random(-500, 500);
    let rand = random();
    let type = "normal";
    if (rand < 0.3) type = "fast";
    else if (rand < 0.5) type = "tank";
    else if (rand < 0.6) type = "explosive";
    zombies.push(new Zombie(x, y, currentLevel, type));
  }
  
  for (let i = 0; i < 80; i++) {
    let x = random(-worldSize/2, worldSize/2);
    let y = random(-worldSize/2, worldSize/2);
    let rand = random();
    let type;
    if (rand < 0.5) type = "resource";
    else if (rand < 0.7) type = "medkit";
    else type = "ammo"; // 30% de munitions
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

// ============================================
// SYSTÈME AUDIO PROCÉDURAL
// ============================================

function playShootSound() {
  if (!soundsLoaded) return;
  try {
    let osc = new p5.Oscillator('sine');
    osc.freq(800);
    osc.amp(0.1);
    osc.start();
    osc.stop(0.1);
  } catch(e) {}
}

function playPowerUpSound() {
  if (!soundsLoaded) return;
  try {
    let osc = new p5.Oscillator('square');
    osc.freq(600);
    osc.amp(0.15);
    osc.start();
    osc.freq(1200, 0.2);
    osc.stop(0.3);
  } catch(e) {}
}

function playDamageSound() {
  if (!soundsLoaded) return;
  try {
    let osc = new p5.Oscillator('sawtooth');
    osc.freq(200);
    osc.amp(0.1);
    osc.start();
    osc.stop(0.15);
  } catch(e) {}
}

function playExplosionSound() {
  if (!soundsLoaded) return;
  try {
    let noise = new p5.Noise('white');
    noise.amp(0.2);
    noise.start();
    noise.stop(0.3);
  } catch(e) {}
}