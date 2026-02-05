// Player class - The survivor you control
class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 5;
    this.maxForce = 0.3;
    this.r = 16; // collision radius
    
    // Game stats
    this.health = 100;
    this.maxHealth = 100;
    this.resourcesCollected = 0;
    
    // Flashlight mechanic
    this.flashlightActive = false;
    this.flashlightRadius = 150;
    this.flashlightCooldown = 0;
    this.flashlightMaxCooldown = 600; // 10 seconds at 60fps
    
    // Sprint mechanic
    this.isSprinting = false;
    this.normalSpeed = 5;
    this.sprintSpeed = 7;
    
    // Invincibility frames after taking damage
    this.invincible = false;
    this.invincibilityTimer = 0;
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
      
      // Apply strong flee force to all zombies in radius
      for (let zombie of zombies) {
        let d = this.pos.dist(zombie.pos);
        if (d < this.flashlightRadius && d > 0) {
          let fleeForce = p5.Vector.sub(zombie.pos, this.pos);
          fleeForce.normalize();
          fleeForce.mult(5); // Very strong push
          zombie.applyForce(fleeForce);
        }
      }
      
      // Duration: 2 seconds (120 frames)
      setTimeout(() => {
        this.flashlightActive = false;
      }, 2000);
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

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // Handle input
    this.handleInput();
    
    // Update physics
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Update cooldowns
    if (this.flashlightCooldown > 0) {
      this.flashlightCooldown--;
    }
    
    // Update invincibility
    if (this.invincible) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) {
        this.invincible = false;
      }
    }
  }

  show(cameraPos) {
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
