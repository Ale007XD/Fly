// --- Basic Setup ---
let scene, camera, renderer;
let airplane, airplaneTargetY = 0, airplaneTargetX = 0; // Airplane object and target positions
const airplaneMoveSpeed = 0.05; // How fast the plane reacts to input
const forwardSpeed = 0.5; // How fast the plane moves forward
const rings = [];
const numberOfRings = 15;
const ringSpawnDistance = -150; // How far ahead new rings spawn
const ringSpacing = 40; // Spacing between rings along the Z axis
let score = 0;
let scoreElement;
let touchIndicator;

// Touch controls state
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;

// --- Initialization ---
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 100, 400); // Add fog for depth perception

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15); // Position camera slightly behind and above origin
    camera.lookAt(0, 0, 0); // Look towards the origin initially

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Better resolution on high DPI screens
    renderer.setClearColor(0x87CEEB); // Sky blue background
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Sun light
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Get UI elements
    scoreElement = document.getElementById('score');
    touchIndicator = document.getElementById('touch-indicator');

    // Create Game Objects
    createAirplane();
    createRings();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    // Touch controls
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false }); // Allow preventDefault
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);
    // Optional: Mouse controls for testing on desktop
    renderer.domElement.addEventListener('mousedown', (e) => onTouchStart({ touches: [{ clientX: e.clientX, clientY: e.clientY }] }));
    renderer.domElement.addEventListener('mousemove', (e) => { if (isTouching) onTouchMove({ touches: [{ clientX: e.clientX, clientY: e.clientY }], preventDefault: () => {} }); });
    renderer.domElement.addEventListener('mouseup', onTouchEnd);
    renderer.domElement.addEventListener('mouseleave', onTouchEnd); // Stop moving if mouse leaves canvas


    // Start the animation loop
    animate();
}

// --- Create Game Objects ---
function createAirplane() {
    // Simple airplane shape using basic geometries
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, flatShading: true }); // Grey body
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xff0000, flatShading: true }); // Red wings

    const bodyGeo = new THREE.BoxGeometry(1, 0.8, 3);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);

    const wingGeo = new THREE.BoxGeometry(5, 0.2, 1);
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.position.y = 0.1; // Slightly above center

    const tailGeo = new THREE.BoxGeometry(0.3, 1, 0.8);
    const tailMesh = new THREE.Mesh(tailGeo, wingMat);
    tailMesh.position.set(0, 0.5, -1.2); // Position at the back and top

    // Group parts into one object
    airplane = new THREE.Group();
    airplane.add(bodyMesh);
    airplane.add(wingMesh);
    airplane.add(tailMesh);

    airplane.position.set(0, 0, 0); // Start at origin (relative to camera later)
    airplane.scale.set(0.5, 0.5, 0.5); // Make it smaller
    scene.add(airplane);
}

function createRings() {
    const ringGeometry = new THREE.TorusGeometry(4, 0.5, 16, 100); // Radius, tube radius, segments
    const ringColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xffa500]; // Red, Green, Blue, Yellow, Orange

    for (let i = 0; i < numberOfRings; i++) {
        const colorIndex = Math.floor(Math.random() * ringColors.length);
        const ringMaterial = new THREE.MeshStandardMaterial({ color: ringColors[colorIndex] });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);

        positionRing(ring, i * -ringSpacing); // Position rings progressively further away

        rings.push({ mesh: ring, passed: false });
        scene.add(ring.mesh);
    }
}

function positionRing(ringMesh, initialZ) {
    // Random position within a range, avoiding being too close to edges initially
    ringMesh.position.x = Math.random() * 20 - 10; // -10 to +10 horizontally
    ringMesh.position.y = Math.random() * 15 + 2;  // 2 to 17 vertically (so not on the ground)
    ringMesh.position.z = initialZ - 50; // Start further away

    // Random rotation for visual variety
    ringMesh.rotation.x = Math.random() * Math.PI * 0.1;
    ringMesh.rotation.y = Math.random() * Math.PI * 0.1;
    ringMesh.rotation.z = Math.random() * Math.PI * 0.5; // Allow more tilt
}

// --- Event Handlers ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onTouchStart(event) {
    isTouching = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;

    // Show touch indicator (optional)
    touchIndicator.style.display = 'block';
    touchIndicator.style.left = `${touchStartX - touchIndicator.offsetWidth / 2}px`;
    touchIndicator.style.top = `${touchStartY - touchIndicator.offsetHeight / 2}px`;
}

function onTouchMove(event) {
    event.preventDefault(); // Prevent screen scrolling on mobile
    if (!isTouching) return;

    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;

    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    // Adjust target position based on drag distance
    // Scale the movement sensitivity (adjust these values as needed)
    const sensitivityX = 0.03;
    const sensitivityY = -0.04; // Invert Y-axis (drag down = move up)

    airplaneTargetX += deltaX * sensitivityX;
    airplaneTargetY += deltaY * sensitivityY;

    // Clamp target positions to prevent plane from going too far off-screen
    // These limits depend on your camera view and desired play area
    airplaneTargetX = Math.max(-15, Math.min(15, airplaneTargetX));
    airplaneTargetY = Math.max(-5, Math.min(20, airplaneTargetY)); // Allow higher movement

    // Update start positions for continuous dragging
    touchStartX = touchX;
    touchStartY = touchY;

    // Move touch indicator (optional)
    touchIndicator.style.left = `${touchX - touchIndicator.offsetWidth / 2}px`;
    touchIndicator.style.top = `${touchY - touchIndicator.offsetHeight / 2}px`;
}

function onTouchEnd() {
    isTouching = false;
    // Hide touch indicator (optional)
    touchIndicator.style.display = 'none';
}

// --- Game Logic Update ---
function update() {
    // Smoothly move airplane towards target positions
    airplane.position.x += (airplaneTargetX - airplane.position.x) * airplaneMoveSpeed;
    airplane.position.y += (airplaneTargetY - airplane.position.y) * airplaneMoveSpeed;

    // Make the airplane bank slightly when turning
    airplane.rotation.z = (airplaneTargetX - airplane.position.x) * -0.05; // Bank based on horizontal difference
    airplane.rotation.x = (airplaneTargetY - airplane.position.y) * 0.02;  // Pitch slightly based on vertical difference

    // Move the entire scene forward (or camera backward)
    // We move the objects towards the camera to simulate forward movement
    scene.position.z += forwardSpeed;

    // Check for ring collisions and reposition rings
    rings.forEach(ringData => {
        const ring = ringData.mesh;

        // Simple collision detection: check distance and Z position
        const distance = airplane.position.distanceTo(ring.position);
        const ringRadius = ring.geometry.parameters.radius; // Get ring's outer radius

        // Check if plane is near the ring's Z plane and within its radius
        if (!ringData.passed && Math.abs(airplane.position.z - ring.position.z) < 2) {
            if (distance < ringRadius) {
                // Collision!
                score++;
                scoreElement.innerText = `Score: ${score}`;
                ringData.passed = true;
                // Optional: Visual feedback (e.g., change color briefly)
                // ring.material.color.set(0xaaaaaa);
                // For simplicity, we just mark as passed
            }
        }

        // If ring is far behind the camera (relative to scene movement)
        if (ring.position.z > camera.position.z + 10) { // Ring is behind camera
            // Reposition the ring far ahead
            const newZ = rings.length * -ringSpacing + ringSpawnDistance; // Calculate new Z based on furthest ring
            positionRing(ring, newZ);
            ringData.passed = false; // Reset passed status
            // Reset color if it was changed on pass
            // ring.material.color.set(ringColors[Math.floor(Math.random() * ringColors.length)]);
        }
    });
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate); // Request next frame

    update(); // Update game logic

    renderer.render(scene, camera); // Render the scene
}

// --- Start the game ---
init();