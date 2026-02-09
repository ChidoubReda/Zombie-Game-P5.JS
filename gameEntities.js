// Resource class - Collectible items scattered in the world

class Resource extends Vehicle {
  constructor(x, y, type = "resource") {
    super(x, y);
    this.r = 8;
    this.type = type; // "resource", "medkit", "flare", "ammo"
    this.collected = false;
    this.glowRadius = 20;
    
    // Properties for movement (ammo type only)
    this.maxSpeed = 3;
    this.maxForce = 0.15;
    this.attractionRadius = 150; // Distance à laquelle l'ammo est attiré
    
    // Set properties based on type
    switch(type) {
      case "medkit":
        this.color = color(255, 50, 50); // Red
        this.value = 30; // Health restore amount
        break;
      case "flare":
        this.color = color(255, 255, 255); // White
        this.value = 1; // Flare count
        break;
      case "ammo":
        this.color = color(255, 100, 255); // Purple/Magenta
        this.value = 1; // Ammo count
        this.r = 10; // Slightly larger
        break;
      default: // "resource"
        this.color = color(255, 200, 50); // Gold
        this.value = 1; // Points
    }
  }
  
  updateMovement(player) {
    // Seulement pour les munitions
    if (this.type === "ammo" && !this.collected) {
      let d = this.pos.dist(player.pos);
      if (d < this.attractionRadius) {
        // Utiliser arrival pour se déplacer vers le player
        let arriveForce = this.arrive(player.pos, 50);
        this.applyForce(arriveForce);
        this.update();
      }
    }
  }

  checkCollision(player) {
    if (!this.collected) {
      let d = this.pos.dist(player.pos);
      if (d < this.r + player.r) {
        this.collected = true;
        
        // Apply effect based on type
        switch(this.type) {
          case "medkit":
            player.health = min(player.health + this.value, player.maxHealth);
            break;
          case "resource":
            player.resourcesCollected++;
            break;
          case "ammo":
            player.addAmmo();
            break;
        }
        
        return true;
      }
    }
    return false;
  }

  show() {
    if (!this.collected) {
      push();
      
      // Glow effect
      noStroke();
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 30);
      circle(this.pos.x, this.pos.y, this.glowRadius * 2);
      
      // Main circle
      fill(this.color);
      stroke(255);
      strokeWeight(2);
      circle(this.pos.x, this.pos.y, this.r * 2);
      
      // Inner glow
      fill(255, 255, 255, 150);
      noStroke();
      circle(this.pos.x, this.pos.y, this.r);
      
      // Extra effect for ammo
      if (this.type === "ammo") {
        // Rotating triangles
        push();
        translate(this.pos.x, this.pos.y);
        rotate(frameCount * 0.05);
        fill(255, 150, 255, 200);
        noStroke();
        for (let i = 0; i < 3; i++) {
          let angle = (TWO_PI / 3) * i;
          let x = cos(angle) * this.r * 1.5;
          let y = sin(angle) * this.r * 1.5;
          triangle(x, y, x + 3, y + 5, x - 3, y + 5);
        }
        pop();
      }
      
      pop();
    }
  }
}


// SafeZone class - Areas where player can be safe from zombies

class SafeZone {
  constructor(x, y, r = 120) {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = color(50, 150, 255, 50); // Blue transparent
    this.activated = false;
    this.activationProgress = 0;
    this.activationRequired = 180; // 3 seconds at 60fps
    this.pulsePhase = 0;
  }

  update(player, zombies) {
    let d = this.pos.dist(player.pos);
    
    if (!this.activated && d < this.r) {
      // Player is in zone, increase progress
      this.activationProgress++;
      
      if (this.activationProgress >= this.activationRequired) {
        this.activated = true;
        return true; // Zone activated!
      }
    } else if (!this.activated) {
      // Player left zone, reset progress
      this.activationProgress = max(0, this.activationProgress - 2);
    }
    
    // Zombies cannot enter - apply strong flee force
    for (let zombie of zombies) {
      let distToZombie = this.pos.dist(zombie.pos);
      if (distToZombie < this.r + 50) {
        let fleeForce = p5.Vector.sub(zombie.pos, this.pos);
        fleeForce.normalize();
        fleeForce.mult(3);
        zombie.applyForce(fleeForce);
      }
    }
    
    this.pulsePhase += 0.05;
    return false;
  }

  show() {
    push();
    
    // Outer pulsing ring
    let pulseSize = sin(this.pulsePhase) * 10;
    noFill();
    
    if (this.activated) {
      stroke(50, 255, 50, 150); // Green when activated
      strokeWeight(5);
    } else {
      stroke(50, 150, 255, 150); // Blue when available
      strokeWeight(3);
    }
    
    circle(this.pos.x, this.pos.y, (this.r + pulseSize) * 2);
    
    // Inner filled area
    if (!this.activated) {
      fill(50, 150, 255, 30 + sin(this.pulsePhase) * 20);
    } else {
      fill(50, 255, 50, 80);
    }
    noStroke();
    circle(this.pos.x, this.pos.y, this.r * 2);
    
    // Center marker
    fill(255);
    noStroke();
    circle(this.pos.x, this.pos.y, 10);
    
    // Progress indicator when player is activating
    if (this.activationProgress > 0 && !this.activated) {
      let progress = this.activationProgress / this.activationRequired;
      
      // Progress arc
      noFill();
      stroke(255, 255, 0);
      strokeWeight(8);
      arc(this.pos.x, this.pos.y, 60, 60, -HALF_PI, -HALF_PI + TWO_PI * progress);
      
      // Progress text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text(`${floor(progress * 100)}%`, this.pos.x, this.pos.y - this.r - 30);
    }
    
    // "SAFE ZONE" label
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    if (this.activated) {
      text("ACTIVATED", this.pos.x, this.pos.y + this.r + 20);
    } else {
      text("SAFE ZONE", this.pos.x, this.pos.y + this.r + 20);
    }
    
    pop();
  }
}
