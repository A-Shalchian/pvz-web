class Sun {
    constructor(scene, x, y, fromSky = true) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.fromSky = fromSky;
        this.value = 25;
        this.shouldDestroy = false;
        this.collected = false;
        this.fallSpeed = 1;
        this.targetY = fromSky ? Phaser.Math.Between(150, 500) : y + 50;
        this.bounceHeight = 10;
        this.lifetime = 10000; // 10 seconds before disappearing
        this.createdTime = scene.time.now;
        
        this.createSprite();
        this.setupInteraction();
    }

    createSprite() {
        // Create sun sprite
        const graphics = this.scene.add.graphics();
        
        // Main sun body - bright yellow
        graphics.fillStyle(0xFFD700);
        graphics.fillCircle(0, 0, 20);
        
        // Inner glow - lighter yellow
        graphics.fillStyle(0xFFFF00);
        graphics.fillCircle(0, 0, 15);
        
        // Core - white
        graphics.fillStyle(0xFFFFFF);
        graphics.fillCircle(0, 0, 8);
        
        // Sun rays
        graphics.lineStyle(3, 0xFFD700);
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const innerX = Math.cos(angle) * 18;
            const innerY = Math.sin(angle) * 18;
            const outerX = Math.cos(angle) * 28;
            const outerY = Math.sin(angle) * 28;
            
            graphics.moveTo(innerX, innerY);
            graphics.lineTo(outerX, outerY);
        }
        graphics.strokePath();
        
        // Convert to texture
        graphics.generateTexture(`sun_${Math.random()}`, 60, 60);
        
        // Create sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, `sun_${Math.random()}`);
        this.sprite.setScale(0.8);
        
        // Add glow effect
        this.addGlowEffect();
        
        graphics.destroy();
    }

    addGlowEffect() {
        // Create a subtle glow around the sun
        this.glow = this.scene.add.circle(this.x, this.y, 25, 0xFFFF00, 0.2);
        
        // Pulsing glow animation
        this.scene.tweens.add({
            targets: this.glow,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.4,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    setupInteraction() {
        // Make sun clickable
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', this.collect, this);
        
        // Hover effect
        this.sprite.on('pointerover', () => {
            this.sprite.setScale(0.9);
            this.scene.input.setDefaultCursor('pointer');
        });
        
        this.sprite.on('pointerout', () => {
            this.sprite.setScale(0.8);
            this.scene.input.setDefaultCursor('default');
        });
    }

    update() {
        if (this.shouldDestroy || this.collected) return;
        
        const currentTime = this.scene.time.now;
        
        // Check lifetime
        if (currentTime - this.createdTime > this.lifetime) {
            this.fadeAway();
            return;
        }
        
        // Handle falling from sky
        if (this.fromSky && this.y < this.targetY) {
            this.y += this.fallSpeed;
            this.fallSpeed += 0.05; // Acceleration
        } else if (this.fromSky && this.y >= this.targetY) {
            // Bounce when hitting target
            this.bounce();
            this.fromSky = false; // Stop falling
        }
        
        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        
        if (this.glow) {
            this.glow.x = this.x;
            this.glow.y = this.y;
        }
        
        // Floating animation for stationary suns
        if (!this.fromSky) {
            const float = Math.sin(currentTime * 0.003) * 3;
            this.sprite.y = this.y + float;
            if (this.glow) {
                this.glow.y = this.y + float;
            }
        }
        
        // Rotation animation
        this.sprite.rotation += 0.01;
        
        // Blinking effect when about to expire
        const timeLeft = this.lifetime - (currentTime - this.createdTime);
        if (timeLeft < 3000) { // Last 3 seconds
            const blinkSpeed = Math.max(0.1, timeLeft / 3000);
            this.sprite.alpha = 0.5 + Math.sin(currentTime * 0.01 / blinkSpeed) * 0.5;
        }
    }

    bounce() {
        // Create bounce animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.sprite,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 100
                });
            }
        });
        
        // Bounce particles
        this.createBounceParticles();
    }

    createBounceParticles() {
        // Create small sparkle particles
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-10, 10),
                this.y + Phaser.Math.Between(-5, 5),
                2,
                0xFFFF00,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 20,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    collect() {
        if (this.collected) return;
        
        this.collected = true;
        
        // Add sun to player's collection
        window.gameUtils.addSun(this.value);
        
        // Collection animation
        this.createCollectionEffect();
        
        // Move sun to sun counter
        const sunCounter = document.getElementById('sun-counter');
        const counterRect = sunCounter.getBoundingClientRect();
        const gameCanvas = document.getElementById('game-canvas');
        const canvasRect = gameCanvas.getBoundingClientRect();
        
        const targetX = counterRect.left - canvasRect.left + counterRect.width / 2;
        const targetY = counterRect.top - canvasRect.top + counterRect.height / 2;
        
        this.scene.tweens.add({
            targets: [this.sprite, this.glow],
            x: targetX,
            y: targetY,
            scaleX: 0.3,
            scaleY: 0.3,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.shouldDestroy = true;
            }
        });
        
        // Disable further interaction
        this.sprite.removeInteractive();
    }

    createCollectionEffect() {
        // Sparkle effect
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const sparkleX = this.x + Math.cos(angle) * 30;
            const sparkleY = this.y + Math.sin(angle) * 30;
            
            const sparkle = this.scene.add.circle(sparkleX, sparkleY, 3, 0xFFFFFF, 0.9);
            
            this.scene.tweens.add({
                targets: sparkle,
                x: this.x,
                y: this.y,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 300,
                delay: i * 50,
                onComplete: () => sparkle.destroy()
            });
        }
        
        // Text popup
        const collectText = this.scene.add.text(this.x, this.y - 30, `+${this.value}`, {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: collectText,
            y: collectText.y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => collectText.destroy()
        });
    }

    fadeAway() {
        if (this.collected) return;
        
        // Fade out animation
        this.scene.tweens.add({
            targets: [this.sprite, this.glow],
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 1000,
            onComplete: () => {
                this.shouldDestroy = true;
            }
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.glow) this.glow.destroy();
    }
}
