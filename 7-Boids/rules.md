# 🎮 Règles du Jeu - Zombie Swarm Survival

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Comportements de Steering (Vehicle)](#comportements-de-steering-vehicle)
3. [Comportements Flocking (Boids)](#comportements-flocking-boids)
4. [Règles du Joueur](#règles-du-joueur)
5. [Règles des Zombies](#règles-des-zombies)
6. [Système de Missiles](#système-de-missiles)
7. [Ressources et Collectibles](#ressources-et-collectibles)
8. [Zones de Sécurité](#zones-de-sécurité)
9. [Système de Difficulté Adaptative](#système-de-difficulté-adaptative)
10. [Effets Visuels](#effets-visuels)
11. [Conditions de Victoire/Défaite](#conditions-de-victoiredéfaite)

---

## 🎯 Vue d'ensemble

### Objectif du Jeu
Survivre à une horde de zombies en activant les 3 zones de sécurité dispersées dans le monde.

### Mécaniques Principales
- **Déplacement** : WASD ou Flèches directionnelles
- **Sprint** : Maintenir SHIFT
- **Tir** : Clic gauche de la souris
- **Lampe torche** : SPACE (repousse les zombies)
- **Pause** : P
- **Redémarrer** : R (après la fin de partie)
- **Mode Debug** : D

---

## 🚗 Comportements de Steering (Vehicle)

Tous les véhicules (Player, Zombie, Missile) héritent de la classe `Vehicle` qui implémente les comportements de steering de base.

### 1. **SEEK** - Se diriger vers une cible
```
Force désirée = (Position cible - Position actuelle).normalize() * vitesse max
Force de steering = Force désirée - Vitesse actuelle
```
**Utilisation** : Poursuivre une cible

### 2. **FLEE** - Fuir une cible
```
Force de fuite = -SEEK
```
**Utilisation** : S'éloigner d'un danger

### 3. **ARRIVE** - Ralentir en approchant
```
Si distance < rayon de ralentissement:
    Vitesse = map(distance, 0, rayon, 0, vitesse max)
Sinon:
    Vitesse = vitesse max
```
**Utilisation** : Atteindre une position sans dépasser

### 4. **PURSUE** - Poursuivre une cible mobile
```
Position future = Position cible + (Vitesse cible * facteur de prédiction)
Force = SEEK(Position future)
```
**Utilisation** : Poursuivre un véhicule en mouvement en anticipant sa trajectoire

### 5. **EVADE** - Éviter une cible mobile
```
Force d'évasion = -PURSUE
```
**Utilisation** : Fuir un véhicule en mouvement

### 6. **WANDER** - Mouvement erratique naturel
```
Cercle devant le véhicule à distance D
Point aléatoire sur le cercle de rayon R
Angle de déplacement += random(-θ, +θ)
Force = SEEK(Point sur cercle)
```
**Paramètres** :
- `distanceCercle = 150` : Distance du cercle devant le véhicule
- `wanderRadius = 50` : Rayon du cercle
- `wanderTheta` : Angle actuel
- `displaceRange = 0.1` : Variation angulaire

**Utilisation** : Mouvement naturel et imprévisible des zombies au repos

### 7. **AVOID** - Éviter les obstacles
```
Point ahead1 = Position + Vitesse * 30
Point ahead2 = Position + Vitesse * 15

Pour chaque obstacle:
    distance = min(distance(ahead1, obstacle), distance(ahead2, obstacle))
    Si distance < (obstacle.rayon + véhicule.rayon * 2):
        Obstacle le plus menaçant = obstacle
        
Force d'évitement = (ahead1 - obstacle).normalize() * vitesse max
```
**Utilisation** : Contourner les obstacles

---

## 🐦 Comportements Flocking (Boids)

Les zombies utilisent le flocking pour coordonner leurs déplacements en groupe.

### 1. **ALIGNMENT** - Aligner sa direction
```
Pour chaque voisin dans perceptionRadius:
    Vitesse moyenne += voisin.vitesse
    
Vitesse moyenne /= nombre de voisins
Force = (Vitesse moyenne - Vitesse actuelle).limit(maxForce)
```
**Poids par défaut** : 1.0 pour zombies

### 2. **COHESION** - Se diriger vers le centre du groupe
```
Pour chaque voisin dans perceptionRadius * 2:
    Centre de masse += voisin.position
    
Centre de masse /= nombre de voisins
Force = SEEK(Centre de masse)
```
**Poids par défaut** : 1.2 pour zombies

### 3. **SEPARATION** - Maintenir une distance
```
Pour chaque voisin dans perceptionRadius:
    Différence = Position actuelle - Position voisin
    Différence /= distance²  (plus proche = plus fort)
    Force totale += Différence
    
Force = Force totale.normalize().limit(maxForce)
```
**Poids par défaut** : 1.5 pour zombies

### 4. **FLOCK** - Combinaison des trois
```
Force totale = (Alignment * poids1) + (Cohesion * poids2) + (Separation * poids3)
Appliquer Force totale
```

---

## 👤 Règles du Joueur

### Statistiques
- **Santé** : 50 HP (max)
- **Vitesse normale** : 5 unités/frame
- **Vitesse sprint** : 7 unités/frame
- **Rayon de collision** : 16 pixels
- **Invincibilité** : 60 frames (1 seconde) après dégâts

### Capacités

#### 🔦 Lampe Torche
- **Effet** : Repousse tous les zombies dans un rayon de 150 pixels
- **Durée** : 120 frames (2 secondes)
- **Cooldown** : 600 frames (10 secondes)
- **Force de repoussée** : 5 unités (très puissante)

#### 🚀 Système de Tir
- **Cooldown de tir** : 20 frames (~0.33 seconde)
- **Missiles simultanés** : 2 (un de chaque côté)
- **Distance de spawn** : 25 pixels des côtés du joueur
- **Ciblage** : Missiles guidés vers les 2 zombies les plus proches

#### ⚡ Power-Up Munitions
- **Activation** : Collecter 7 munitions
- **Effet** : Tir de 5 missiles simultanés en cercle (au lieu de 2)
- **Durée** : 420 frames (7 secondes)
- **Icône** : 🔥 POWER-UP affiché à l'écran

### Système de Dégâts
- **Frames d'invincibilité** : 60 frames après chaque dégât
- **Dégâts reçus** : Dépendent du type de zombie et temps de contact
- **Contact prolongé** : Multiplicateur de dégâts = 1 + (secondes de contact)

### Sprint
- **Effet visuel** : Traînée de particules cyan
- **Épuisement** : Aucun (sprint illimité)
- **Ralentissement après contact** : Non

---

## 🧟 Règles des Zombies

### Types de Zombies

#### 1. **Zombie Normal** (35% spawn)
```
- Santé : Niveau actuel
- Vitesse : 4 unités/frame
- Dégâts de base : 0.5 HP
- Fréquence d'attaque : 15 frames (4x/seconde)
- Couleur : Vert grisâtre (74, 97, 86)
- Rayon : 12 pixels
```

#### 2. **Zombie Rapide** (30% spawn)
```
- Santé : Niveau * 0.5 (minimum 1)
- Vitesse : 6 unités/frame (plus rapide que le joueur)
- Dégâts de base : 0.3 HP
- Fréquence d'attaque : 12 frames (5x/seconde)
- Couleur : Vert clair (100, 150, 100)
- Rayon : 10 pixels
```

#### 3. **Zombie Tank** (20% spawn)
```
- Santé : Niveau * 3
- Vitesse : 2 unités/frame (très lent)
- Dégâts de base : 1.2 HP
- Fréquence d'attaque : 20 frames (3x/seconde)
- Couleur : Bleu-gris foncé (60, 60, 80)
- Rayon : 18 pixels
- Force max : 0.3 (plus difficile à arrêter)
```

#### 4. **Zombie Explosif** (15% spawn)
```
- Santé : Niveau * 0.7
- Vitesse : 3.5 unités/frame
- Dégâts de base : 0.4 HP
- Rayon d'explosion : 100 pixels (à la mort)
- Dégâts d'explosion : 1-5 HP (inversement proportionnel à la distance)
- Couleur : Orange (150, 100, 50)
- Effet visuel : Pulsation orange
- Rayon : 11 pixels
```

#### 5. **Zombie Boss** (spawn périodique)
```
- Santé : Niveau * 10
- Vitesse : 3 unités/frame
- Dégâts de base : 2.0 HP (énorme)
- Fréquence d'attaque : 18 frames
- Rayon de détection : 300 pixels (voit très loin)
- Couleur : Violet (150, 50, 150)
- Effet visuel : Aura violette avec anneaux
- Rayon : 30 pixels
- Spawn : Toutes les 30 secondes (niveau 2+)
```

### Comportements IA

#### Mode Idle (Joueur > 200 pixels)
```
1. FLOCK avec les zombies proches (perceptionRadius = 80)
   - Alignment weight : 1.0
   - Cohesion weight : 1.2
   - Separation weight : 1.5

2. WANDER pour mouvement naturel
   - Weight : 0.5

3. AVOID obstacles proches
   - Weight : 1.25 (50% de la force normale)
```

#### Mode Chase (Joueur < 200 pixels)
```
1. PURSUE le joueur
   - Weight : 3.0 (priorité absolue)
   - Prédiction sur 15 frames

2. SEPARATION avec autres zombies
   - Weight : 1.5 (éviter surpopulation)

3. AVOID obstacles
   - Weight : 2.5 (éviter de rester coincé)
```

### Système de Dégâts au Joueur
```
Si collision avec joueur:
    temps_contact++
    multiplicateur = 1 + (temps_contact / 60)  // +100% par seconde
    
    Tous les X frames (selon type):
        dégâts = dégâts_base * multiplicateur
        joueur.takeDamage(dégâts)
        screen_shake si Tank ou Boss
        
Sinon:
    temps_contact = 0  // Reset
```

### Respawn Automatique
```
Si distance > 1500 pixels:
    Zombie respawn près du joueur
    
Spawn périodique:
    - Intervalle de base : 30 secondes (1800 frames)
    - Ajusté par difficulté adaptative
    - Maximum : 50 * difficulté
```

---

## 🚀 Système de Missiles

### Propriétés
```
- Rayon : 4 pixels
- Vitesse initiale : 2 unités/frame
- Vitesse max : 12 unités/frame
- Accélération : 0.1 unités/frame² (crescendo)
- Force de steering : 0.15
- Durée de vie : 180 frames (3 secondes)
- Dégâts : 1 HP
```

### Comportement
```
1. PURSUE la cible assignée
2. Accélération progressive (2 → 12 unités/frame)
3. Destruction au contact ou après timeout
4. Trail lumineux de 10 positions
```

### Effets Visuels
- **Halos** : 3 cercles de lueur orange décroissante
- **Traînée** : 10 positions précédentes avec alpha décroissant
- **Corps** : Forme de fusée avec flammes arrière
- **Couleurs** : Jaune-orangé (255, 220, 100)

---

## 💎 Ressources et Collectibles

### Types de Ressources

#### 1. **Resource (Gold)** - 50% spawn
```
- Couleur : Or (255, 200, 50)
- Effet : +1 point de ressource
- Rayon : 8 pixels
- Comportement : Statique
```

#### 2. **Medkit (Red)** - 20-40% spawn (adaptatif)
```
- Couleur : Rouge (255, 50, 50)
- Effet : +30 HP (jusqu'à max 50)
- Rayon : 8 pixels
- Comportement : Statique
```

#### 3. **Ammo (Purple)** - 30% spawn
```
- Couleur : Magenta (255, 100, 255)
- Effet : +1 munition (7 = Power-Up)
- Rayon : 10 pixels (plus gros)
- Comportement : ATTIRÉ par le joueur si distance < 150 pixels
- Utilise : arrive(player.pos, 50)
```

### Spawn Adaptatif
```
Si difficulté < 0.8 (joueur galère):
    - 30% resources
    - 40% medkits
    - 30% ammo
    
Si difficulté > 1.3 (joueur domine):
    - 70% resources
    - 15% medkits
    - 15% ammo
    
Sinon (normal):
    - 50% resources
    - 20% medkits
    - 30% ammo
```

---

## 🛡️ Zones de Sécurité

### Propriétés
```
- Nombre total : 3
- Rayon : 120 pixels
- Temps d'activation : 180 frames (3 secondes)
- Couleur inactive : Bleu (50, 150, 255)
- Couleur active : Vert (50, 255, 50)
```

### Règles d'Activation
```
Si joueur dans zone:
    progression++
    Si progression >= 180:
        zone.activated = true
        safeZonesActivated++
Sinon:
    progression = max(0, progression - 2)  // Décrementation lente
```

### Effet sur les Zombies
```
Pour chaque zombie:
    Si distance < rayon + 50:
        Force de repoussée = (zombie.pos - zone.pos).normalize() * 3
        zombie.applyForce(force)
```

### Effets Visuels
- **Anneau pulsant** : sin(phase) * 10
- **Barre de progression** : Arc de cercle 0-360° selon avancement
- **Label** : "SAFE ZONE" ou "ACTIVATED"
- **Centre** : Marqueur blanc de 10 pixels

---

## 📊 Système de Difficulté Adaptative

### Calcul du Score de Performance
```
Score = 0

// Critère 1: Santé (40%)
Si HP > 70%: Score += 0.8
Si HP > 40%: Score += 0.4
Sinon:       Score += 0.1

// Critère 2: Taux d'élimination (40%)
kill_rate = zombies_tués / secondes_jouées
Si kill_rate > 0.5: Score += 0.8
Si kill_rate > 0.2: Score += 0.4
Sinon:              Score += 0.1

// Critère 3: Résistance (20%)
damage_rate = dégâts_totaux / secondes_jouées
Si damage_rate < 0.5: Score += 0.4
Si damage_rate < 2:   Score += 0.2
```

### Ajustement de Difficulté
```
difficulté_cible = constrain(score, 0.6, 1.8)
difficulté = lerp(difficulté_actuelle, difficulté_cible, 0.1)  // Transition douce

Si difficulté > 1.2 (joueur domine):
    - Spawn zombies : intervalle / (1 + (difficulté - 1) * 0.5)
    - Spawn ressources : intervalle * (1 + (difficulté - 1) * 0.3)
    - Max zombies : 50 * difficulté
    
Si difficulté < 0.8 (joueur galère):
    - Spawn zombies : intervalle * (1.5 - difficulté * 0.5)
    - Spawn ressources : intervalle / (1.5 - difficulté * 0.5)
    
Vérification: Toutes les 300 frames (5 secondes)
```

### Indicateur Visuel
```
difficulté < 0.8  : ⬇️ Easier  (Vert)
difficulté > 1.3  : ⬆️ Harder  (Rouge)
difficulté normal : ➡️ Normal  (Gris)
```

---

## 🎨 Effets Visuels

### Screen Shake
```
Déclenchement:
    - Contact avec Tank : intensité = 10 + dégâts
    - Contact avec Boss : intensité = 15 + dégâts
    - Cooldown global : 120 frames (2 secondes)
    
Effet:
    camera.x += random(-intensité, +intensité)
    camera.y += random(-intensité, +intensité)
    intensité *= 0.9  // Décroissance
```

### Aberration Chromatique
```
Activation: Quand HP est bas
Intensité = map(HP, 0, max_HP, 8, 0)

Effet:
    Canal Rouge : décalé de -offset pixels (gauche)
    Canal Vert : position normale
    Canal Bleu : décalé de +offset pixels (droite)
```

### Slow Motion
```
Activation: HP < 30% du maximum
Effet: frameRate(30)  // Au lieu de 60

Désactivation: HP >= 30%
Effet: frameRate(60)  // Retour normal
```

### Aura du Joueur
```
HP > 70%:
    - Couleur : Vert (100, 255, 100, 80)
    - Taille : rayon * 1.3
    
HP > 40%:
    - Couleur : Jaune (255, 255, 100, 100)
    - Taille : rayon * 1.5
    
HP < 40%:
    - Couleur : Rouge pulsant (255, 100, 100, 100-200)
    - Taille : rayon * 1.8
    - Aura secondaire rouge
```

### Effets d'Explosion (Zombie Explosif)
```
Durée : 30 frames (0.5 seconde)
Rayon : 100 → 300 pixels (progression)
Alpha : 255 → 0 (fade out)

Cercle extérieur : Orange stroke (255, 150, 0)
Cercle intérieur : Orange fill (255, 100, 0, 50%)
```

### Traînée de Sprint
```
Création : Une particule tous les 3 frames
Durée de vie : 30 frames
Couleur : Cyan (100, 255, 255)
Taille : 8 → 2 pixels (décroissance)
Maximum : 50 particules simultanées
```

### Système de Particules
```
Maximum global : 300 particules
Par explosion zombie : 20 particules (réduit si limite proche)

Propriétés particule:
    - Vitesse : random(2, 6) dans direction aléatoire
    - Gravité : 0.2 vers le bas
    - Friction : 0.95
    - Durée : 60 frames
    - Taille : random(3, 8)
```

---

## 🏆 Conditions de Victoire/Défaite

### 🎉 VICTOIRE
```
Condition: safeZonesActivated >= 3

Écran de victoire:
    - Titre : "YOU SURVIVED!" (vert)
    - Ressources collectées
    - Zombies éliminés
    - Temps de survie
    - Option : Appuyer R pour recommencer
```

### ☠️ DÉFAITE
```
Condition: player.health <= 0

Écran de défaite:
    - Titre : "YOU DIED" (rouge)
    - Ressources collectées
    - Zombies éliminés
    - Temps de survie
    - Option : Appuyer R pour recommencer
```

### 📈 Progression
```
Niveau actuel : Affecte la santé des zombies
Zombies tués : Compteur global
Dégâts reçus : Total cumulé
Tirs effectués : Nombre de missiles lancés
Précision : (Zombies tués / Tirs) * 100
```

---

## 🌍 Monde du Jeu

### Dimensions
```
- Taille du monde : 4000 x 4000 unités
- Obstacles : 100 (rayon 20-60 pixels)
- Distance max zombies : 1500 pixels (respawn au-delà)
- Caméra : Suit le joueur avec offset centré
```

### Grid Hexagonal
```
- Taille hexagone : 80 pixels
- Couleur : (100, 120, 100, 20) - Vert transparent
- Offset vertical : hexSize * sqrt(3)
- Offset horizontal : hexSize * 1.5
- Culling : Seulement hexagones visibles affichés
```

### MiniMap (Coin inférieur droit)
```
- Rayon : 80 pixels
- Échelle : 1000 unités de monde
- Joueur : Point vert au centre
- Zombies : Points rouges (couleur selon type)
- Zones : Cercles bleus/verts
- Ressources : Points jaunes (max 20 affichées)
- Zones dangereuses : Cercles rouges (groupes 5+ zombies)
```

### Indicateurs Hors-Écran
```
Pour chaque zombie invisible:
    - Triangle pointé vers sa direction
    - Couleur selon type
    - Taille selon importance
    - Distance affichée en texte
    - Position : Bord de l'écran - 50 pixels
```

---

## ⌨️ Contrôles Complets

```
DÉPLACEMENT:
    W / ↑         : Avancer
    S / ↓         : Reculer
    A / ←         : Gauche
    D / →         : Droite
    SHIFT         : Sprint (vitesse +40%)

ACTIONS:
    CLIC GAUCHE   : Tirer des missiles
    ESPACE        : Lampe torche (cooldown 10s)

INTERFACE:
    P             : Pause/Reprendre
    D             : Mode debug (affiche cercles de steering)
    R             : Redémarrer (si game over)
    ESC           : (Non implémenté)
```

---

## 📚 Hiérarchie des Classes

```
Vehicle (classe de base)
    ├─ Player
    ├─ Zombie
    │   ├─ Normal
    │   ├─ Fast
    │   ├─ Tank
    │   ├─ Explosive
    │   └─ Boss
    ├─ Missile
    └─ Resource
        ├─ BasicResource
        ├─ Medkit
        └─ Ammo (avec comportement arrive)

Boid (classe alternative pour flocking pur)
    └─ Utilisé dans les exemples de base

Autres:
    ├─ Obstacle (statique)
    ├─ SafeZone
    ├─ Particle
    └─ ParticleSystem
```

---

## 🔧 Paramètres de Débogage

```
Vehicle.debug = true/false
    - Affiche les cercles de wander
    - Affiche les vecteurs de steering
    - Affiche les zones de perception
    - Affiche les points ahead pour évitement

Informations Console:
    - Activation lampe torche
    - Spawn boss
    - Collection ressources/munitions
    - Power-up activation
    - Ajustements de difficulté (tous les 10s)
```

---

## 📊 Statistiques de Pause (Menu P)

```
⏱️  Temps de survie
💀 Zombies tués
📈 Niveau actuel
🎯 Tirs effectués
🎯 Précision (%)
❤️  Dégâts pris
💚 Santé actuelle
💰 Ressources collectées
🔫 Munitions actuelles
```

---

## 🎭 Poids des Comportements (Résumé)

### Zombies (Mode Idle)
```
Alignment   : 1.0
Cohesion    : 1.2
Separation  : 1.5
Wander      : 0.5
Avoid       : 1.25
```

### Zombies (Mode Chase)
```
Pursue      : 3.0  ⭐ Priorité
Separation  : 1.5
Avoid       : 2.5
```

### Player
```
Input direct (pas de steering strict)
Friction    : 0.9 quand repos
```

### Missiles
```
Pursue only : 1.0 (force 0.15)
Accélération progressive
```

---

**Fin du document des règles. Pour toute question ou ajustement, référez-vous au code source.**
