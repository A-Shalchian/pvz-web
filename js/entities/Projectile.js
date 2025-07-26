class Projectile {
    constructor(scene, x, y, type, lane) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.lane = lane;
        this.speed = this.getSpeed();
        this.damage = this.getDamage();
        this.shouldDestroy = false;
        
        this.createSprite();
    }

    getSpeed() {
        const speedValues = {
            pea: 4,
            frozen_pea: 3.5,
            fireball: 3,
            spike: 5
        };
        return speedValues[this.type] || 4;
    }

    getDamage() {
        const damageValues = {
            pea: 20,
            frozen_pea: 20,
            fireball: 40,
            spike: 30
        };
        return damageValues[this.type] || 20;
    }

    createSprite() {
        const graphics = this.scene.add.graphics();
        
        switch (this.type) {
            case 'pea':
                // Green pea
                graphics.fillStyle(0x32CD32);
                graphics.fillCircle(0, 0, 8);
                graphics.fillStyle(0x228B22);
                graphics.fillCircle(-2, -2, 3);
                break;
                
            case 'frozen_pea':
                // Blue frozen pea
                graphics.fillStyle(0x00BFFF);
                graphics.fillCircle(0, 0, 8);
                graphics.fillStyle(0x0080FF);
                graphics.fillCircle(-2, -2, 3);
                // Ice crystals
                graphics.lineStyle(1, 0xFFFFFF);
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x1 = Math.cos(angle) * 6;
                    const y1 = Math.sin(angle) * 6;
                    const x2 = Math.cos(angle) * 10;
                    const y2 = Math.sin(angle) * 10;
                    graphics.moveTo(x1, y1);
                    graphics.lineTo(x2, y2);
                }
                graphics.strokePath();
                break;
                
            case 'fireball':
                // Orange fireball
                graphics.fillStyle(0xFF4500);
                graphics.fillCircle(0, 0, 10);
                graphics.fillStyle(0xFF6347);
                graphics.fillCircle(-3, -3, 4);
                graphics.fillStyle(0xFFFF00);
                graphics.fillCircle(2, 2, 3);
                break;
                
            case 'spike':
                // Gray spike
                graphics.fillStyle(0x696969);
                graphics.fillTriangle(-8, 0, 8, -4, 8, 4);
                graphics.fillStyle(0x808080);
                graphics.fillTriangle(-6, 0, 6, -2, 6, 2);
                break;
                
            default:
                // Default green pea
                graphics.fillStyle(0x32CD32);
                graphics.fillCircle(0, 0, 8);
                break;
        }
        
        // Convert to texture
        graphics.generateTexture(`projectile_${this.type}_${Math.random()}`, 24, 24);
        
        // Create sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, `projectile_${this.type}_${Math.random()}`);
        
        // Add particle trail for some projectiles
        this.addTrailEffect();
        
        graphics.destroy();
    }

    addTrailEffect() {
        switch (this.type) {
            case 'fireball':
                // Fire trail
                this.trail = this.scene.add.particles(this.x, this.y, 'grass', {
                    scale: { start: 0.3, end: 0 },
                    speed: { min: 10, max: 30 },
                    lifespan: 200,
                    tint: [0xFF4500, 0xFF6347, 0xFFFF00],
                    frequency: 50
                });
                break;
                
            case 'frozen_pea':
                // Ice trail
                this.trail = this.scene.add.particles(this.x, this.y, 'grass', {
                    scale: { start: 0.2, end: 0 },
                    speed: { min: 5, max: 15 },
                    lifespan: 300,
                    tint: [0x00BFFF, 0x87CEEB, 0xFFFFFF],
                    frequency: 80
                });
                break;
        }
    }

    update() {
        if (this.shouldDestroy) return;
        
        // Move projectile
        this.x += this.speed;
        this.sprite.x = this.x;
        
        // Update trail if it exists
        if (this.trail) {
            this.trail.setPosition(this.x, this.y);
        }
        
        // Add projectile-specific effects
        this.updateEffects();
        
        // Check if projectile is off-screen
        if (this.x > 1250) {
            this.shouldDestroy = true;
        }
    }

    updateEffects() {
        switch (this.type) {
            case 'fireball':
                // Flickering fire effect
                const flicker = 0.8 + Math.sin(this.scene.time.now * 0.02) * 0.2;
                this.sprite.setAlpha(flicker);
                
                // Slight rotation
                this.sprite.rotation += 0.1;
                break;
                
            case 'frozen_pea':
                // Spinning ice effect
                this.sprite.rotation += 0.05;
                
                // Slight blue glow
                const glow = 0.9 + Math.sin(this.scene.time.now * 0.01) * 0.1;
                this.sprite.setTint(Phaser.Display.Color.GetColor(
                    Math.floor(glow * 255),
                    Math.floor(glow * 255),
                    255
                ));
                break;
                
            case 'spike':
                // No rotation for spikes - they should fly straight
                break;
                
            default:
                // Slight bobbing for peas
                const bob = Math.sin(this.scene.time.now * 0.02) * 1;
                this.sprite.y = this.y + bob;
                break;
        }
    }

    // Special effects when hitting targets
    onHit(target) {
        switch (this.type) {
            case 'frozen_pea':
                // Slow down the zombie
                if (target.speed) {
                    target.speed *= 0.5;
                    // Reset speed after 3 seconds
                    this.scene.time.delayedCall(3000, () => {
                        if (target && target.speed) {
                            target.speed *= 2; // Restore original speed
                        }
                    });
                }
                
                // Ice impact effect
                this.createIceImpact();
                break;
                
            case 'fireball':
                // Fire splash damage
                this.createFireExplosion();
                break;
                
            case 'spike':
                // Armor piercing - extra damage to armored zombies
                if (target.type === 'cone' || target.type === 'bucket') {
                    target.takeDamage(this.damage * 0.5); // Bonus damage
                }
                break;
        }
    }

    createIceImpact() {
        // Create ice shatter effect
        const iceEffect = this.scene.add.circle(this.x, this.y, 20, 0x87CEEB, 0.6);
        this.scene.tweens.add({
            targets: iceEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => iceEffect.destroy()
        });
        
        // Ice particles
        if (this.trail) {
            this.trail.explode(10);
        }
    }

    createFireExplosion() {
        // Create fire explosion effect
        const fireEffect = this.scene.add.circle(this.x, this.y, 15, 0xFF4500, 0.8);
        this.scene.tweens.add({
            targets: fireEffect,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => fireEffect.destroy()
        });
        
        // Damage nearby zombies
        const splashRadius = 40;
        this.scene.zombies.forEach(zombie => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, zombie.x, zombie.y);
            if (distance <= splashRadius && zombie.lane === this.lane) {
                zombie.takeDamage(this.damage * 0.3); // Splash damage
            }
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.trail) this.trail.destroy();
    }
}
