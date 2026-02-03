class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 50; // rayon différent pour la target
    this.couleur = "red";
    this.rayonPerception = 200;

    this.oldMaxSpeed = this.maxSpeed;
    this.vitesseDeFuite = 26;
    this.oldMaxForce = this.maxForce;
    this.forceDeFuite = 2;

    // vitesse aléatoire initiale pour la target
    this.vel = p5.Vector.random2D();
    this.vel.setMag(2);

    // Toutes les secondes tu changes de direction
   /* 
    setInterval(() => {
      this.vel = p5.Vector.random2D();
      // valeur de vitesse entre 1 et 10
        this.vel.setMag(random(1, 20));
        // le rayon change aussi
        this.r = random(20, 100);

        // couleur qui change aussi
        this.couleur = color(random(255), random(255), random(255));
    }, 2000);
    */
  }

  fleeWithPerception(vehicules) {
    // on cherche le vehicule le plus proche
    let closestVehicle = null;
    let closestDistance = Infinity;
    
    for (let v of vehicules) {
      let d = p5.Vector.dist(this.pos, v.pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestVehicle = v;
      }
    }

    // Si il y en a un de proche, on fuit, que si il est dans le cercle de perception
    if (closestVehicle != null) {
      if (closestDistance < this.rayonPerception + closestVehicle.r) {
        // On fuit le véhicule le plus proche
        // on augmente la vitesse max pour fuir plus vite
        this.maxSpeed = this.vitesseDeFuite;
        this.maxForce = this.forceDeFuite;
        let force = this.flee(closestVehicle.pos);
        this.applyForce(force);
      } else {
        // on reprend la vitesse normale
        this.maxSpeed = this.oldMaxSpeed;
        this.maxForce = this.oldMaxForce;
      }
    }
  }

  

  show() {
    // On la dessine comme un cercle de couleur this.couleur
    push();
    noStroke();
    fill(this.couleur);
    circle(this.pos.x, this.pos.y, this.r * 2);

    // Dessin du vectrur vitesse, longueur * 10
    //this.drawVelocityVector();

    // dessin du rayon de perception
    noFill();
    stroke("rgba(255, 255, 255)");
    circle(this.pos.x, this.pos.y, this.rayonPerception * 2);
    pop();
  }
}