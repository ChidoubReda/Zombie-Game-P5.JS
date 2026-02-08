// Particle class for blood/gore effects

class Particle {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 6));
    this.acc = createVector(0, 0.2); // Gravity
    this.lifetime = 60; // Frames
    this.age = 0;
    this.size = random(3, 8);
    this.color = color;
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.mult(0.95); // Friction
    this.age++;
  }
  
  isAlive() {
    return this.age < this.lifetime;
  }
  
  show() {
    push();
    let alpha = map(this.age, 0, this.lifetime, 255, 0);
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], alpha);
    noStroke();
    circle(this.pos.x, this.pos.y, this.size);
    pop();
  }
}

// Particle system manager
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 300; // Limite globale pour éviter lag
  }
  
  createBloodSplatter(x, y, particleColor, count = 20) {
    // Limiter le nombre de particules si on approche de la limite
    if (this.particles.length > this.maxParticles - count) {
      count = Math.max(5, Math.floor(count / 2)); // Réduire si trop de particules
    }
    
    for (let i = 0; i < count; i++) {
      if (this.particles.length < this.maxParticles) {
        this.particles.push(new Particle(x, y, particleColor));
      }
    }
  }
  
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].isAlive()) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  show() {
    for (let particle of this.particles) {
      particle.show();
    }
  }
  
  clear() {
    this.particles = [];
  }
}
