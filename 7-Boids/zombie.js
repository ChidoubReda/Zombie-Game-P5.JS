// Zombie class - AI-controlled enemies using flocking + pursue behaviors
// Hérite de Vehicle pour réutiliser les comportements de steering

class Zombie extends Vehicle {
  constructor(x, y, level = 1, type = "normal") {
    super(x, y);
    
    this.type = type; // "normal", "fast", "tank", "explosive", "boss"
    this.level = level;
    
    // Propriétés par défaut
    this.vel = p5.Vector.random2D();
    this.vel.setMag(random(1, 2));
    this.maxForce = 0.2;
    this.maxSpeed = 4;
    this.r = 12;
    this.maxHealth = level;
    this.damageRate = 1;
    this.explosionRadius = 0;
    this.color = color(74, 97, 86); // Vert grisâtre
    
    // Configurer selon le type
    switch(type) {
      case "fast":
        this.maxSpeed = 6; // Plus rapide que le joueur
        this.maxHealth = Math.max(1, Math.floor(level * 0.5)); // Moins de PV
        this.r = 10; // Plus petit
        this.color = color(100, 150, 100); // Vert clair
        this.damageRate = 0.8; // Moins de dégâts
        break;
        
      case "tank":
        this.maxSpeed = 2; // Très lent
        this.maxHealth = level * 3; // Beaucoup de PV
        this.r = 18; // Plus gros
        this.color = color(60, 60, 80); // Bleu-gris foncé
        this.damageRate = 1.5; // Plus de dégâts
        this.maxForce = 0.3;
        break;
        
      case "explosive":
        this.maxSpeed = 3.5;
        this.maxHealth = Math.max(1, Math.floor(level * 0.7));
        this.r = 11;
        this.color = color(150, 100, 50); // Orange
        this.explosionRadius = 100; // Rayon d'explosion
        this.damageRate = 0.7;
        break;
        
      case "boss":
        this.maxSpeed = 3;
        this.maxHealth = level * 10; // Beaucoup de PV
        this.r = 30; // Très gros
        this.color = color(150, 50, 150); // Violet
        this.damageRate = 2; // Dégâts importants
        this.maxForce = 0.4;
        this.detectionRadius = 300; // Voit de très loin
        break;
    }
    
    this.health = this.maxHealth;
    this.dead = false;

    // Perception ranges
    this.perceptionRadius = 80;
    this.detectionRadius = this.type === "boss" ? 300 : 200;

    // Behavior weights
    this.alignWeight = 1.0;
    this.cohesionWeight = 1.2;
    this.separationWeight = 1.5;
    this.pursueWeight = 3.0;
    this.avoidWeight = 2.5;
    this.wanderWeight = 0.5;

    // Chase mode
    this.isChasing = false;
    
    // Système de dégâts progressifs
    this.contactTime = 0;
    this.lastDamageFrame = 0;
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

      // Use inherited separation (limité aux zombies proches pour performance)
      let nearbyZombies = zombies.filter(z => z !== this && this.pos.dist(z.pos) < this.perceptionRadius * 2);
      let separationForce = this.separation(nearbyZombies);
      separationForce.mult(this.separationWeight);
      this.applyForce(separationForce);

      // Use inherited avoid (limité aux obstacles proches)
      let nearbyObstacles = obstacles.filter(o => this.pos.dist(o.pos) < 150);
      let avoidForce = this.avoid(nearbyObstacles);
      avoidForce.mult(this.avoidWeight);
      this.applyForce(avoidForce);

    } else {
      // IDLE MODE - Flock and wander
      this.isChasing = false;

      // Use inherited flock method (calls align, cohesion, separation) - optimisé
      let nearbyZombies = zombies.filter(z => z !== this && this.pos.dist(z.pos) < this.perceptionRadius * 2);
      this.flock(nearbyZombies, this.alignWeight, this.cohesionWeight, this.separationWeight);

      // Use inherited wander
      let wanderForce = this.wander();
      wanderForce.mult(this.wanderWeight);
      this.applyForce(wanderForce);

      // Light obstacle avoidance even when idle (limité aux proches)
      let nearbyObstacles = obstacles.filter(o => this.pos.dist(o.pos) < 150);
      let avoidForce = this.avoid(nearbyObstacles);
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
  
  // Méthode appelée quand le zombie meurt (pour effets spéciaux)
  onDeath(player, zombies) {
    if (this.type === "explosive") {
      // Explosion qui blesse le joueur et les autres zombies
      let distToPlayer = this.pos.dist(player.pos);
      if (distToPlayer < this.explosionRadius) {
        let damage = map(distToPlayer, 0, this.explosionRadius, 5, 1);
        player.takeDamage(damage);
      }
      
      // Limiter le nombre de zombies affectés pour éviter les bugs (max 20)
      let nearbyZombies = zombies.filter(z => 
        !z.dead && z !== this && this.pos.dist(z.pos) < this.explosionRadius
      ).slice(0, 20);
      
      // Blesser les zombies proches
      for (let zombie of nearbyZombies) {
        let distToZombie = this.pos.dist(zombie.pos);
        let damage = map(distToZombie, 0, this.explosionRadius, 3, 1);
        zombie.takeDamage(damage);
      }
      
      return { explosion: true, radius: this.explosionRadius, pos: this.pos.copy() };
    }
    return null;
  }

  // Override show method from Vehicle
  show() {
    push();

    // Body color selon le type
    let zombieColor = this.isChasing ? 
      color(red(this.color) + 50, green(this.color), blue(this.color)) : 
      this.color;
    
    // Effet spécial pour explosifs (pulsation)
    if (this.type === "explosive") {
      let pulse = sin(frameCount * 0.1) * 30 + 225;
      fill(pulse, 100, 50, 150);
      noStroke();
      circle(this.pos.x, this.pos.y, this.r * 3);
    }
    
    // Effet spécial pour boss (aura)
    if (this.type === "boss") {
      for (let i = 3; i > 0; i--) {
        let alpha = map(i, 0, 3, 0, 50);
        fill(150, 50, 150, alpha);
        noStroke();
        circle(this.pos.x, this.pos.y, this.r * 2 * (1 + i * 0.2));
      }
    }
    
    fill(zombieColor);
    stroke(100);
    strokeWeight(this.type === "tank" ? 3 : 2);
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