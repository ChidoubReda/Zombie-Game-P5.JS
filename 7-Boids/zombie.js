// Zombie class - AI-controlled enemies using flocking + pursue behaviors
// Based on Boid class with added pursue and obstacle avoidance

class Zombie {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.setMag(random(1, 2));
    this.acc = createVector();
    this.maxForce = 0.2;
    this.maxSpeed = 3; // Slower than player
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

    // For wander behavior
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = 0;
    this.displaceRange = 0.1;

    // Chase mode
    this.isChasing = false;
  }

  // Main behavior function - called every frame
  applyBehaviors(zombies, player, obstacles) {
    let distToPlayer = this.pos.dist(player.pos);

    if (distToPlayer < this.detectionRadius) {
      // CHASE MODE
      this.isChasing = true;

      let pursueForce = this.pursue(player);
      pursueForce.mult(this.pursueWeight);
      this.applyForce(pursueForce);

      // Still maintain separation from other zombies
      let separationForce = this.separation(zombies);
      separationForce.mult(this.separationWeight);
      this.applyForce(separationForce);

      // Avoid obstacles
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(this.avoidWeight);
      this.applyForce(avoidForce);

    } else {
      // IDLE MODE - Flock and wander
      this.isChasing = false;

      let alignment = this.align(zombies);
      let cohesion = this.cohesion(zombies);
      let separation = this.separation(zombies);
      let wanderForce = this.wander();

      alignment.mult(this.alignWeight);
      cohesion.mult(this.cohesionWeight);
      separation.mult(this.separationWeight);
      wanderForce.mult(this.wanderWeight);

      this.applyForce(alignment);
      this.applyForce(cohesion);
      this.applyForce(separation);
      this.applyForce(wanderForce);

      // Light obstacle avoidance even when idle
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(this.avoidWeight * 0.5);
      this.applyForce(avoidForce);
    }
  }

  // Pursue behavior - predict where player will be
  pursue(player) {
    let prediction = player.vel.copy().mult(15); // Predict 15 frames ahead
    let futurePos = p5.Vector.add(player.pos, prediction);
    return this.seek(futurePos);
  }

  // Seek behavior - move toward target
  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // Flee behavior - move away from target
  flee(target) {
    return this.seek(target).mult(-1);
  }

  // Obstacle avoidance - steer away from obstacles ahead
  avoid(obstacles) {
    let ahead = this.vel.copy();
    ahead.mult(30); // Look 30 units ahead
    let ahead2 = ahead.copy().mult(0.5); // And halfway point

    let pointAhead = p5.Vector.add(this.pos, ahead);
    let pointAhead2 = p5.Vector.add(this.pos, ahead2);

    let mostThreatening = null;
    let minDistance = Infinity;

    // Find most threatening obstacle
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
      // Steer away from obstacle
      let avoidance = p5.Vector.sub(pointAhead, mostThreatening.pos);
      avoidance.normalize();
      avoidance.mult(this.maxSpeed);
      return avoidance;
    }

    return createVector(0, 0);
  }

  // Flocking behaviors
  align(zombies) {
    let steering = createVector();
    let total = 0;
    for (let other of zombies) {
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

  separation(zombies) {
    let steering = createVector();
    let total = 0;
    for (let other of zombies) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      if (other != this && d < this.perceptionRadius) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.div(d * d); // Weight by distance
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

  cohesion(zombies) {
    let steering = createVector();
    let total = 0;
    for (let other of zombies) {
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

  // Wander behavior - random movement
  wander() {
    let centreCercleDevant = this.vel.copy();
    centreCercleDevant.setMag(this.distanceCercle);
    centreCercleDevant.add(this.pos);

    let wanderAngle = this.vel.heading() + this.wanderTheta;
    let pointSurCercle = createVector(
      this.wanderRadius * cos(wanderAngle),
      this.wanderRadius * sin(wanderAngle)
    );
    pointSurCercle.add(centreCercleDevant);

    let desiredSpeed = p5.Vector.sub(pointSurCercle, this.pos);
    let force = p5.Vector.sub(desiredSpeed, this.vel);
    force.setMag(this.maxForce);

    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    return force;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

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

    pop();

    // Debug: show detection radius
    if (Zombie.debug) {
      noFill();
      stroke(255, 100);
      circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    }
  }

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
}
