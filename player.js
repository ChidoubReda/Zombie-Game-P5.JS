// Player class - The survivor you control
// Hérite de Vehicle pour les comportements de steering
class Player extends Vehicle {
  constructor(x, y) {
    super(x, y);
    
    // Override vehicle properties
    this.maxSpeed = 5;
    this.maxForce = 0.3;
    this.r = 16; // collision radius
    
    // Game stats
    this.health = 50;
    this.maxHealth = 50;
    this.resourcesCollected = 0;
    
    // Flashlight mechanic
    this.flashlightActive = false;
    this.flashlightRadius = 150;
    this.flashlightCooldown = 0;
    this.flashlightMaxCooldown = 600; // 10 seconds at 60fps
    this.flashlightDuration = 0; // Frame counter for active duration
    
    // Sprint mechanic
    this.isSprinting = false;
    this.normalSpeed = 5;
    this.sprintSpeed = 7;
    
    // Invincibility frames after taking damage
    this.invincible = false;
    this.invincibilityTimer = 0;
    
    // Système de tir
    this.shootCooldown = 0;
    this.shootCooldownMax = 20; // 20 frames = ~0.33 secondes entre chaque tir
    this.shootDistance = 25; // Distance depuis les côtés du player
    
    // Système de power-up munitions
    this.ammoCount = 0; // Nombre de munitions collectées
    this.ammoPowerUpActive = false;
    this.ammoPowerUpDuration = 0;
    this.ammoPowerUpMaxDuration = 420; // 7 secondes à 60fps
    this.ammoRequiredForPowerUp = 7;
  }
  
  addAmmo() {
    this.ammoCount++;
    console.log("💥 Munition collectée! Total:", this.ammoCount);
    
    // Activer le power-up si on a 7 munitions
    if (this.ammoCount >= this.ammoRequiredForPowerUp) {
      this.ammoPowerUpActive = true;
      this.ammoPowerUpDuration = this.ammoPowerUpMaxDuration;
      this.ammoCount = 0; // Reset counter
      console.log("🔥🔥🔥 POWER-UP ACTIVÉ! Missiles décuplés pendant 7 secondes!");
    }
  }

  handleInput() {
    // Movement with WASD or Arrow keys
    let inputVec = createVector(0, 0);
    
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) inputVec.y = -1;    // W or UP
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) inputVec.y = 1;   // S or DOWN
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) inputVec.x = -1;  // A or LEFT
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) inputVec.x = 1;  // D or RIGHT
    
    if (inputVec.mag() > 0) {
      inputVec.normalize();
      
      // Sprint with SHIFT
      if (keyIsDown(SHIFT)) {
        this.isSprinting = true;
        this.maxSpeed = this.sprintSpeed;
      } else {
        this.isSprinting = false;
        this.maxSpeed = this.normalSpeed;
      }
      
      inputVec.mult(this.maxSpeed);
      let steerForce = p5.Vector.sub(inputVec, this.vel);
      steerForce.limit(this.maxForce);
      this.applyForce(steerForce);
    } else {
      // Apply friction when not moving
      this.vel.mult(0.9);
    }
  }

  useFlashlight(zombies) {
    if (this.flashlightCooldown <= 0 && !this.flashlightActive) {
      this.flashlightActive = true;
      this.flashlightCooldown = this.flashlightMaxCooldown;
      this.flashlightDuration = 120; // 2 seconds at 60fps
      console.log("🔦 Flashlight activated!");
    } else {
      console.log("⏳ Flashlight on cooldown:", Math.ceil(this.flashlightCooldown / 60), "seconds");
    }
  }
  
  // Méthode pour tirer des missiles
  shoot(zombies) {
    if (this.shootCooldown <= 0 && zombies.length > 0) {
      let missiles = [];
      
      // Récupérer tous les zombies vivants
      let aliveZombies = zombies.filter(z => !z.dead);
      if (aliveZombies.length === 0) return [];
      
      // Trier les zombies par distance (plus proches en premier)
      aliveZombies.sort((a, b) => {
        let distA = this.pos.dist(a.pos);
        let distB = this.pos.dist(b.pos);
        return distA - distB;
      });
      
      let angle = this.vel.mag() > 0.5 ? this.vel.heading() : 0;
      
      // Nombre de missiles à tirer (2 normalement, 5 avec power-up)
      let missileCount = this.ammoPowerUpActive ? 5 : 2;
      
      if (this.ammoPowerUpActive) {
        // Tir en cercle complet autour du joueur
        for (let i = 0; i < missileCount; i++) {
          let spreadAngle = (TWO_PI / missileCount) * i;
          let missilePos = createVector(
            this.pos.x + cos(spreadAngle) * this.shootDistance,
            this.pos.y + sin(spreadAngle) * this.shootDistance
          );
          // Assigner un zombie différent à chaque missile (cycler si plus de missiles que de zombies)
          let targetZombie = aliveZombies[i % aliveZombies.length];
          missiles.push(new Missile(missilePos.x, missilePos.y, targetZombie));
        }
      } else {
        // Tir normal des deux côtés
        let perpAngle1 = angle + HALF_PI;
        let perpAngle2 = angle - HALF_PI;
        
        let missilePos1 = createVector(
          this.pos.x + cos(perpAngle1) * this.shootDistance,
          this.pos.y + sin(perpAngle1) * this.shootDistance
        );
        
        let missilePos2 = createVector(
          this.pos.x + cos(perpAngle2) * this.shootDistance,
          this.pos.y + sin(perpAngle2) * this.shootDistance
        );
        
        // Assigner le zombie le plus proche au premier missile
        missiles.push(new Missile(missilePos1.x, missilePos1.y, aliveZombies[0]));
        
        // Assigner le deuxième zombie le plus proche (ou le même si un seul zombie)
        let secondTarget = aliveZombies.length > 1 ? aliveZombies[1] : aliveZombies[0];
        missiles.push(new Missile(missilePos2.x, missilePos2.y, secondTarget));
      }
      
      // Réinitialiser le cooldown
      this.shootCooldown = this.shootCooldownMax;
      
      return missiles;
    }
    return [];
  }

  // Method to apply flashlight force each frame while active
  applyFlashlightForce(zombies) {
    if (this.flashlightActive) {
      console.log("⚡ Flashlight active! Applying forces to", zombies.length, "zombies");
      // Apply strong flee force to all zombies in radius
      for (let zombie of zombies) {
        let d = this.pos.dist(zombie.pos);
        if (d < this.flashlightRadius && d > 0) {
          console.log("  💥 Pushing zombie at distance:", d.toFixed(2));
          let fleeForce = p5.Vector.sub(zombie.pos, this.pos);
          fleeForce.normalize();
          fleeForce.mult(5); // Very strong push
          zombie.applyForce(fleeForce);
        }
      }
    }
  }

  takeDamage(amount) {
    if (!this.invincible) {
      this.health -= amount;
      this.health = constrain(this.health, 0, this.maxHealth);
      
      // Brief invincibility
      this.invincible = true;
      this.invincibilityTimer = 60; // 1 second
    }
  }

  checkCollisionWithObstacles(obstacles) {
    for (let obs of obstacles) {
      let d = this.pos.dist(obs.pos);
      if (d < this.r + obs.r) {
        // Push player out of obstacle
        let push = p5.Vector.sub(this.pos, obs.pos);
        push.setMag(this.r + obs.r - d);
        this.pos.add(push);
        this.vel.mult(0); // Stop movement
      }
    }
  }

  update() {
    // Handle input
    this.handleInput();
    
    // Update physics (inherited from Vehicle)
    super.update();
    
    // Update cooldowns
    if (this.flashlightCooldown > 0) {
      this.flashlightCooldown--;
    }
    
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    // Update ammo power-up
    if (this.ammoPowerUpActive) {
      this.ammoPowerUpDuration--;
      if (this.ammoPowerUpDuration <= 0) {
        this.ammoPowerUpActive = false;
        console.log("⚠️ Power-up terminé!");
      }
    }
    
    // Update flashlight duration
    if (this.flashlightDuration > 0) {
      this.flashlightDuration--;
      if (this.flashlightDuration <= 0) {
        this.flashlightActive = false;
      }
    }
    
    // Update invincibility
    if (this.invincible) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) {
        this.invincible = false;
      }
    }
  }

  // Override show method from Vehicle
  show() {
    push();
    
    // Draw flashlight radius when active
    if (this.flashlightActive) {
      fill(255, 255, 200, 50);
      noStroke();
      circle(this.pos.x, this.pos.y, this.flashlightRadius * 2);
    }
    
    // Draw player - flashing when invincible
    if (!this.invincible || frameCount % 10 < 5) {
      fill(50, 255, 50); // Bright green
      stroke(255);
      strokeWeight(2);
      circle(this.pos.x, this.pos.y, this.r * 2);
      
      // Direction indicator (triangle pointing in velocity direction)
      if (this.vel.mag() > 0.5) {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        fill(255);
        noStroke();
        triangle(this.r, 0, -this.r/2, -this.r/2, -this.r/2, this.r/2);
        pop();
      }
    }
    
    pop();
  }
}
