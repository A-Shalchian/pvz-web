class Plant {
    constructor(scene, x, y, type, gridX, gridY) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.health = window.plantData[type].health;
        this.maxHealth = this.health;
        
        // Create sprite based on plant type
        this.createSprite();
        
        // Plant-specific properties
        this.lastAction = 0;
        this.actionDelay = this.getActionDelay();
        this.sunProduction = 0;
        this.isBeingEaten = false;
        this.eatingZombie = null;
    }

    createSprite() {
        // Create a colored circle as plant sprite
        const graphics = this.scene.add.graphics();
        const color = this.getPlantColor();
        const size = this.getPlantSize();
        
        graphics.fillStyle(color);
        graphics.fillCircle(0, 0, size);
        
        // Add plant-specific details
        this.addPlantDetails(graphics);
        
        // Convert to texture
        graphics.generateTexture(`plant_${this.type}_${Math.random()}`, size * 2, size * 2);
        
        // Create sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, `plant_${this.type}_${Math.random()}`);
        this.sprite.setScale(0.8);
        
        // Add health bar
        this.createHealthBar();
        
        graphics.destroy();
    }

    getPlantColor() {
        const colors = {
            sunflower: 0xFFD700,
            peashooter: 0x32CD32,
            wallnut: 0x8B4513,
            cherrybomb: 0xFF0000
        };
        return colors[this.type] || 0x00FF00;
    }

    getPlantSize() {
        const sizes = {
            sunflower: 25,
            peashooter: 20,
            wallnut: 30,
            cherrybomb: 22
        };
        return sizes[this.type] || 20;
    }

    addPlantDetails(graphics) {
        switch (this.type) {
            case 'sunflower':
                // Add petals
                graphics.fillStyle(0xFFA500);
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    const petalX = Math.cos(angle) * 20;
                    const petalY = Math.sin(angle) * 20;
                    graphics.fillCircle(petalX, petalY, 8);
                }
                break;
                
            case 'peashooter':
                // Add mouth
                graphics.fillStyle(0x000000);
                graphics.fillCircle(15, 0, 5);
                break;
                
            case 'wallnut':
                // Add shell pattern
                graphics.lineStyle(2, 0x654321);
                graphics.strokeCircle(0, 0, 25);
                graphics.strokeCircle(0, 0, 15);
                break;
                
            case 'cherrybomb':
                // Add fuse
                graphics.lineStyle(3, 0x000000);
                graphics.moveTo(0, -22);
                graphics.lineTo(5, -35);
                graphics.strokePath();
                break;
        }
    }

    createHealthBar() {
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y - 40, 40, 6, 0x000000);
        this.healthBar = this.scene.add.rectangle(this.x, this.y - 40, 38, 4, 0x00FF00);
    }

    getActionDelay() {
        const delays = {
            sunflower: 24000, // 24 seconds to produce sun
            peashooter: 1500, // 1.5 seconds between shots
            wallnut: 0, // No action
            cherrybomb: 3000 // 3 seconds to explode
        };
        return delays[this.type] || 0;
    }

    update() {
        if (!this.scene || this.health <= 0) return;
        
        const currentTime = this.scene.time.now;
        
        // Handle being eaten
        if (this.isBeingEaten && this.eatingZombie) {
            this.health -= 1;
            this.updateHealthBar();
            
            // Check if zombie stopped eating
            if (!this.eatingZombie.isEating || this.eatingZombie.health <= 0) {
                this.isBeingEaten = false;
                this.eatingZombie = null;
            }
        }
        
        // Plant-specific actions
        if (currentTime - this.lastAction > this.actionDelay) {
            this.performAction();
            this.lastAction = currentTime;
        }
        
        // Update visual effects
        this.updateVisuals();
    }

    performAction() {
        switch (this.type) {
            case 'sunflower':
                this.produceSun();
                break;
                
            case 'peashooter':
                this.shoot();
                break;
                
            case 'cherrybomb':
                this.explode();
                break;
        }
    }

    produceSun() {
        // Create sun at plant location
        const sun = new Sun(this.scene, this.x, this.y - 20, false);
        this.scene.suns.push(sun);
        this.scene.sunsGroup.add(sun.sprite);
        
        // Visual effect
        this.sprite.setTint(0xFFFFFF);
        this.scene.time.delayedCall(200, () => {
            if (this.sprite) this.sprite.clearTint();
        });
    }

    shoot() {
        // Check if there's a zombie in this lane
        const zombieInLane = this.scene.zombies.find(zombie => 
            zombie.lane === this.gridY && zombie.x > this.x
        );
        
        if (zombieInLane) {
            const projectile = new Projectile(this.scene, this.x + 30, this.y, 'pea', this.gridY);
            this.scene.addProjectile(projectile);
            
            // Visual effect
            this.sprite.setScale(0.9);
            this.scene.time.delayedCall(100, () => {
                if (this.sprite) this.sprite.setScale(0.8);
            });
        }
    }

    explode() {
        // Create explosion effect
        const explosionRadius = 100;
        
        // Visual explosion
        const explosion = this.scene.add.circle(this.x, this.y, explosionRadius, 0xFF4500, 0.7);
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => explosion.destroy()
        });
        
        // Damage nearby zombies
        this.scene.zombies.forEach(zombie => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, zombie.x, zombie.y);
            if (distance <= explosionRadius) {
                zombie.takeDamage(1800); // Massive damage
            }
        });
        
        // Destroy self
        this.health = 0;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        // Visual feedback
        this.sprite.setTint(0xFF0000);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite) this.sprite.clearTint();
        });
    }

    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = this.health / this.maxHealth;
            this.healthBar.scaleX = healthPercent;
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthBar.setFillStyle(0x00FF00);
            } else if (healthPercent > 0.3) {
                this.healthBar.setFillStyle(0xFFFF00);
            } else {
                this.healthBar.setFillStyle(0xFF0000);
            }
        }
    }

    updateVisuals() {
        // Slight bobbing animation for sunflowers
        if (this.type === 'sunflower') {
            const bob = Math.sin(this.scene.time.now * 0.002) * 2;
            this.sprite.y = this.y + bob;
            if (this.healthBar) {
                this.healthBar.y = this.y - 40 + bob;
                this.healthBarBg.y = this.y - 40 + bob;
            }
        }
    }

    startBeingEaten(zombie) {
        this.isBeingEaten = true;
        this.eatingZombie = zombie;
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
    }
}
