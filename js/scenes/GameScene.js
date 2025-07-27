class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.grid = [];
        this.lastZombieSpawn = 0;
        this.zombieSpawnDelay = 3000; // 3 seconds
        this.lastSunDrop = 0;
        this.sunDropDelay = 10000; // 10 seconds
    }

    preload() {
        // Create grass tile textures programmatically
        this.createGrassTextures();
        
        // We'll create graphics programmatically instead of loading images
    }

    createGrassTextures() {
        // Create grass tile texture
        const grassGraphics = this.add.graphics();
        
        // Base grass color
        grassGraphics.fillStyle(0x228B22);
        grassGraphics.fillRect(0, 0, 80, 100);
        
        // Add grass texture details
        grassGraphics.fillStyle(0x32CD32);
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 80;
            const y = Math.random() * 100;
            grassGraphics.fillRect(x, y, 2, 8);
        }
        
        // Add some darker grass patches
        grassGraphics.fillStyle(0x1F5F1F);
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 80;
            const y = Math.random() * 100;
            grassGraphics.fillRect(x, y, 3, 3);
        }
        
        // Generate texture from graphics
        grassGraphics.generateTexture('grassTile', 80, 100);
        grassGraphics.destroy();
        
        // Create darker grass tile for alternating rows
        const darkGrassGraphics = this.add.graphics();
        darkGrassGraphics.fillStyle(0x1F5F1F);
        darkGrassGraphics.fillRect(0, 0, 80, 100);
        
        // Add lighter grass details
        darkGrassGraphics.fillStyle(0x228B22);
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 80;
            const y = Math.random() * 100;
            darkGrassGraphics.fillRect(x, y, 2, 6);
        }
        
        darkGrassGraphics.generateTexture('darkGrassTile', 80, 100);
        darkGrassGraphics.destroy();
    }

    create() {
        // Initialize Three.js manager for 3D zombies
        if (!window.threeManager) {
            window.threeManager = new ThreeManager();
        }
        
        // Initialize grid
        this.initializeGrid();
        
        // Create background
        this.createBackground();
        
        // Create groups for game objects
        this.plantsGroup = this.add.group();
        this.zombiesGroup = this.add.group();
        this.projectilesGroup = this.add.group();
        this.sunsGroup = this.add.group();
        
        // Set up input
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        
        // Initialize tile highlighting
        this.highlightedTile = null;
        this.tileHighlight = null;
        
        // Game loop will run in the update method
        
        // Initial sun drop
        this.dropSun();
        
        // Add resize handler
        this.scale.on('resize', this.handleResize, this);
    }
    
    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        this.cameras.resize(width, height);
        
        // Reinitialize grid with new dimensions
        this.initializeGrid();
        this.createBackground();
    }
    
    update() {
        // Run the game loop every frame for smooth movement
        this.gameLoop();
    }

    initializeGrid() {
        // Calculate grid dimensions based on screen size
        this.gridRows = 5; // Always 5 rows
        this.gridCols = Math.max(8, Math.floor(this.cameras.main.width / 80)); // At least 8 columns
        
        // Calculate cell dimensions to fill screen
        this.cellWidth = this.cameras.main.width / this.gridCols;
        this.cellHeight = this.cameras.main.height / this.gridRows;
        this.gridStartX = 0;
        this.gridStartY = 0;
        
        this.grid = [];
        for (let x = 0; x < this.gridCols; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridRows; y++) {
                this.grid[x][y] = null; // null means empty, otherwise contains plant reference
            }
        }
    }

    createBackground() {
        // Create sky background that fills the screen
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, this.cameras.main.width, this.cameras.main.height, 0x87CEEB);
        
        // Grid properties are now set in initializeGrid()
        
        // Create grass tiles for the lawn
        this.grassTiles = [];
        for (let row = 0; row < this.gridRows; row++) {
            this.grassTiles[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                const x = this.gridStartX + (col * this.cellWidth) + (this.cellWidth / 2);
                const y = this.gridStartY + (row * this.cellHeight) + (this.cellHeight / 2);
                
                // Alternate between grass textures for visual variety
                const textureKey = (row + col) % 2 === 0 ? 'grassTile' : 'darkGrassTile';
                const grassTile = this.add.image(x, y, textureKey);
                grassTile.setOrigin(0.5, 0.5);
                
                // Add subtle shadow effect
                grassTile.setTint(0xE6E6E6);
                
                // Store tile reference
                this.grassTiles[row][col] = grassTile;
            }
        }
        
        // Create lawn border
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(4, 0x8B4513, 1); // Brown border
        borderGraphics.strokeRect(this.gridStartX - 2, this.gridStartY - 2, this.gridCols * this.cellWidth + 4, this.gridRows * this.cellHeight + 4);
        
        // Add subtle grid lines for plant placement guidance
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x000000, 0.1);
        
        // Vertical lines
        for (let x = 0; x <= this.gridCols; x++) {
            const lineX = this.gridStartX + (x * this.cellWidth);
            gridGraphics.moveTo(lineX, this.gridStartY);
            gridGraphics.lineTo(lineX, this.gridStartY + (this.gridRows * this.cellHeight));
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridRows; y++) {
            const lineY = this.gridStartY + (y * this.cellHeight);
            gridGraphics.moveTo(this.gridStartX, lineY);
            gridGraphics.lineTo(this.gridStartX + (this.gridCols * this.cellWidth), lineY);
        }
        
        gridGraphics.strokePath();
        
        // Add decorative elements
        this.addDecorations();
    }
    
    addDecorations() {
        // Add some flowers and decorative elements around the lawn
        const decorations = [
            { x: 150, y: 150, emoji: '🌸', scale: 0.8 },
            { x: 170, y: 200, emoji: '🌺', scale: 0.6 },
            { x: 160, y: 350, emoji: '🌼', scale: 0.7 },
            { x: 140, y: 450, emoji: '🌻', scale: 0.9 },
            { x: 950, y: 120, emoji: '🌿', scale: 0.8 },
            { x: 970, y: 180, emoji: '🍄', scale: 0.6 },
            { x: 960, y: 380, emoji: '🌱', scale: 0.7 },
            { x: 940, y: 480, emoji: '🌾', scale: 0.8 }
        ];
        
        decorations.forEach(decoration => {
            const text = this.add.text(decoration.x, decoration.y, decoration.emoji, {
                fontSize: '24px'
            });
            text.setScale(decoration.scale);
            text.setOrigin(0.5, 0.5);
        });
        
        // Add house in the background
        const houseGraphics = this.add.graphics();
        houseGraphics.fillStyle(0x8B4513); // Brown
        houseGraphics.fillRect(50, 50, 100, 80);
        houseGraphics.fillStyle(0xFF0000); // Red roof
        houseGraphics.fillTriangle(50, 50, 150, 50, 100, 20);
        houseGraphics.fillStyle(0x654321); // Door
        houseGraphics.fillRect(90, 100, 20, 30);
        houseGraphics.fillStyle(0x87CEEB); // Window
        houseGraphics.fillRect(70, 70, 15, 15);
        houseGraphics.fillRect(115, 70, 15, 15);
    }

    onPointerDown(pointer) {
        if (!window.gameState.selectedPlant) return;
        
        const gridPos = window.gameUtils.screenToGrid(pointer.x, pointer.y);
        
        if (window.gameUtils.isValidGridPosition(gridPos.x, gridPos.y)) {
            this.placePlant(gridPos.x, gridPos.y, window.gameState.selectedPlant);
        }
    }
    
    onPointerMove(pointer) {
        if (!window.gameState.selectedPlant) {
            this.clearTileHighlight();
            return;
        }
        
        const gridPos = window.gameUtils.screenToGrid(pointer.x, pointer.y);
        
        if (window.gameUtils.isValidGridPosition(gridPos.x, gridPos.y)) {
            this.highlightTile(gridPos.x, gridPos.y);
        } else {
            this.clearTileHighlight();
        }
    }
    
    highlightTile(gridX, gridY) {
        // Clear previous highlight
        this.clearTileHighlight();
        
        // Don't highlight if tile is occupied
        if (this.grid[gridX][gridY] !== null) return;
        
        const screenPos = window.gameUtils.gridToScreen(gridX, gridY);
        
        // Create highlight effect
        this.tileHighlight = this.add.graphics();
        this.tileHighlight.lineStyle(3, 0x00FF00, 0.8);
        this.tileHighlight.fillStyle(0x00FF00, 0.2);
        this.tileHighlight.fillRect(screenPos.x - 40, screenPos.y - 50, 80, 100);
        this.tileHighlight.strokeRect(screenPos.x - 40, screenPos.y - 50, 80, 100);
        
        // Add pulsing effect
        this.tweens.add({
            targets: this.tileHighlight,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.highlightedTile = { x: gridX, y: gridY };
    }
    
    clearTileHighlight() {
        if (this.tileHighlight) {
            this.tileHighlight.destroy();
            this.tileHighlight = null;
        }
        this.highlightedTile = null;
    }
    
    addPlantingEffect(gridX, gridY) {
        // Darken the grass tile to show it's been planted
        if (this.grassTiles[gridY] && this.grassTiles[gridY][gridX]) {
            const grassTile = this.grassTiles[gridY][gridX];
            grassTile.setTint(0xCCCCCC); // Slightly darker
            
            // Add a subtle glow effect
            const screenPos = window.gameUtils.gridToScreen(gridX, gridY);
            const glowEffect = this.add.graphics();
            glowEffect.fillStyle(0x90EE90, 0.3);
            glowEffect.fillCircle(screenPos.x, screenPos.y, 45);
            
            // Fade out the glow
            this.tweens.add({
                targets: glowEffect,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    glowEffect.destroy();
                }
            });
            
            // Add particle effect
            this.addPlantingParticles(screenPos.x, screenPos.y);
        }
    }
    
    addPlantingParticles(x, y) {
        // Create small dirt particles
        for (let i = 0; i < 8; i++) {
            const particle = this.add.graphics();
            particle.fillStyle(0x8B4513, 0.8); // Brown dirt color
            particle.fillRect(0, 0, 3, 3);
            particle.x = x + (Math.random() - 0.5) * 20;
            particle.y = y + (Math.random() - 0.5) * 20;
            
            // Animate particles
            this.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 40,
                y: particle.y + (Math.random() - 0.5) * 40,
                alpha: 0,
                duration: 800,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    placePlant(gridX, gridY, plantType) {
        // Check if cell is empty
        if (this.grid[gridX][gridY] !== null) return;
        
        const plantCost = window.plantData[plantType].cost;
        
        // Check if player has enough sun
        if (!window.gameUtils.spendSun(plantCost)) return;
        
        const screenPos = window.gameUtils.gridToScreen(gridX, gridY);
        const plant = new Plant(this, screenPos.x, screenPos.y, plantType, gridX, gridY);
        
        this.plants.push(plant);
        this.plantsGroup.add(plant.sprite);
        this.grid[gridX][gridY] = plant;
        
        // Add planting effect to grass tile
        this.addPlantingEffect(gridX, gridY);
        
        // Deselect plant
        window.gameState.selectedPlant = null;
        document.querySelectorAll('.plant-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Clear highlight
        this.clearTileHighlight();
    }

    spawnZombie() {
        const lane = Phaser.Math.Between(0, this.gridRows - 1);
        const screenPos = window.gameUtils.gridToScreen(this.gridCols - 1, lane);
        screenPos.x = this.cameras.main.width + 50; // Start off-screen to the right
        
        console.log(`Spawning 3D zombie at lane ${lane}, position (${screenPos.x}, ${screenPos.y})`);
        
        // Randomly choose zombie type
        const zombieTypes = ['basic', 'cone', 'bucket'];
        const zombieType = zombieTypes[Phaser.Math.Between(0, zombieTypes.length - 1)];
        
        // Create 3D zombie instead of regular zombie
        const zombie = new Zombie3D(this, screenPos.x, screenPos.y, zombieType, lane);
        this.zombies.push(zombie);
        this.zombiesGroup.add(zombie.sprite);
        
        console.log(`Total 3D zombies: ${this.zombies.length}`);
    }

    dropSun() {
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        const y = 50;
        
        const sun = new Sun(this, x, y);
        this.suns.push(sun);
        this.sunsGroup.add(sun.sprite);
    }

    gameLoop() {
        const currentTime = this.time.now;
        
        // Spawn zombies
        if (currentTime - this.lastZombieSpawn > this.zombieSpawnDelay) {
            this.spawnZombie();
            this.lastZombieSpawn = currentTime;
            
            // Gradually increase spawn rate
            this.zombieSpawnDelay = Math.max(1500, this.zombieSpawnDelay - 50);
        }
        
        // Drop sun
        if (currentTime - this.lastSunDrop > this.sunDropDelay) {
            this.dropSun();
            this.lastSunDrop = currentTime;
        }
        
        // Update game objects
        this.updatePlants();
        this.updateZombies();
        this.updateProjectiles();
        this.updateSuns();
        
        // Check collisions
        this.checkCollisions();
        
        // Check game over conditions
        this.checkGameOver();
    }

    updatePlants() {
        this.plants.forEach((plant, index) => {
            plant.update();
            
            if (plant.health <= 0) {
                plant.destroy();
                this.plants.splice(index, 1);
                this.grid[plant.gridX][plant.gridY] = null;
                window.gameState.plantsKilled++;
            }
        });
    }

    updateZombies() {
        this.zombies.forEach((zombie, index) => {
            zombie.update();
            
            if (zombie.health <= 0) {
                zombie.destroy();
                this.zombies.splice(index, 1);
                window.gameState.zombiesKilled++;
                window.gameState.score += 10;
            } else if (zombie.x < -50) {
                // Zombie reached the house
                zombie.destroy();
                this.zombies.splice(index, 1);
                this.gameOver();
            }
        });
    }

    updateProjectiles() {
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            
            if (projectile.x > this.cameras.main.width + 50 || projectile.shouldDestroy) {
                projectile.destroy();
                this.projectiles.splice(index, 1);
            }
        });
    }

    updateSuns() {
        this.suns.forEach((sun, index) => {
            sun.update();
            
            if (sun.shouldDestroy) {
                sun.destroy();
                this.suns.splice(index, 1);
            }
        });
    }

    checkCollisions() {
        // Projectile vs Zombie collisions
        this.projectiles.forEach(projectile => {
            this.zombies.forEach(zombie => {
                if (projectile.lane === zombie.lane && 
                    Math.abs(projectile.x - zombie.x) < 30 &&
                    Math.abs(projectile.y - zombie.y) < 30) {
                    
                    zombie.takeDamage(projectile.damage);
                    projectile.shouldDestroy = true;
                }
            });
        });
        
        // Zombie vs Plant collisions
        this.zombies.forEach(zombie => {
            this.plants.forEach(plant => {
                if (zombie.lane === plant.gridY &&
                    Math.abs(zombie.x - plant.x) < 40 &&
                    Math.abs(zombie.y - plant.y) < 40) {
                    
                    zombie.startEating(plant);
                }
            });
        });
    }

    checkGameOver() {
        // Simple game over condition - could be expanded
        if (window.gameState.plantsKilled > 10) {
            this.gameOver();
        }
    }

    gameOver() {
        window.gameState.gameRunning = false;
        
        // Display game over message
        const gameOverText = this.add.text(600, 300, 'GAME OVER!', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(600, 380, `Score: ${window.gameState.score}`, {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        const restartText = this.add.text(600, 450, 'Refresh page to restart', {
            fontSize: '24px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    // Helper method to add projectiles
    addProjectile(projectile) {
        this.projectiles.push(projectile);
        this.projectilesGroup.add(projectile.sprite);
    }
}
