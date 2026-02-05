# 🧟 Zombie Swarm Survival

A survival game built with p5.js featuring intelligent zombie AI using flocking behaviors (boids) combined with pursuit and obstacle avoidance algorithms.

## 🎮 How to Play

### Objective
Survive the zombie swarm and activate all 3 safe zones to win!

### Controls
- **WASD** or **Arrow Keys**: Move your character
- **SHIFT**: Sprint (move faster)
- **SPACE**: Use flashlight (pushes zombies away, 10-second cooldown)
- **D**: Toggle debug mode (shows detection radiuses)
- **R**: Restart game (when game over)

### Gameplay Mechanics

#### Player
- **Health**: 100 HP (displayed in top-left corner)
- **Movement**: Control with keyboard, sprint for faster movement
- **Flashlight**: Special ability that creates a large radius pushing zombies away temporarily
- **Invincibility Frames**: Brief immunity after taking damage (player flashes)

#### Zombies (AI)
Zombies use advanced steering behaviors:
- **Flocking**: When idle, zombies move in coordinated groups
  - Alignment: Match velocity with nearby zombies
  - Cohesion: Move toward group center
  - Separation: Maintain personal space
- **Pursue**: When player is detected (200px radius), zombies predict player movement and chase
- **Obstacle Avoidance**: Intelligently navigate around obstacles
- **Wander**: Random exploration when no player detected

#### Resources
- **Gold Resources** (yellow): Increase score, scattered throughout world
- **Medkits** (red): Restore 30 health points
- Automatically collected when touching player

#### Safe Zones
- **Blue pulsing circles**: Areas where zombies cannot enter
- **Activation**: Stand inside for 3 seconds to activate
- **Progress Bar**: Shows activation progress
- **Objective**: Activate all 3 safe zones to win

#### Obstacles
- Gray circular debris scattered throughout the world
- Block both player and zombie movement
- Zombies intelligently avoid them using ahead-vector detection

### Win/Lose Conditions

**You Win When:**
- All 3 safe zones are activated ✓

**You Lose When:**
- Your health reaches 0 ✗

## 🧠 AI Behaviors Implemented

This game showcases all the steering behaviors from the course:

1. **Seek**: Basic movement toward target
2. **Pursue**: Predict future position and intercept
3. **Flee**: Move away from danger (flashlight)
4. **Wander**: Smooth random movement
5. **Obstacle Avoidance**: Look-ahead vector for collision prevention
6. **Separation**: Maintain distance from neighbors
7. **Alignment**: Match group velocity
8. **Cohesion**: Stay together as a group
9. **Boundaries**: (implicit in camera system)

## 🎨 Visual Features

- **Dark apocalyptic theme**: Hexagonal grid background
- **Camera system**: Follows player smoothly
- **Infinite world**: 4000x4000 unit scrolling world
- **Zombie visuals**: 
  - Gray-green body when idle
  - Red tint when chasing
  - Red eyes pointing in movement direction
  - Red glow effect during pursuit
- **Resource glow effects**: Multi-layer circles for depth
- **Safe zone animations**: Pulsing rings and progress indicators
- **Mini-map**: Shows zombies, resources, and safe zones relative to player
- **HUD**: Health bar, resource count, zombie count, time, controls

## 📊 Game Stats Tracked

- Health (current/max)
- Resources collected
- Active zombie count
- Time survived
- Safe zones activated (X/3)

## 🛠️ Technical Implementation

### File Structure
```
7-Boids/
├── index.html           # Main HTML file
├── sketch.js            # Game loop, rendering, camera system
├── player.js            # Player class with controls
├── zombie.js            # Zombie AI with flocking + pursue
├── gameEntities.js      # Resource and SafeZone classes
├── obstacle.js          # Obstacle class (existing)
└── style.css            # Styling
```

### Key Features
- **Camera System**: World-space to screen-space conversion
- **Culling**: Only render/update entities visible on screen
- **Spawning System**: Periodic zombie spawns at screen edges
- **Collision Detection**: Circle-circle for all entities
- **Spatial Organization**: Hexagonal grid visual system

### Performance Optimizations
- Viewport culling (only draw visible entities)
- Limited mini-map resource rendering (20 nearest)
- Frame-based spawning (not every frame)
- Maximum zombie cap (50)

## 🎯 Difficulty Progression

- **Start**: 15 zombies
- **Spawning**: +1 zombie every 30 seconds
- **Maximum**: 50 zombies total
- **Zombie Speed**: 3 units/sec (player: 5 normal, 7 sprint)
- **Detection Range**: 200 pixels

## 🐛 Debug Mode

Press **D** to toggle debug visualization:
- Zombie detection circles (white)
- Obstacle avoidance zones
- Perception radiuses

## 💡 Strategy Tips

1. **Use Obstacles**: Zombies avoid obstacles - use them as cover
2. **Sprint Wisely**: Sprinting is faster but you're more exposed
3. **Flashlight Timing**: Save flashlight for emergencies (10s cooldown)
4. **Collect Resources**: Stay healthy by grabbing medkits
5. **Safe Zone Planning**: Plan your route to safe zones carefully
6. **Zombie Behavior**: Zombies swarm - lead them away before activating zones

## 🚀 How to Run

1. Open `index.html` in a modern web browser
2. Or use Live Server in VS Code
3. Or run a local HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server
   ```
4. Navigate to the hosted URL

## 📚 Educational Value

This project demonstrates:
- Autonomous agent behaviors (Craig Reynolds' steering behaviors)
- Flocking algorithms (boids)
- State machines (idle vs. chase mode)
- Vector mathematics in game development
- Camera systems and world-space rendering
- Game loop architecture
- Collision detection systems
- UI/HUD design patterns

## 🎓 Course Alignment

This game integrates concepts from folders 1-7:
- **1-Seek**: Basic movement toward target
- **2-PursueEvade**: Zombie chase behavior
- **3-Arrival**: Smooth movement approach (implicit)
- **4-Wander**: Idle zombie behavior
- **5-PathFollowing**: Implicit in movement smoothness
- **6-ObstacleAvoidance**: Zombie navigation
- **7-Boids**: Core zombie flocking AI

---

**Built with p5.js** | **Course**: M2 IA2 CASA G2 2025-2026
