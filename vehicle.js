// Vehicle - Classe de base pour tous les véhicules (Player, Zombie)
// Contient tous les comportements de steering possibles

class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = 16; // rayon

    // Pour le comportement wander
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = 0;
    this.displaceRange = 0.1;

    // Pour le flocking
    this.perceptionRadius = 80;
  }

  // ===== COMPORTEMENTS DE BASE =====

  // Seek - se diriger vers une cible
  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // Flee - fuir une cible
  flee(target) {
    return this.seek(target).mult(-1);
  }

  // Arrive - ralentir en approchant la cible
  arrive(target, slowRadius = 100) {
    let desired = p5.Vector.sub(target, this.pos);
    let distance = desired.mag();
    
    if (distance < slowRadius) {
      let speed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      desired.setMag(speed);
    } else {
      desired.setMag(this.maxSpeed);
    }
    
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // Pursue - poursuivre une cible mobile en prédisant sa position
  pursue(vehicle) {
    let prediction = vehicle.vel.copy().mult(15);
    let futurePos = p5.Vector.add(vehicle.pos, prediction);
    return this.seek(futurePos);
  }

  // Evade - éviter une cible mobile
  evade(vehicle) {
    return this.pursue(vehicle).mult(-1);
  }

  // Wander - mouvement erratique naturel
  wander() {
    let centreCercleDevant = this.vel.copy();
    centreCercleDevant.setMag(this.distanceCercle);
    centreCercleDevant.add(this.pos);

    if (Vehicle.debug) {
      fill("red");
      noStroke();
      circle(centreCercleDevant.x, centreCercleDevant.y, 8);

      noFill();
      stroke(255);
      circle(centreCercleDevant.x, centreCercleDevant.y, this.wanderRadius * 2);

      line(this.pos.x, this.pos.y, centreCercleDevant.x, centreCercleDevant.y);
    }

    let wanderAngle = this.vel.heading() + this.wanderTheta;
    let pointSurCercle = createVector(
      this.wanderRadius * cos(wanderAngle),
      this.wanderRadius * sin(wanderAngle)
    );
    pointSurCercle.add(centreCercleDevant);

    if (Vehicle.debug) {
      fill("lightGreen");
      circle(pointSurCercle.x, pointSurCercle.y, 8);
      line(this.pos.x, this.pos.y, pointSurCercle.x, pointSurCercle.y);
    }

    let desiredSpeed = p5.Vector.sub(pointSurCercle, this.pos);
    let force = p5.Vector.sub(desiredSpeed, this.vel);
    force.setMag(this.maxForce);

    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    return force;
  }

  // ===== COMPORTEMENTS D'ÉVITEMENT =====

  // Avoid - éviter les obstacles
  avoid(obstacles) {
    let ahead = this.vel.copy();
    ahead.mult(30);
    let ahead2 = ahead.copy().mult(0.5);

    let pointAhead = p5.Vector.add(this.pos, ahead);
    let pointAhead2 = p5.Vector.add(this.pos, ahead2);

    let mostThreatening = null;
    let minDistance = Infinity;

    for (let obs of obstacles) {
      let d1 = pointAhead.dist(obs.pos);
      let d2 = pointAhead2.dist(obs.pos);
      let d = min(d1, d2);

      if (d < obs.r + this.r * 2 && d < minDistance) {
        minDistance = d;
        mostThreatening = obs;
      }
    }

    if (mostThreatening) {
      let avoidance = p5.Vector.sub(pointAhead, mostThreatening.pos);
      avoidance.normalize();
      avoidance.mult(this.maxSpeed);
      return avoidance;
    }

    return createVector(0, 0);
  }

  // ===== COMPORTEMENTS DE FLOCKING =====

  // Align - aligner sa vitesse avec ses voisins
  align(vehicles) {
    let steering = createVector();
    let total = 0;
    for (let other of vehicles) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      if (other != this && d < this.perceptionRadius) {
        steering.add(other.vel);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  // Separation - maintenir une distance avec ses voisins
  separation(vehicles) {
    let steering = createVector();
    let total = 0;
    for (let other of vehicles) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      if (other != this && d < this.perceptionRadius) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.div(d * d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  // Cohesion - se diriger vers le centre du groupe
  cohesion(vehicles) {
    let steering = createVector();
    let total = 0;
    for (let other of vehicles) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      if (other != this && d < this.perceptionRadius * 2) {
        steering.add(other.pos);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.pos);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  // Flock - combinaison des trois comportements de flocking
  flock(vehicles, alignWeight = 1, cohesionWeight = 1, separationWeight = 1.5) {
    let alignment = this.align(vehicles);
    let cohesion = this.cohesion(vehicles);
    let separation = this.separation(vehicles);

    alignment.mult(alignWeight);
    cohesion.mult(cohesionWeight);
    separation.mult(separationWeight);

    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(separation);
  }

  // ===== COMPORTEMENTS UTILITAIRES =====

  // Boundaries - rester dans une zone rectangulaire
  boundaries(bx, by, bw, bh, d = 25) {
    let desired = null;

    if (this.pos.x < bx + d) {
      desired = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > bx + bw - d) {
      desired = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < by + d) {
      desired = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > by + bh - d) {
      desired = createVector(this.vel.x, -this.maxSpeed);
    }

    if (desired !== null) {
      desired.setMag(this.maxSpeed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }

    return createVector(0, 0);
  }

  // ===== PHYSIQUE =====

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  // ===== AFFICHAGE =====

  show() {
    // Méthode de base - à surcharger dans les sous-classes
    push();
    fill(255);
    stroke(255);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2);
    
    // Direction indicator
    if (this.vel.mag() > 0.5) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading());
      fill(255);
      noStroke();
      triangle(this.r, 0, -this.r/2, -this.r/2, -this.r/2, this.r/2);
      pop();
    }
    pop();
  }

  // ===== HELPERS =====

  edges() {
    if (this.pos.x > width) {
      this.pos.x = 0;
    } else if (this.pos.x < 0) {
      this.pos.x = width;
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
    } else if (this.pos.y < 0) {
      this.pos.y = height;
    }
  }

  getVehiculeLePlusProche(vehicles) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche;

    for (let v of vehicles) {
      if (v != this) {
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    }

    return vehiculeLePlusProche;
  }
}
