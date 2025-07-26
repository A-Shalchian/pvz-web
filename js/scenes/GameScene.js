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
        // Create simple colored rectangles as placeholders for sprites
        this.load.image('grass', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        
        // We'll create graphics programmatically instead of loading images
    }

    create() {
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
        
        // Start game loops
        this.time.addEvent({
            delay: 1000,
            callback: this.gameLoop,
            callbackScope: this,
            loop: true
        });
        
        // Initial sun drop
        this.dropSun();
    }

    initializeGrid() {
        // 9 columns x 5 rows grid
        this.grid = [];
        for (let x = 0; x < 9; x++) {
            this.grid[x] = [];
            for (let y = 0; y < 5; y++) {
                this.grid[x][y] = null; // null means empty, otherwise contains plant reference
            }
        }
    }

    createBackground() {
        // Create lawn background
        const lawnColor = 0x228B22;
        this.add.rectangle(600, 300, 1200, 600, lawnColor);
        
        // Draw grid lines for visual reference
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.2);
        
        const gridStartX = 200;
        const gridStartY = 100;
        const cellWidth = 80;
        const cellHeight = 100;
        
        // Vertical lines
        for (let x = 0; x <= 9; x++) {
            const lineX = gridStartX + (x * cellWidth);
            graphics.moveTo(lineX, gridStartY);
            graphics.lineTo(lineX, gridStartY + (5 * cellHeight));
        }
        
        // Horizontal lines
        for (let y = 0; y <= 5; y++) {
            const lineY = gridStartY + (y * cellHeight);
            graphics.moveTo(gridStartX, lineY);
            graphics.lineTo(gridStartX + (9 * cellWidth), lineY);
        }
        
        graphics.strokePath();
        
        // Add lane backgrounds
        for (let y = 0; y < 5; y++) {
            const laneY = gridStartY + (y * cellHeight) + (cellHeight / 2);
            const laneColor = y % 2 === 0 ? 0x32CD32 : 0x228B22;
            this.add.rectangle(600, laneY, 1200, cellHeight, laneColor, 0.3);
        }
    }

    onPointerDown(pointer) {
        if (!window.gameState.selectedPlant) return;
        
        const gridPos = window.gameUtils.screenToGrid(pointer.x, pointer.y);
        
        if (window.gameUtils.isValidGridPosition(gridPos.x, gridPos.y)) {
            this.placePlant(gridPos.x, gridPos.y, window.gameState.selectedPlant);
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
        
        // Deselect plant
        window.gameState.selectedPlant = null;
        document.querySelectorAll('.plant-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    spawnZombie() {
        const lane = Phaser.Math.Between(0, 4);
        const screenPos = window.gameUtils.gridToScreen(9, lane);
        screenPos.x += 100; // Start off-screen
        
        const zombie = new Zombie(this, screenPos.x, screenPos.y, 'basic', lane);
        this.zombies.push(zombie);
        this.zombiesGroup.add(zombie.sprite);
    }

    dropSun() {
        const x = Phaser.Math.Between(200, 1000);
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
            
            if (projectile.x > 1250 || projectile.shouldDestroy) {
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
