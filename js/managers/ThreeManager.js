class ThreeManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.zombies3D = new Map();
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.zombieModels = new Map();
        
        this.init();
        this.loadZombieModels();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -2, window.innerWidth / 2,
            window.innerHeight / 2, window.innerHeight / -2,
            0.1, 1000
        );
        this.camera.position.set(0, 0, 100); // Move camera further back
        
        // Create renderer
        const canvas = document.getElementById('three-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    async loadZombieModels() {
        // For now, we'll create simple geometric zombies
        // In production, you'd load actual .glb/.gltf models
        this.createGeometricZombieModels();
    }

    createGeometricZombieModels() {
        const zombieTypes = ['basic', 'cone', 'bucket'];
        
        zombieTypes.forEach(type => {
            const group = new THREE.Group();
            
            // Body (cylinder)
            const bodyGeometry = new THREE.CylinderGeometry(15, 20, 40, 8);
            const bodyMaterial = new THREE.MeshLambertMaterial({ 
                color: type === 'basic' ? 0x8B4513 : 
                       type === 'cone' ? 0xA0522D : 0x654321 
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0;
            group.add(body);
            
            // Head (sphere)
            const headGeometry = new THREE.SphereGeometry(12, 16, 16);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 30;
            group.add(head);
            
            // Eyes
            const eyeGeometry = new THREE.SphereGeometry(2, 8, 8);
            const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-4, 32, 10);
            group.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(4, 32, 10);
            group.add(rightEye);
            
            // Arms
            const armGeometry = new THREE.CylinderGeometry(3, 4, 25, 6);
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
            
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-18, 10, 0);
            leftArm.rotation.z = Math.PI / 6;
            group.add(leftArm);
            
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(18, 10, 0);
            rightArm.rotation.z = -Math.PI / 6;
            group.add(rightArm);
            
            // Type-specific accessories
            if (type === 'cone') {
                const coneGeometry = new THREE.ConeGeometry(8, 20, 8);
                const coneMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
                const cone = new THREE.Mesh(coneGeometry, coneMaterial);
                cone.position.y = 50;
                group.add(cone);
            } else if (type === 'bucket') {
                const bucketGeometry = new THREE.CylinderGeometry(10, 8, 15, 8);
                const bucketMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
                const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
                bucket.position.y = 45;
                group.add(bucket);
            }
            
            // Store the model
            this.zombieModels.set(type, group);
        });
    }

    createZombie3D(id, type, x, y) {
        const model = this.zombieModels.get(type);
        if (!model) return null;
        
        const zombie3D = model.clone();
        // Convert screen coordinates to 3D world coordinates
        const worldPos = this.screenTo3D(x, y);
        zombie3D.position.set(worldPos.x, worldPos.y, 50);
        zombie3D.scale.set(0.8, 0.8, 0.8);
        
        // Add walking animation
        this.addWalkingAnimation(zombie3D);
        
        this.scene.add(zombie3D);
        this.zombies3D.set(id, {
            model: zombie3D,
            walkAnimation: true,
            health: 1.0
        });
        
        return zombie3D;
    }

    addWalkingAnimation(zombie3D) {
        // Simple bobbing animation
        zombie3D.userData.walkPhase = Math.random() * Math.PI * 2;
    }

    updateZombie3D(id, x, y, health, maxHealth) {
        const zombie3D = this.zombies3D.get(id);
        if (!zombie3D) return;
        
        const model = zombie3D.model;
        
        // Convert screen coordinates to 3D world coordinates
        const worldPos = this.screenTo3D(x, y);
        model.position.x = worldPos.x;
        model.position.y = worldPos.y;
        model.position.z = 50; // Keep zombies in front
        
        // Update walking animation
        if (zombie3D.walkAnimation) {
            model.userData.walkPhase += 0.1;
            // Apply bobbing animation relative to current position
            const baseY = worldPos.y;
            model.position.y = baseY + Math.sin(model.userData.walkPhase) * 3;
            
            // Slight rotation while walking
            model.rotation.z = Math.sin(model.userData.walkPhase * 0.5) * 0.1;
        }
        
        // Update health visualization
        const healthRatio = health / maxHealth;
        if (healthRatio < 0.5) {
            // Tint red when damaged
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.color.lerp(new THREE.Color(0xFF0000), (1 - healthRatio) * 0.5);
                }
            });
        }
    }

    removeZombie3D(id) {
        const zombie3D = this.zombies3D.get(id);
        if (zombie3D) {
            this.scene.remove(zombie3D.model);
            this.zombies3D.delete(id);
        }
    }

    onWindowResize() {
        this.camera.left = window.innerWidth / -2;
        this.camera.right = window.innerWidth / 2;
        this.camera.top = window.innerHeight / 2;
        this.camera.bottom = window.innerHeight / -2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update animations
        this.zombies3D.forEach((zombie3D, id) => {
            // Additional per-frame updates can go here
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    // Convert screen coordinates to 3D world coordinates
    screenTo3D(screenX, screenY) {
        return {
            x: screenX - window.innerWidth / 2,
            y: window.innerHeight / 2 - screenY
        };
    }

    // Convert 3D world coordinates to screen coordinates
    threeDToScreen(x, y) {
        return {
            x: x + window.innerWidth / 2,
            y: window.innerHeight / 2 - y
        };
    }
}

// Global instance
window.threeManager = null;
