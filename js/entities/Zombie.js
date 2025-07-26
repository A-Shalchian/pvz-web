class Zombie {
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
        
        this.createSprite();
        this.createHealthBar();
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
            basic: 0.5,
            cone: 0.4,
            bucket: 0.3
        };
        return speedValues[this.type] || 0.5;
    }

    getDamage() {
        const damageValues = {
            basic: 20,
            cone: 25,
            bucket: 30
        };
        return damageValues[this.type] || 20;
    }

    createSprite() {
        // Create zombie sprite
        const graphics = this.scene.add.graphics();
        
        // Body
        graphics.fillStyle(0x90EE90);
        graphics.fillRoundedRect(-15, -20, 30, 40, 5);
        
        // Head
        graphics.fillStyle(0x98FB98);
        graphics.fillCircle(0, -30, 15);
        
        // Eyes
        graphics.fillStyle(0xFF0000);
        graphics.fillCircle(-8, -35, 3);
        graphics.fillCircle(8, -35, 3);
        
        // Mouth
        graphics.fillStyle(0x000000);
        graphics.fillRoundedRect(-6, -25, 12, 4, 2);
        
        // Add type-specific accessories
        this.addZombieAccessories(graphics);
        
        // Arms
        graphics.fillStyle(0x90EE90);
        graphics.fillRoundedRect(-25, -10, 10, 20, 3);
        graphics.fillRoundedRect(15, -10, 10, 20, 3);
        
        // Convert to texture
        graphics.generateTexture(`zombie_${this.type}_${Math.random()}`, 60, 80);
        
        // Create sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, `zombie_${this.type}_${Math.random()}`);
        this.sprite.setScale(0.8);
        
        graphics.destroy();
    }

    addZombieAccessories(graphics) {
        switch (this.type) {
            case 'cone':
                // Orange traffic cone
                graphics.fillStyle(0xFF4500);
                graphics.fillTriangle(0, -50, -10, -35, 10, -35);
                graphics.fillStyle(0xFFFFFF);
                graphics.fillRoundedRect(-8, -42, 16, 3, 1);
                break;
                
            case 'bucket':
                // Metal bucket
                graphics.fillStyle(0x708090);
                graphics.fillRoundedRect(-12, -50, 24, 20, 2);
                graphics.fillStyle(0x2F4F4F);
                graphics.fillRoundedRect(-10, -48, 20, 16, 1);
                break;
        }
    }

    createHealthBar() {
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y - 50, 40, 6, 0x000000);
        this.healthBar = this.scene.add.rectangle(this.x, this.y - 50, 38, 4, 0xFF0000);
    }

    update() {
        if (!this.scene || this.health <= 0) return;
        
        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.healthBar.x = this.x;
        this.healthBar.y = this.y - 50;
        this.healthBarBg.x = this.x;
        this.healthBarBg.y = this.y - 50;
        
        if (this.isEating && this.targetPlant) {
            // Attack the plant
            const currentTime = this.scene.time.now;
            if (currentTime - this.lastAttack > this.attackDelay) {
                this.attackPlant();
                this.lastAttack = currentTime;
            }
            
            // Check if plant is still alive and in range
            if (this.targetPlant.health <= 0 || 
                Math.abs(this.x - this.targetPlant.x) > 50) {
                this.stopEating();
            }
        } else {
            // Move forward
            this.x -= this.speed;
            
            // Walking animation
            const walkCycle = Math.sin(this.scene.time.now * 0.01) * 2;
            this.sprite.y = this.y + walkCycle;
        }
        
        // Update visual effects
        this.updateVisuals();
    }

    startEating(plant) {
        if (!this.isEating) {
            this.isEating = true;
            this.targetPlant = plant;
            plant.startBeingEaten(this);
            
            // Visual feedback
            this.sprite.setTint(0xFF8888);
        }
    }

    stopEating() {
        this.isEating = false;
        this.targetPlant = null;
        this.sprite.clearTint();
    }

    attackPlant() {
        if (this.targetPlant && this.targetPlant.health > 0) {
            this.targetPlant.takeDamage(this.damage);
            
            // Attack animation
            this.sprite.setScale(0.9);
            this.scene.time.delayedCall(100, () => {
                if (this.sprite) this.sprite.setScale(0.8);
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        // Visual feedback
        this.sprite.setTint(0xFFFFFF);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite) {
                if (this.isEating) {
                    this.sprite.setTint(0xFF8888);
                } else {
                    this.sprite.clearTint();
                }
            }
        });
        
        // Knockback effect
        this.x += 5;
    }

    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = this.health / this.maxHealth;
            this.healthBar.scaleX = healthPercent;
            
            // Health bar is always red for zombies
            this.healthBar.setFillStyle(0xFF0000);
        }
    }

    updateVisuals() {
        // Damage-based visual effects
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent < 0.3) {
            // Low health - more transparent and shaky
            this.sprite.setAlpha(0.7);
            const shake = Math.sin(this.scene.time.now * 0.02) * 1;
            this.sprite.x = this.x + shake;
        } else if (healthPercent < 0.6) {
            // Medium health - slightly transparent
            this.sprite.setAlpha(0.85);
        }
        
        // Eating animation
        if (this.isEating) {
            const chewCycle = Math.sin(this.scene.time.now * 0.02) * 3;
            this.sprite.rotation = chewCycle * 0.1;
        } else {
            this.sprite.rotation = 0;
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        
        // Stop eating if currently eating
        if (this.isEating && this.targetPlant) {
            this.targetPlant.isBeingEaten = false;
            this.targetPlant.eatingZombie = null;
        }
    }
}
