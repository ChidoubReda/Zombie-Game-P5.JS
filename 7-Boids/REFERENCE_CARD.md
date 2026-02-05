# 🎮 Zombie Swarm Survival - Quick Reference Card

## 🕹️ CONTROLS
```
┌─────────────────────────────────────┐
│  WASD / ↑←↓→    Movement            │
│  SHIFT          Sprint              │
│  SPACE          Flashlight (10s CD) │
│  D              Debug Mode          │
│  R              Restart (Game Over) │
└─────────────────────────────────────┘
```

## 🎯 OBJECTIVES
```
1. Stay alive (don't let health reach 0)
2. Collect resources (yellow circles)
3. Reach safe zones (blue pulsing circles)
4. Activate all 3 safe zones to WIN!
```

## 👤 PLAYER
```
Health: ████████████ 100/100
Speed:  Normal: 5  |  Sprint: 7
Radius: 16px
Color:  Green
```

## 🧟 ZOMBIES
```
Idle State:
  - Gray-green color
  - Wander + Flock together
  - Form organic swarms
  
Chase State (You're within 200px!):
  - Reddish tint
  - Red glowing eyes
  - Pursue your predicted position
  - Still avoid obstacles

Speed:  3 (slower than you!)
Damage: 0.5 HP per frame
Max:    50 zombies
```

## 🗺️ WORLD ENTITIES

### Resources
```
⭐ Gold (Yellow)    → +1 Score
❤️  Medkit (Red)    → +30 Health
```

### Safe Zones
```
🔵 Blue Pulsing    → Not activated
   Stand inside for 3 seconds
   Progress bar shows activation %
   Zombies CANNOT enter!

🟢 Green          → Activated
   Goal: Activate all 3
```

### Obstacles
```
⚫ Gray Circles    → Debris/Ruins
   Block movement
   Zombies avoid them
   Use strategically!
```

## 📊 HUD LAYOUT
```
┌─────────────────────────────────────┐
│ Health: 80/100        Zombies: 23   │
│ ████████░░            Time: 3:42    │
│ Resources: 15         Zones: 1/3    │
├─────────────────────────────────────┤
│                                     │
│         [GAME WORLD]                │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [SPACE] Flashlight      [MINI-MAP]  │
│ WASD - Move             • You       │
│ SHIFT - Sprint          • Zombies   │
│ D - Debug               ○ Zones     │
└─────────────────────────────────────┘
```

## 🎯 STRATEGY TIPS

### Beginner Tips
```
1. Keep moving - standing still = death
2. Use SHIFT to outrun zombie groups
3. Save flashlight for emergencies
4. Collect medkits BEFORE full health
5. Lead zombies AWAY from safe zones
```

### Advanced Tips
```
1. Use obstacles to break line of sight
2. Zombies slow down in tight spaces
3. Sprint creates more distance quickly
4. Flashlight has 150px radius - use wisely
5. Safe zones push zombies back - use as barriers
```

### Pro Tips
```
1. Zombies predict your movement - change direction!
2. Flocking makes them slower in turns
3. Split large groups using obstacles
4. Circle around obstacles to lose pursuers
5. Activate zones when zombies are far away
```

## 🧠 ZOMBIE AI EXPLAINED

### Idle Mode (No player nearby)
```
Behavior Mix:
├─ Wander        (50%) → Random exploration
├─ Alignment     (100%) → Match neighbor speed
├─ Cohesion      (120%) → Stay with group
└─ Separation    (150%) → Don't clump

Result: Natural-looking zombie horde
```

### Chase Mode (You detected!)
```
Behavior Priority:
├─ Pursue        (300%) → DOMINANT - Chase you!
├─ Avoid         (250%) → Dodge obstacles
└─ Separation    (150%) → Don't collide

Result: Smart hunting behavior
```

## 📈 PROGRESSION

### Early Game (0-2 min)
- 15 zombies
- Learn mechanics
- Collect resources safely

### Mid Game (2-5 min)
- 20-30 zombies
- Increased pressure
- First safe zone attempt

### Late Game (5+ min)
- 40-50 zombies
- High difficulty
- Final safe zones risky

## 🏆 WIN CONDITIONS

```
✅ All 3 safe zones activated
   = YOU SURVIVED! 🎉

❌ Health reaches 0
   = YOU DIED 💀
   (Press R to restart)
```

## 🐛 DEBUG MODE (Press D)

Shows invisible game elements:
```
- Zombie detection circles (white)
- Perception radiuses
- Obstacle avoid zones
- Force vectors (advanced)
```

## 📱 MINI-MAP KEY

```
┌─────────────┐
│    •  •     │  • Red = Zombies
│  •  ●  •    │  ● Green = You
│    •  ○     │  ○ Blue = Safe Zones
│      •      │  · Yellow = Resources
└─────────────┘
Scale: Shows 1000 units around you
```

## ⚡ SPECIAL ABILITIES

### Flashlight (SPACE)
```
Radius:     150px
Effect:     Pushes ALL zombies away
Cooldown:   10 seconds
Duration:   2 seconds
Visual:     Yellow glow around player

Best Used:
- When surrounded
- Clearing path to safe zone
- Creating escape route
```

### Sprint (SHIFT)
```
Speed Boost: +40% (5 → 7)
Cost:        None
Duration:    While held

Best Used:
- Outrunning zombie group
- Quick resource grabs
- Reaching safe zones
- Emergency escapes
```

## 🎨 COLOR CODE

```
🟢 Green    = Safe (You, Safe zones active)
🔵 Blue     = Objective (Safe zones)
🟡 Yellow   = Good (Resources)
🔴 Red      = Danger (Zombies eyes, Health low, Medkits)
⚫ Gray     = Neutral (Obstacles)
```

## 📊 GAME STATS

At game end, you'll see:
```
- Resources Collected
- Time Survived
- Safe Zones Activated
- (Future: Zombies Eliminated)
```

## 🔧 CUSTOMIZATION

Want to modify? Check these files:
```
zombie.js    → AI behavior & speed
player.js    → Health & abilities
sketch.js    → Spawn rates & world
```

---

## 🚀 QUICK START CHECKLIST

- [ ] Open index.html
- [ ] Use WASD to move
- [ ] Collect yellow resource
- [ ] Get chased by zombie
- [ ] Press SPACE (flashlight)
- [ ] Find blue safe zone
- [ ] Activate first zone (stay 3s)
- [ ] Survive and win!

---

**HAVE FUN! 🧟‍♂️🎮**

*Tip: First playthrough focus on survival and learning mechanics.  
Second playthrough aim to activate all 3 zones!*
