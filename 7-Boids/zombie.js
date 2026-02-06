// Zombie class - AI-controlled enemies using flocking + pursue behaviors
// Hérite de Vehicle pour réutiliser les comportements de steering

class Zombie extends Vehicle {
  constructor(x, y, level = 1) {
    super(x, y);
    
    // Override vehicle properties
    this.vel = p5.Vector.random2D();
    this.vel.setMag(random(1, 2));
    this.maxForce = 0.2;
    this.maxSpeed = 4; // Slower than player
    this.r = 12;

    // Perception ranges
    this.perceptionRadius = 80;
    this.detectionRadius = 200; // How far zombie can detect player

    // Behavior weights
    this.alignWeight = 1.0;
    this.cohesionWeight = 1.2;
    this.separationWeight = 1.5;
    this.pursueWeight = 3.0; // Strong when chasing
    this.avoidWeight = 2.5;
    this.wanderWeight = 0.5;

    // Chase mode
    this.isChasing = false;
    
    // Système de points de vie basé sur le niveau
    this.level = level;
    this.maxHealth = level; // Niveau 1 = 1 PV, Niveau 2 = 2 PV, etc.
    this.health = this.maxHealth;
    this.dead = false;
  }

  // Main behavior function - called every frame
  applyBehaviors(zombies, player, obstacles) {
    let distToPlayer = this.pos.dist(player.pos);

    if (distToPlayer < this.detectionRadius) {
      // CHASE MODE
      this.isChasing = true;

      // Use inherited pursue behavior
      let pursueForce = this.pursue(player);
      pursueForce.mult(this.pursueWeight);
      this.applyForce(pursueForce);

      // Use inherited separation
      let separationForce = this.separation(zombies);
      separationForce.mult(this.separationWeight);
      this.applyForce(separationForce);

      // Use inherited avoid
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(this.avoidWeight);
      this.applyForce(avoidForce);

    } else {
      // IDLE MODE - Flock and wander
      this.isChasing = false;

      // Use inherited flock method (calls align, cohesion, separation)
      this.flock(zombies, this.alignWeight, this.cohesionWeight, this.separationWeight);

      // Use inherited wander
      let wanderForce = this.wander();
      wanderForce.mult(this.wanderWeight);
      this.applyForce(wanderForce);

      // Light obstacle avoidance even when idle
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(this.avoidWeight * 0.5);
      this.applyForce(avoidForce);
    }
  }
  
  // Méthode pour infliger des dégâts au zombie
  takeDamage(amount = 1) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
    }
  }

  // Override show method from Vehicle
  show() {
    push();

    // Body color - grayish green
    let zombieColor = this.isChasing ? color(150, 50, 50) : color(74, 97, 86);
    fill(zombieColor);
    stroke(100);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2);

    // Red eyes
    fill(255, 0, 0);
    noStroke();
    let eyeOffset = this.r * 0.4;
    let eyeSize = this.r * 0.3;

    // Calculate eye positions based on velocity direction
    let angle = this.vel.heading();
    let eyeX1 = this.pos.x + cos(angle - 0.3) * eyeOffset;
    let eyeY1 = this.pos.y + sin(angle - 0.3) * eyeOffset;
    let eyeX2 = this.pos.x + cos(angle + 0.3) * eyeOffset;
    let eyeY2 = this.pos.y + sin(angle + 0.3) * eyeOffset;

    circle(eyeX1, eyeY1, eyeSize);
    circle(eyeX2, eyeY2, eyeSize);

    // Glow effect when chasing
    if (this.isChasing) {
      noFill();
      stroke(255, 0, 0, 50);
      strokeWeight(3);
      circle(this.pos.x, this.pos.y, this.r * 2.5);
    }
    
    // Barre de vie si le zombie a plusieurs PV
    if (this.maxHealth > 1) {
      let barWidth = this.r * 2;
      let barHeight = 4;
      let barY = this.pos.y - this.r - 10;
      
      // Fond de la barre
      fill(100, 0, 0);
      noStroke();
      rect(this.pos.x - barWidth/2, barY, barWidth, barHeight);
      
      // Barre de vie
      fill(255, 0, 0);
      let healthWidth = (this.health / this.maxHealth) * barWidth;
      rect(this.pos.x - barWidth/2, barY, healthWidth, barHeight);
      
      // Contour
      noFill();
      stroke(255);
      strokeWeight(1);
      rect(this.pos.x - barWidth/2, barY, barWidth, barHeight);
    }

    pop();

    // Debug: show detection radius
    if (Vehicle.debug) {
      noFill();
      stroke(255, 100);
      circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    }
  }
}