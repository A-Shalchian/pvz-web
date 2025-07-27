class Zombie3D {
    constructor(scene, x, y, type, lane) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.lane = lane;
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        this.speed = this.getSpeed();
        this.damage = this.getDamage();
        
        this.isEating = false;
        this.targetPlant = null;
        this.lastAttack = 0;
        this.attackDelay = 1000; // 1 second between bites
        
        // Generate unique ID for 3D tracking
        this.id = 'zombie_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        this.create3DModel();
        this.createHealthBar();
        
        console.log(`3D Zombie spawned: ${this.type} at (${this.x}, ${this.y}) in lane ${this.lane}`);
    }

    getMaxHealth() {
        const healthValues = {
            basic: 100,
            cone: 200,
            bucket: 300
        };
        return healthValues[this.type] || 100;
    }

    getSpeed() {
        const speedValues = {
            basic: 0.3,  // Much slower like original PvZ
            cone: 0.25,  // Cone zombies are slower
            bucket: 0.2  // Bucket zombies are slowest
        };
        return speedValues[this.type] || 0.3;
    }

    getDamage() {
        const damageValues = {
            basic: 20,
            cone: 25,
            bucket: 30
        };
        return damageValues[this.type] || 20;
    }

    create3DModel() {
        // Create 3D model through ThreeManager
        if (window.threeManager) {
            this.model3D = window.threeManager.createZombie3D(this.id, this.type, this.x, this.y);
        }
        
        // Create invisible Phaser sprite for collision detection
        this.sprite = this.scene.add.rectangle(this.x, this.y, 40, 60, 0x000000, 0);
        this.sprite.setOrigin(0.5, 1);
        
        // Store reference for collision detection
        this.sprite.zombieRef = this;
    }

    createHealthBar() {
        // Create health bar background
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y - 70, 40, 6, 0x000000);
        this.healthBarBg.setOrigin(0, 0.5);
        
        // Create health bar fill
        this.healthBar = this.scene.add.rectangle(this.x, this.y - 70, 40, 4, 0x00ff00);
        this.healthBar.setOrigin(0, 0.5);
    }

    update() {
        if (this.health <= 0) {
            this.destroy();
            return;
        }

        // Check if zombie reached the left edge
        if (this.x <= -50) {
            console.log('Zombie reached the house! Game Over!');
            this.scene.gameOver();
            return;
        }

        if (!this.isEating) {
            // Move left
            this.x -= this.speed;
            
            // Update sprite position
            this.sprite.x = this.x;
            
            // Update 3D model position
            if (window.threeManager) {
                window.threeManager.updateZombie3D(this.id, this.x, this.y, this.health, this.maxHealth);
            }
            
            // Check for plants to eat
            this.checkForPlants();
        } else {
            // Attack the plant
            this.attackPlant();
        }

        // Update health bar position
        this.updateHealthBar();
    }

    checkForPlants() {
        const plants = this.scene.plants;
        for (let plant of plants) {
            if (plant.lane === this.lane && 
                Math.abs(plant.x - this.x) < 30 && 
                plant.health > 0) {
                this.startEating(plant);
                break;
            }
        }
    }

    startEating(plant) {
        this.isEating = true;
        this.targetPlant = plant;
        console.log(`Zombie started eating ${plant.type} at (${plant.x}, ${plant.y})`);
        
        // Stop walking animation in 3D
        if (window.threeManager) {
            const zombie3D = window.threeManager.zombies3D.get(this.id);
            if (zombie3D) {
                zombie3D.walkAnimation = false;
            }
        }
    }

    attackPlant() {
        if (!this.targetPlant || this.targetPlant.health <= 0) {
            this.stopEating();
            return;
        }

        const currentTime = Date.now();
        if (currentTime - this.lastAttack >= this.attackDelay) {
            this.targetPlant.takeDamage(this.damage);
            this.lastAttack = currentTime;
            
            console.log(`Zombie dealt ${this.damage} damage to ${this.targetPlant.type}`);
            
            // Add attack animation effect to 3D model
            if (window.threeManager) {
                const zombie3D = window.threeManager.zombies3D.get(this.id);
                if (zombie3D && zombie3D.model) {
                    // Quick forward lunge animation
                    zombie3D.model.position.x -= 10;
                    setTimeout(() => {
                        if (zombie3D.model) {
                            zombie3D.model.position.x += 10;
                        }
                    }, 200);
                }
            }
        }
    }

    stopEating() {
        this.isEating = false;
        this.targetPlant = null;
        
        // Resume walking animation in 3D
        if (window.threeManager) {
            const zombie3D = window.threeManager.zombies3D.get(this.id);
            if (zombie3D) {
                zombie3D.walkAnimation = true;
            }
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        console.log(`Zombie took ${damage} damage, health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.destroy();
        } else {
            // Update health bar
            this.updateHealthBar();
            
            // Update 3D model damage visualization
            if (window.threeManager) {
                window.threeManager.updateZombie3D(this.id, this.x, this.y, this.health, this.maxHealth);
            }
        }
    }

    updateHealthBar() {
        const healthPercentage = this.health / this.maxHealth;
        
        // Update health bar position
        this.healthBarBg.x = this.x - 20;
        this.healthBarBg.y = this.y - 70;
        
        this.healthBar.x = this.x - 20;
        this.healthBar.y = this.y - 70;
        
        // Update health bar width and color
        this.healthBar.displayWidth = 40 * healthPercentage;
        
        if (healthPercentage > 0.6) {
            this.healthBar.setFillStyle(0x00ff00); // Green
        } else if (healthPercentage > 0.3) {
            this.healthBar.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBar.setFillStyle(0xff0000); // Red
        }
    }

    destroy() {
        console.log(`3D Zombie destroyed at (${this.x}, ${this.y})`);
        
        // Remove from 3D scene
        if (window.threeManager) {
            window.threeManager.removeZombie3D(this.id);
        }
        
        // Remove Phaser sprites
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
        }
        
        // Remove from scene's zombie array
        const index = this.scene.zombies.indexOf(this);
        if (index > -1) {
            this.scene.zombies.splice(index, 1);
        }
    }

    // Get bounds for collision detection
    getBounds() {
        return {
            x: this.x - 20,
            y: this.y - 60,
            width: 40,
            height: 60
        };
    }
}
