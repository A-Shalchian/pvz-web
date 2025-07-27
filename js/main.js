// Game configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-canvas',
    backgroundColor: '#228B22',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    render: {
        antialias: true,
        pixelArt: false
    }
};

// Global game state
window.gameState = {
    sunAmount: 50,
    selectedPlant: null,
    gameRunning: true,
    score: 0,
    wave: 1,
    plantsKilled: 0,
    zombiesKilled: 0
};

// Plant costs and properties
window.plantData = {
    sunflower: { cost: 50, health: 100, cooldown: 7500 },
    peashooter: { cost: 100, health: 100, cooldown: 7500 },
    wallnut: { cost: 50, health: 300, cooldown: 30000 },
    cherrybomb: { cost: 150, health: 100, cooldown: 50000 }
};

// Initialize the game
const game = new Phaser.Game(gameConfig);

// UI Event Handlers
document.addEventListener('DOMContentLoaded', function() {
    const plantCards = document.querySelectorAll('.plant-card');
    const sunCounter = document.getElementById('sun-amount');
    
    // Plant selection
    plantCards.forEach(card => {
        card.addEventListener('click', function() {
            const plantType = this.dataset.plant;
            const cost = parseInt(this.dataset.cost);
            
            if (window.gameState.sunAmount >= cost && !this.classList.contains('disabled')) {
                // Remove selection from other cards
                plantCards.forEach(c => c.classList.remove('selected'));
                
                // Select this card
                this.classList.add('selected');
                window.gameState.selectedPlant = plantType;
            }
        });
    });
    
    // Update UI function
    window.updateUI = function() {
        sunCounter.textContent = window.gameState.sunAmount;
        
        // Update plant card availability
        plantCards.forEach(card => {
            const cost = parseInt(card.dataset.cost);
            if (window.gameState.sunAmount < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    };
    
    // Deselect plant when clicking empty space
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.plant-card') && !e.target.closest('#game-canvas')) {
            plantCards.forEach(c => c.classList.remove('selected'));
            window.gameState.selectedPlant = null;
        }
    });
});

// Utility functions
window.gameUtils = {
    // Get current game scene for grid properties
    getGameScene: function() {
        return game.scene.getScene('GameScene');
    },
    
    // Convert screen coordinates to grid coordinates
    screenToGrid: function(x, y) {
        const scene = this.getGameScene();
        if (!scene) return { x: -1, y: -1 };
        
        const gridX = Math.floor((x - scene.gridStartX) / scene.cellWidth);
        const gridY = Math.floor((y - scene.gridStartY) / scene.cellHeight);
        
        return { x: gridX, y: gridY };
    },
    
    // Convert grid coordinates to screen coordinates
    gridToScreen: function(gridX, gridY) {
        const scene = this.getGameScene();
        if (!scene) return { x: 0, y: 0 };
        
        const x = scene.gridStartX + (gridX * scene.cellWidth) + (scene.cellWidth / 2);
        const y = scene.gridStartY + (gridY * scene.cellHeight) + (scene.cellHeight / 2);
        
        return { x: x, y: y };
    },
    
    // Check if grid position is valid
    isValidGridPosition: function(gridX, gridY) {
        const scene = this.getGameScene();
        if (!scene) return false;
        return gridX >= 0 && gridX < scene.gridCols && gridY >= 0 && gridY < scene.gridRows;
    },
    
    // Add sun to player's collection
    addSun: function(amount) {
        window.gameState.sunAmount += amount;
        window.updateUI();
        
        // Visual feedback
        const sunCounter = document.getElementById('sun-counter');
        sunCounter.style.transform = 'scale(1.2)';
        setTimeout(() => {
            sunCounter.style.transform = 'scale(1)';
        }, 200);
    },
    
    // Spend sun for plants
    spendSun: function(amount) {
        if (window.gameState.sunAmount >= amount) {
            window.gameState.sunAmount -= amount;
            window.updateUI();
            return true;
        }
        return false;
    }
};
