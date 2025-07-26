# Plants vs Zombies - Web Edition

🏆 **Boot.dev Hackathon Entry** 🏆

A browser-based recreation of the classic Plants vs Zombies tower defense game, built with HTML5, CSS3, JavaScript, and Phaser.js for the Boot.dev Hackathon.

## Features

### Plants
- **🌻 Sunflower** (50 sun) - Produces sun every 24 seconds
- **🌱 Peashooter** (100 sun) - Shoots peas at zombies every 1.5 seconds
- **🥜 Wall-nut** (50 sun) - High health defensive plant
- **🍒 Cherry Bomb** (150 sun) - Explodes after 3 seconds, dealing massive area damage

### Zombies
- **Basic Zombie** - Standard walking zombie
- **Cone Zombie** - More health with traffic cone protection
- **Bucket Zombie** - Highest health with metal bucket armor

### Gameplay
- **Grid-based planting** - 9x5 lawn grid
- **Resource management** - Collect sun to plant defenses
- **Progressive difficulty** - Zombies spawn faster over time
- **Health system** - Plants and zombies have health bars
- **Special effects** - Explosions, projectiles, and visual feedback

## How to Play

1. **Collect Sun** - Click on falling sun or sun produced by Sunflowers
2. **Select Plants** - Click on plant cards at the top to select them
3. **Place Plants** - Click on empty grid cells to place selected plants
4. **Defend** - Plants automatically attack zombies in their lanes
5. **Survive** - Prevent zombies from reaching your house!

## Controls

- **Mouse Click** - Select plants, place plants, collect sun
- **Plant Selection** - Click plant cards to select (requires enough sun)
- **Grid Placement** - Click empty lawn squares to place plants

## Technical Details

### Built With
- **Phaser.js 3.70.0** - Game framework
- **HTML5 Canvas** - Rendering
- **CSS3** - UI styling
- **Vanilla JavaScript** - Game logic

### Project Structure
```
├── index.html          # Main game page
├── css/
│   └── style.css       # Game styling
├── js/
│   ├── main.js         # Game initialization & config
│   ├── scenes/
│   │   └── GameScene.js # Main game scene
│   └── entities/
│       ├── Plant.js    # Plant classes
│       ├── Zombie.js   # Zombie classes
│       ├── Projectile.js # Projectile system
│       └── Sun.js      # Sun collection system
└── README.md
```

## Running the Game

### Option 1: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: Direct File
Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

## Game Mechanics

### Sun Economy
- Start with 50 sun
- Collect falling sun (25 sun each)
- Sunflowers produce 25 sun every 24 seconds
- Manage resources to build effective defenses

### Combat System
- Peashooters deal 20 damage per shot
- Zombies have varying health (100-300)
- Cherry bombs deal 1800 area damage
- Wall-nuts absorb damage to protect other plants

### Wave System
- Zombies spawn every 3 seconds initially
- Spawn rate increases over time (minimum 1.5 seconds)
- Random lane selection for zombie spawning

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Performance

- Optimized for 60 FPS gameplay
- Efficient sprite management
- Minimal memory footprint
- Responsive design for different screen sizes

## Future Enhancements

- More plant types (Snow Pea, Chomper, Repeater)
- Additional zombie varieties
- Multiple levels/backgrounds
- Sound effects and music
- Power-ups and special abilities
- Mobile touch controls optimization

## Boot.dev Hackathon

🏆 **This project was created for the Boot.dev Hackathon!**

**Theme:** Web-based game development
**Timeline:** 2 days
**Challenge:** Create a fully functional browser game

**Hackathon Goals Achieved:**
- ✅ Complete tower defense gameplay
- ✅ Multiple plant and zombie types
- ✅ Resource management system
- ✅ Visual effects and animations
- ✅ Responsive design
- ✅ No external dependencies (except Phaser.js CDN)
- ✅ Immediately playable in any modern browser

## Development

Built in 2 days as a web-based tower defense game for the Boot.dev Hackathon. The game uses modern JavaScript ES6+ features and Phaser.js for efficient 2D rendering and game loop management.

**Development Highlights:**
- Rapid prototyping with Phaser.js
- Modular entity-based architecture
- Real-time collision detection
- Dynamic sprite generation
- Efficient game state management

---

**Enjoy defending your lawn! 🌱🧟‍♂️**

*Made with ❤️ for the Boot.dev Hackathon*
