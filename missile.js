// Missile class - Projectile à tête chercheuse
// Hérite de Vehicle pour utiliser les comportements de steering

class Missile extends Vehicle {
  constructor(x, y, target) {
    super(x, y);
    
    // Override vehicle properties
    this.maxSpeed = 2; // Vitesse de départ faible
    this.maxForce = 0.15; // Force faible comme demandé
    this.r = 4; // Petit rayon pour les balles
    
    // Target (le zombie le plus proche)
    this.target = target;
    
    // Propriétés du missile
    this.acceleration = 0.1; // Augmentation de vitesse crescendo
    this.maxSpeedLimit = 12; // Vitesse maximale finale
    this.lifetime = 180; // 3 secondes de vie (180 frames à 60fps)
    this.age = 0;
    
    // Pour le trail visuel
    this.trail = [];
    this.maxTrailLength = 10;
  }
  
  // Mise à jour du missile
  updateMissile() {
    // Augmenter la vitesse crescendo
    if (this.maxSpeed < this.maxSpeedLimit) {
      this.maxSpeed += this.acceleration;
    }
    
    // Si le missile a une cible, poursuivre
    if (this.target && !this.target.dead) {
      let pursueForce = this.pursue(this.target);
      this.applyForce(pursueForce);
    }
    
    // Mise à jour normale du véhicule
    this.update();
    
    // Ajouter la position au trail
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    // Augmenter l'âge
    this.age++;
  }
  
  // Vérifier si le missile est encore vivant
  isAlive() {
    return this.age < this.lifetime;
  }
  
  // Vérifier la collision avec un zombie
  hits(zombie) {
    let d = this.pos.dist(zombie.pos);
    return d < (this.r + zombie.r);
  }
  
  // Override show method from Vehicle
  show() {
    push();
    
    // Halos de lueur externe (effet de propagation)
    for (let i = 3; i > 0; i--) {
      noStroke();
      let alpha = map(i, 0, 3, 0, 80);
      fill(255, 180, 0, alpha);
      circle(this.pos.x, this.pos.y, this.r * 2 * (i + 2));
    }
    
    // Traînée lumineuse (trail)
    if (this.trail.length > 1) {
      for (let i = 0; i < this.trail.length - 1; i++) {
        let alpha = map(i, 0, this.trail.length, 50, 255);
        let weight = map(i, 0, this.trail.length, 1, 4);
        
        // Ligne principale
        stroke(255, 220, 100, alpha);
        strokeWeight(weight);
        let p1 = this.trail[i];
        let p2 = this.trail[i + 1];
        line(p1.x, p1.y, p2.x, p2.y);
        
        // Ligne de lueur autour
        stroke(255, 180, 0, alpha * 0.5);
        strokeWeight(weight * 2);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }
    
    // Corps principal du missile (forme de fusée)
    if (this.vel.mag() > 0.5) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading());
      
      // Flamme arrière (effet de propulsion)
      let flameLength = random(8, 12);
      fill(255, 100, 0, 200);
      noStroke();
      triangle(-this.r * 2, 0, 
               -this.r * 2 - flameLength, -this.r, 
               -this.r * 2 - flameLength, this.r);
      
      // Flamme intérieure plus claire
      fill(255, 200, 0, 230);
      triangle(-this.r * 2, 0, 
               -this.r * 2 - flameLength * 0.6, -this.r * 0.5, 
               -this.r * 2 - flameLength * 0.6, this.r * 0.5);
      
      // Corps du missile (ellipse allongée)
      fill(255, 220, 50);
      stroke(255, 150, 0);
      strokeWeight(2);
      ellipse(0, 0, this.r * 4, this.r * 2);
      
      // Pointe du missile
      fill(255, 100, 0);
      noStroke();
      triangle(this.r * 2, 0, 
               this.r, -this.r, 
               this.r, this.r);
      
      // Reflet lumineux
      fill(255, 255, 200, 180);
      noStroke();
      ellipse(this.r * 0.5, -this.r * 0.3, this.r, this.r * 0.6);
      
      pop();
    } else {
      // Si pas de mouvement, simple cercle lumineux
      fill(255, 220, 50);
      stroke(255, 150, 0);
      strokeWeight(2);
      circle(this.pos.x, this.pos.y, this.r * 2);
    }
    
    // Étincelles aléatoires autour du missile
    if (random() < 0.3) {
      for (let i = 0; i < 3; i++) {
        let sparkX = this.pos.x + random(-this.r * 3, this.r * 3);
        let sparkY = this.pos.y + random(-this.r * 3, this.r * 3);
        fill(255, 255, 100, random(150, 255));
        noStroke();
        circle(sparkX, sparkY, random(1, 3));
      }
    }
    
    pop();
  }
}
