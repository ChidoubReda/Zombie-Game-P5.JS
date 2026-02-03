let target, vehicles = [];
let nbVehicules = 10;

// la fonction setup est appelée une fois au démarrage du programme par p5.js
function setup() {
  // on crée un canvas de 800px par 800px
  createCanvas(windowWidth, windowHeight);

  // On crée un véhicule à la position (100, 100)
  //vehicle = new Vehicle(100, 100);

  // TODO: créer un tableau de véhicules en global
  // ajouter nb vehicules au tableau dans une boucle
  // avec une position random dans le canvas
  creerVehicules(nbVehicules);

  // La cible est un vecteur avec une position aléatoire dans le canvas
  // dirigée par la souris ensuite dans draw()
  //target = createVector(random(width), random(height));

  // Cible qui se déplace aléatoirement, instance Target
  target = new Target(random(width), random(height));

  // On crée un véhicule à une position aléatoire
  vehicle = new Vehicle(random(width), random(height));

  // Sliders pour régler la vitesse max et la force max
  // On crée le slider et on le positionne
  // Les parametres sont : valeur min, valeur max, 
  // valeur initiale, pas
  // On crée le slider et on le positionne
  vitesseMaxSlider = createSlider(1, 20, 10, 1);
  vitesseMaxSlider.position(920, 10);
  vitesseMaxSlider.size(200);
  // je crée un label juste devant en X
  let labelVitesseMax = createDiv('Vitesse Max:')
  labelVitesseMax.position(810, 10);
  labelVitesseMax.style('color', 'white');
  labelVitesseMax.style('font-size', '14px');

  forceMaxSlider = createSlider(0.01, 4, 0.1, 0.01);
  forceMaxSlider.position(920, 40);
  forceMaxSlider.size(200);
  // je crée un label juste devant en X
  let labelForceMax = createDiv('Force Max:')
  labelForceMax.position(810, 40);
  labelForceMax.style('color', 'white');
  labelForceMax.style('font-size', '14px');

  // curseur pour régler le nombre de véhicules
  nbVehiculesSlider = createSlider(1, 50, nbVehicules, 1);
  nbVehiculesSlider.position(920, 70);
  nbVehiculesSlider.size(200);
  let labelNbVehicules = createDiv('Nb Véhicules:')
  labelNbVehicules.position(810, 70);
  labelNbVehicules.style('color', 'white');
  labelNbVehicules.style('font-size', '14px');

  // ecouteur d'événement pour le slider de nbVehicules
  nbVehiculesSlider.input(() => {
    // on remet le tableau à zéro
    vehicles = [];
    // on récupère la valeur du slider
    nbVehicules = nbVehiculesSlider.value();
    // on crée les véhicules
    creerVehicules(nbVehicules);
  });
}

function creerVehicules(n) {
  for (let i = 0; i < n; i++) {
    let v = new Vehicle(random(width), random(height));
    vehicles.push(v);
  }
}

// la fonction draw est appelée en boucle par p5.js, 60 fois par seconde par défaut
// Le canvas est effacé automatiquement avant chaque appel à draw
function draw() {
  // fond noir pour le canvas
  background("black");

  // Affichage de la valeur des slider, à droite des sliders
  fill("white");
  textSize(14);
  textAlign(LEFT);
  text("Vitesse Max: " + vitesseMaxSlider.value(), 1130, 25);
  text("Force Max: " + forceMaxSlider.value(), 1130, 55);

  // affichage du nombre de véhicules
  text("Nb Véhicules: " + nbVehiculesSlider.value(), 1130, 85);


  // A partir de maintenant toutes les formes pleines seront en rouge
  fill("red");
  // pas de contours pour les formes.
  noStroke();

  // mouseX et mouseY sont des variables globales de p5.js, elles correspondent à la position de la souris
  // on les stocke dans un vecteur pour pouvoir les utiliser avec la méthode seek (un peu plus loin)
  // du vehicule
  //target.x = mouseX;
  //target.y = mouseY;

  // Dessine un cercle de rayon 32px à la position de la souris
  // la couleur de remplissage est rouge car on a appelé fill(255, 0, 0) plus haut
  // pas de contours car on a appelé noStroke() plus haut
  //circle(target.x, target.y, 32);

  // On dessine la cible instance de Target. C'est un Vehicle
  // donc elle a une position, une vitesse, une accélération
  // on dessine la target sous la forme d'un cercle rouge
  //circle(target.x, target.y, 32);


  vehicles.forEach(vehicle => {
    // on met à jour les valeurs de vitesse max et force max
    vehicle.maxSpeed = vitesseMaxSlider.value();
    vehicle.maxForce = forceMaxSlider.value();

    // je déplace et dessine le véhicule
    vehicle.applyBehaviors(target.pos);
    vehicle.update();

    // Si le vehicule sort de l'écran
    // TODO : appeler la méthode edges() du véhicule
    vehicle.edges();

    // On dessine le véhicule
    vehicle.show();
  })

  target.fleeWithPerception(vehicles);
   target.show();
    target.update();
    target.edges();
};

