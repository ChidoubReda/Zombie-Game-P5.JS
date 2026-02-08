# 🎮 Zombie Swarm Survival - Projet IA & Steering Behaviors

## 👥 Équipe de Développement

**Étudiants** :
- **MOUNIB Ghita**
- **CHIDOUB Reda**

**Formation** : M2 IA2 CASA - Groupe 2  
**Année** : 2025-2026  
**Établissement** : Université Côte d'Azur

---

## 📝 Description du Projet

Jeu de survie contre des hordes de zombies utilisant des algorithmes d'intelligence artificielle avancés (Steering Behaviors et Flocking). Le joueur doit survivre en activant 3 zones de sécurité tout en gérant ses ressources et en évitant une horde de zombies intelligents qui utilisent des comportements de groupe sophistiqués.

### 🎯 Objectif Pédagogique
Ce projet démontre l'implémentation pratique des **Steering Behaviors** (comportements de pilotage autonome) et des **algorithmes de Flocking** (comportements de groupe) inspirés des travaux de Craig Reynolds sur les boids.

---

## 🤖 Comportements IA Implémentés et Mises en Situation

### 1. **SEEK / PURSUE** - Poursuite du Joueur
**Qui ?** Tous les types de zombies (Normal, Rapide, Tank, Explosif, Boss)  
**Quand ?** Lorsque le joueur est détecté dans un rayon de 200 pixels (300 pour les Boss)  
**Comment ?** 
- Utilisation de `pursue()` qui prédit la position future du joueur
- Calcul de la position future : `Position cible + Vitesse cible × 15 frames`
- Force appliquée avec un poids de **3.0** (priorité maximale)

**Pourquoi ?**  
La poursuite prédictive permet aux zombies d'intercepter le joueur plutôt que de simplement le suivre, créant un comportement plus intelligent et menaçant. Les zombies anticipent les mouvements du joueur, rendant l'évasion plus difficile.

**Mise en situation** :  
*Un zombie rapide détecte le joueur en train de sprinter vers une zone de sécurité. Au lieu de courir directement vers sa position actuelle, le zombie calcule où le joueur sera dans 15 frames et court vers ce point, coupant ainsi sa route de manière intelligente.*

---

### 2. **WANDER** - Errance Naturelle
**Qui ?** Zombies en mode idle (hors détection du joueur)  
**Quand ?** Lorsque le joueur est à plus de 200 pixels  
**Comment ?**
- Cercle projeté devant le zombie à 150 pixels
- Point aléatoire sur le cercle de rayon 50
- Variation d'angle limitée (`displaceRange = 0.1`)
- Poids : **0.5** (comportement secondaire)

**Pourquoi ?**  
Crée un mouvement naturel et imprévisible pour les zombies au repos, donnant l'impression d'une horde vivante qui explore le monde plutôt que de rester statique. Cela renforce l'immersion et rend le jeu plus dynamique.

**Mise en situation** :  
*Plusieurs zombies errent près d'un bâtiment détruit. Leur mouvement aléatoire mais fluide donne l'impression qu'ils "patrouillent" la zone, créant une atmosphère inquiétante même en l'absence du joueur.*

---

### 3. **ALIGNMENT** - Alignement de Groupe
**Qui ?** Tous les zombies (comportement de flocking)  
**Quand ?** En permanence avec les zombies dans un rayon de 80 pixels  
**Comment ?**
- Calcul de la vitesse moyenne des voisins
- Force de steering pour aligner sa propre vitesse
- Poids : **1.0**

**Pourquoi ?**  
Permet aux zombies de se déplacer dans la même direction, créant des vagues coordonnées d'attaque plutôt que des mouvements chaotiques individuels. Cela simule un comportement de meute naturel.

**Mise en situation** :  
*Une horde de 10 zombies détecte le joueur. Grâce à l'alignment, ils forment une vague coordonnée qui se déplace dans la même direction, rendant l'évasion plus difficile qu'un groupe désorganisé.*

---

### 4. **COHESION** - Cohésion de Groupe
**Qui ?** Tous les zombies  
**Quand ?** En permanence avec les zombies dans un rayon de 160 pixels (2× perceptionRadius)  
**Comment ?**
- Calcul du centre de masse du groupe
- Force de steering vers ce centre
- Poids : **1.2** (légèrement prioritaire)

**Pourquoi ?**  
Maintient la cohésion de la horde, évitant que les zombies ne se dispersent trop. Crée un comportement de groupe compact et menaçant, amplifiant la difficulté pour le joueur qui doit gérer plusieurs ennemis regroupés.

**Mise en situation** :  
*Le joueur utilise la lampe torche pour repousser une partie de la horde. Après l'effet, les zombies dispersés se regroupent naturellement grâce à la cohésion, reformant une menace compacte.*

---

### 5. **SEPARATION** - Évitement de Collision
**Qui ?** Tous les zombies et le joueur (via missiles)  
**Quand ?** En permanence avec les entités proches (rayon 80 pixels)  
**Comment ?**
- Force inversement proportionnelle au carré de la distance (`force /= distance²`)
- Plus proche = repoussée plus forte
- Poids : **1.5** (très prioritaire)

**Pourquoi ?**  
Évite la superposition des zombies, créant des mouvements réalistes où chaque entité maintient son espace personnel. Empêche les "clusters" d'entités au même endroit, améliorant les performances et le réalisme visuel.

**Mise en situation** :  
*20 zombies convergent vers le joueur acculé contre un mur. La séparation empêche qu'ils ne s'empilent tous au même endroit, créant plutôt un cercle menaçant autour du joueur.*

---

### 6. **AVOID** - Évitement d'Obstacles
**Qui ?** Zombies et joueur  
**Quand ?** Lors de la détection d'obstacles dans la trajectoire  
**Comment ?**
- Projection de 2 points "ahead" (30 et 15 unités devant)
- Détection de collision avec obstacles
- Force de repoussée perpendiculaire
- Poids zombies en chase : **2.5**, en idle : **1.25**

**Pourquoi ?**  
Permet une navigation intelligente dans un environnement encombré. Les zombies contournent les obstacles plutôt que de rester bloqués, rendant la poursuite persistante même dans des zones complexes.

**Mise en situation** :  
*Un zombie tank poursuit le joueur à travers des ruines. Grâce au comportement d'évitement, il contourne automatiquement les débris sans rester coincé, maintenant la pression sur le joueur.*

---

### 7. **ARRIVE** - Attraction des Munitions
**Qui ?** Collectibles de type "Ammo" (munitions)  
**Quand ?** Lorsque le joueur est à moins de 150 pixels  
**Comment ?**
- Ralentissement progressif en approchant (`slowRadius = 50`)
- Vitesse proportionnelle à la distance
- Force de steering modérée

**Pourquoi ?**  
Améliore l'expérience utilisateur en facilitant la collecte des munitions critiques. Agit comme un "aimant" qui attire les munitions vers le joueur, réduisant la frustration de devoir les viser précisément pendant un combat intense.

**Mise en situation** :  
*Le joueur sprinte en combat, plusieurs zombies à ses trousses. Une munition à proximité est automatiquement attirée vers lui, lui permettant de la collecter sans devoir faire de détour dangereux.*

---

### 8. **Système de Missiles à Tête Chercheuse**
**Qui ?** Missiles tirés par le joueur  
**Quand ?** Au clic de souris (cooldown 0.33s)  
**Comment ?**
- Ciblage automatique des 2 zombies les plus proches
- Comportement `pursue()` pour suivre la cible
- Accélération progressive (2 → 12 unités/frame)
- Durée de vie : 3 secondes

**Pourquoi ?**  
Offre une mécanique de combat accessible avec un ciblage automatique, permettant au joueur de se concentrer sur le mouvement et la stratégie plutôt que sur la visée précise. L'accélération progressive rend les missiles plus dynamiques visuellement.

**Mise en situation** :  
*Le joueur tire 2 missiles qui verrouillent les 2 zombies les plus proches. Même si ces zombies changent de direction, les missiles les suivent intelligemment, s'accélérant jusqu'à l'impact.*

---

### 9. **Difficulté Adaptative**
**Qui ?** Système global du jeu  
**Quand ?** Vérification toutes les 5 secondes  
**Comment ?**
- Mesure de 3 critères : Santé (40%), Taux d'élimination (40%), Résistance aux dégâts (20%)
- Ajustement progressif : `difficulté = lerp(actuelle, cible, 0.1)`
- Modification des intervalles de spawn et types de ressources

**Pourquoi ?**  
Assure que le jeu reste challengeant mais jamais frustrant. Un joueur performant verra la difficulté augmenter (plus de zombies, moins de medkits), tandis qu'un joueur en difficulté bénéficiera d'un répit (moins d'ennemis, plus de soins).

**Mise en situation** :  
*Un joueur expérimenté maintient 90% de santé et élimine rapidement les zombies. Le système détecte cette performance, augmente le spawn rate et réduit les medkits. Le défi reste constant malgré la compétence croissante.*

---

### 10. **Lampe Torche (Flee Force)**
**Qui ?** Joueur (capacité spéciale)  
**Quand ?** Activation par ESPACE (cooldown 10s)  
**Comment ?**
- Force de repoussée de **5.0** vers l'extérieur
- Rayon d'effet : 150 pixels
- Durée : 2 secondes
- Calcul : `force = (zombie.pos - player.pos).normalize() × 5`

**Pourquoi ?**  
Fournit une capacité défensive d'urgence pour échapper à des situations désespérées. Le cooldown long force le joueur à utiliser cet outil stratégiquement plutôt que de spammer, ajoutant de la profondeur au gameplay.

**Mise en situation** :  
*Le joueur est encerclé par 8 zombies, sa santé est critique. Il active la lampe torche qui repousse violemment tous les zombies, créant un espace vital pour fuir vers une zone de sécurité proche.*

---

## 💡 Types de Zombies et Comportements Spéciaux

### 🟢 Zombie Normal (35% spawn)
- **Comportement** : Flocking équilibré, poursuite standard
- **Stratégie IA** : Groupe avec autres zombies, poursuit méthodiquement

### 🏃 Zombie Rapide (30% spawn)
- **Comportement** : Vitesse 6 (plus rapide que le joueur), moins de HP
- **Stratégie IA** : Attaque de flanc, intercepte les sprints du joueur
- **Mise en situation** : *Dépasse les autres zombies pour couper la route du joueur*

### 🛡️ Zombie Tank (20% spawn)
- **Comportement** : Très lent (vitesse 2), triple HP, double dégâts
- **Stratégie IA** : Force brute, difficile à repousser (maxForce augmentée)
- **Mise en situation** : *Absorbe plusieurs missiles, bloque des passages étroits*

### 💥 Zombie Explosif (15% spawn)
- **Comportement** : Explose à la mort (rayon 100, dégâts 1-5)
- **Stratégie IA** : Crée des effets de zone, peut blesser autres zombies
- **Mise en situation** : *Le joueur tue un explosif au milieu d'un groupe, l'explosion blesse 5 autres zombies, créant une réaction en chaîne*

### 👑 Zombie Boss (spawn périodique)
- **Comportement** : 10× HP, énormes dégâts, rayon de détection 300
- **Stratégie IA** : Détecte de très loin, aura visuelle intimidante
- **Mise en situation** : *Spawn toutes les 30s après niveau 2, force le joueur à l'éliminer rapidement sous peine d'être submergé*

---

## 🏆 Ce Dont Nous Sommes Le Plus Fiers

### 1. **Système de Difficulté Adaptative Sophistiqué**
Nous avons développé un système qui analyse en temps réel **3 métriques de performance** (santé, taux d'élimination, dégâts subis) pour ajuster dynamiquement la difficulté. Contrairement aux systèmes de difficulté fixes, notre implémentation utilise un **lerp progressif** pour des transitions fluides, évitant les changements brusques qui briseraient l'immersion.

**Impact**: Chaque partie est unique et reste challenging pour tous les niveaux de joueurs.

### 2. **Hybridation Intelligente des Comportements IA**
Les zombies ne se contentent pas d'appliquer un seul comportement, mais **combinent dynamiquement** plusieurs steering behaviors avec des poids adaptatifs selon le contexte (idle vs chase). L'utilisation de `perceptionRadius` optimisée et de filtres de proximité permet de gérer **50+ zombies simultanément** sans lag.

**Technique clé** : 
```javascript
let nearbyZombies = zombies.filter(z => this.pos.dist(z.pos) < perceptionRadius * 2);
this.flock(nearbyZombies, alignWeight, cohesionWeight, separationWeight);
```

### 3. **Système de Missiles à Tête Chercheuse avec Accélération Progressive**
L'implémentation d'un système de projectiles qui :
- Cible automatiquement les 2 ennemis les plus proches
- S'accélère de manière **crescendo** (2 → 12 unités/frame)
- Utilise `pursue()` pour suivre des cibles mobiles
- Affiche une traînée lumineuse dynamique

**Résultat** : Combat fluide et satisfaisant sans nécessiter de visée précise.

### 4. **Effets Visuels Procéduraux**
- **Aberration chromatique** quand la santé est basse (décalage RGB)
- **Screen shake** avec cooldown intelligent (évite le spam)
- **Slow motion** automatique sous 30% HP
- **Système de particules** optimisé (limite 300, gestion mémoire)
- **Aura du joueur** changeant dynamiquement selon la santé

Ces effets ne sont pas cosmétiques mais **communiquent l'état du jeu** au joueur de manière intuitive.

### 5. **Optimisations de Performance**
- **Culling intelligent** : Seules les entités visibles sont rendues (`isOnScreen()`)
- **Zombies proches seulement** pour les calculs de flocking (évite O(n²))
- **Précalcul périodique** des zones dangereuses pour la minimap (toutes les 30 frames)
- **Limitation dynamique** des particules selon la charge

**Résultat** : 60 FPS stables même avec 50+ zombies, 100 obstacles, effets visuels multiples.

---

## 🚧 Difficultés Rencontrées

### 1. **Problème : Zombies Bloqués sur les Obstacles**
**Description** : Les zombies restaient coincés sur les obstacles, incapables de contourner.

**Cause** : Le comportement `avoid()` ne détectait que les collisions immédiates sans anticipation suffisante.

**Solution** : 
```javascript
// Ajout de DEUX points de détection (ahead1 et ahead2)
let ahead = this.vel.copy().mult(30);  // Loin
let ahead2 = ahead.copy().mult(0.5);   // Moyen
// Utilisation de la distance minimale
let d = min(d1, d2);
```
Combiné avec un poids adaptatif (2.5 en chase, 1.25 en idle), les zombies contournent maintenant fluidement les obstacles.

---

### 2. **Problème : Lag avec Plus de 30 Zombies**
**Description** : Le jeu devenait injouable au-delà de 30 zombies (FPS < 20).

**Cause** : Calculs de flocking en O(n²) - chaque zombie vérifiant TOUS les autres zombies.

**Solution** :
```javascript
// AVANT : zombies.length × zombies.length = n²
this.flock(zombies);

// APRÈS : Filtrage par proximité
let nearbyZombies = zombies.filter(z => this.pos.dist(z.pos) < radius * 2);
this.flock(nearbyZombies);
```
**Résultat** : Support de 50+ zombies à 60 FPS.

---

### 3. **Problème : Screen Shake Devenant Nauséabond**
**Description** : Contact continu avec zombies tank provoquait un tremblement permanent, rendant le jeu injouable.

**Cause** : Aucun cooldown sur le screen shake.

**Solution** :
```javascript
if (frameCount - lastScreenShake >= screenShakeCooldown) {
    screenShake.intensity = damage + typeBonus;
    screenShake.duration = 10;
    lastScreenShake = frameCount;
}
```
**Cooldown global** de 2 secondes empêche le spam tout en préservant l'impact des coups.

---

### 4. **Problème : Explosion de Zombie Explosif Causant des Crashes**
**Description** : Tuer un explosif au milieu d'une horde pouvait faire planter le jeu.

**Cause** : Modification du tableau `zombies` pendant l'itération (boucle sur zombies explosés).

**Solution** :
```javascript
// Limitation stricte
let nearbyZombies = zombies.filter(z => 
    !z.dead && z !== this && dist < explosionRadius
).slice(0, 20);  // MAX 20 zombies affectés
```
Protection contre les boucles infinies et crashes.

---

### 5. **Problème : Difficulté Trop Brutale ou Trop Facile**
**Description** : Certains joueurs trouvaient le jeu impossible, d'autres l'éliminaient en 2 minutes.

**Cause** : Difficulté fixe ne s'adaptant pas au skill du joueur.

**Solution** : **Système de difficulté adaptative** analysant :
- Ratio de santé (40% du score)
- Taux d'élimination (40%)
- Dégâts subis (20%)

Ajustement dynamique toutes les 5 secondes avec transition douce (`lerp`).

**Résultat** : Expérience équilibrée pour débutants ET experts.

---

### 6. **Problème : Missiles Trop Lents et Imprécis**
**Description** : Missiles rataient souvent les zombies rapides.

**Cause** : Vitesse fixe trop lente pour rattraper les zombies en sprint.

**Solution** : **Accélération progressive**
```javascript
if (this.maxSpeed < this.maxSpeedLimit) {
    this.maxSpeed += this.acceleration;  // 0.1 par frame
}
// 2 → 12 unités/frame en ~100 frames
```
Combiné avec `pursue()` (prédiction de position future), les missiles interceptent maintenant efficacement.

---

### 7. **Problème : Aberration Chromatique Causant des Lags**
**Description** : L'effet d'aberration chromatique (décalage RGB) faisait chuter les FPS.

**Cause** : Manipulation de tous les pixels de l'écran (`loadPixels()`, `updatePixels()`).

**Solution** :
```javascript
// Condition stricte
if (chromaticAberration > 0.5 && particleSystem.particles.length < 200) {
    drawChromaticAberration();
}
```
Désactivation automatique quand trop de particules sont actives, préservant les performances critiques.

---

## 🤖 Outils IA Utilisés

### **GitHub Copilot** (Visual Studio Code Extension)

**Utilisation** : Assistance au codage en temps réel, génération de fonctions, optimisation de code.

#### Exemple de Prompt 1 : Système de Difficulté Adaptative
```
Prompt: "Create an adaptive difficulty system in JavaScript that analyzes 
player performance based on health ratio, kill rate, and damage taken. 
The system should adjust zombie spawn rate and resource drop rate every 
5 seconds using a smooth transition (lerp). Return difficulty level between 
0.6 (easier) and 1.8 (harder)."
```

**Résultat généré** : Base de la fonction `updateAdaptiveDifficulty()` avec les 3 critères pondérés.

#### Exemple de Prompt 2 : Optimisation du Flocking
```
Prompt: "Optimize this flocking behavior to only check nearby vehicles 
within a perception radius instead of all vehicles. Use array.filter() 
to reduce O(n²) complexity. Add distance check before calling flock()."
```

**Code avant** :
```javascript
this.flock(zombies);  // O(n²)
```

**Code après (généré avec Copilot)** :
```javascript
let nearbyZombies = zombies.filter(z => 
    z !== this && this.pos.dist(z.pos) < this.perceptionRadius * 2
);
this.flock(nearbyZombies);  // O(n × k) où k << n
```

#### Exemple de Prompt 3 : Système de Missiles Guidés
```
Prompt: "Implement a homing missile system in p5.js that:
1. Targets the 2 closest zombies
2. Uses pursue() behavior to track moving targets
3. Has progressive acceleration from 2 to 12 units/frame
4. Displays a glowing trail of last 10 positions
5. Explodes on contact or after 3 seconds"
```

**Résultat** : Structure complète de la classe `Missile` avec tous les comportements demandés.

---

### **ChatGPT (GPT-4)**

**Utilisation** : Résolution de bugs complexes, explications conceptuelles sur les steering behaviors.

#### Exemple de Session : Problème d'Explosions Infinies
```
Question: "Mon zombie explosif cause un crash quand il meurt au milieu 
d'une horde. Je suspecte une modification du tableau pendant l'itération. 
Voici mon code: [code fourni]"

Réponse ChatGPT: "Le problème vient de la boucle for...of sur zombies 
pendant que vous modifiez ce même tableau avec splice(). Solutions:
1. Utiliser for (let i = zombies.length - 1; i >= 0; i--) (backward loop)
2. Créer un tableau filtré avec slice()
3. Limiter le nombre de zombies affectés (ex: slice(0, 20))"
```

**Solution appliquée** : Option 3, combinant `filter()` et `slice(0, 20)` pour garantir max 20 zombies affectés.

---

### **Claude (Anthropic)** - Vous, actuellement ! 😊

**Utilisation** : Documentation, structuration du README, création du fichier rules.md.

---

## 📁 Structure du Projet

```
7-Boids/
├── index.html              # Point d'entrée
├── sketch.js               # Boucle principale (setup, draw)
├── vehicle.js              # Classe de base (steering behaviors)
├── boids.js                # Classe Boid (flocking pur)
├── zombie.js               # Classe Zombie (5 types)
├── player.js               # Classe Player (contrôles, santé)
├── missile.js              # Classe Missile (homing)
├── gameEntities.js         # Resource, SafeZone
├── obstacle.js             # Classe Obstacle
├── particle.js             # Système de particules
├── rules.md                # Documentation complète des règles
├── style.css               # Styles
├── libraries/
│   ├── p5.min.js          # Librairie p5.js
│   └── p5.sound.min.js    # Extensions audio
└── assets/                 # Ressources (non utilisées actuellement)
```

---

## 🎮 Comment Jouer

1. **Ouvrir** `7-Boids/index.html` dans un navigateur moderne
2. **Déplacer** avec WASD ou flèches
3. **Sprinter** avec SHIFT
4. **Tirer** avec clic gauche (missiles guidés)
5. **Lampe torche** avec ESPACE (repousse zombies, cooldown 10s)
6. **Objectif** : Activer 3 zones de sécurité (rester 3s dedans)

### Conseils de Survie
- 🏃 Ne restez jamais immobile
- 💡 Gardez la lampe torche pour les urgences
- 🎯 Priorisez les zombies boss et explosifs
- 💊 Collectez les medkits avant d'être à 30% HP
- 🔫 7 munitions = Power-Up (5 missiles simultanés)

---

## 📚 Références Académiques

- **Reynolds, C. W.** (1987). *Flocks, herds and schools: A distributed behavioral model*. SIGGRAPH '87
- **Reynolds, C. W.** (1999). *Steering Behaviors For Autonomous Characters*. GDC 1999
- **Shiffman, D.** (2012). *The Nature of Code*. Chapter 6: Autonomous Agents

---

## 📜 Licence

Projet académique - Université Côte d'Azur  
© 2025-2026 MOUNIB Ghita & CHIDOUB Reda

---

**Pour les détails techniques complets, consultez [rules.md](7-Boids/rules.md)**
 
