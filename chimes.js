var scene, camera, renderer;

// Physics variables
var gravityConstant = - 9.8;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var physicsWorld;
var rigidBodies = [];
var margin = 0.05;
var hinge, hinge2;
var rope;
var armMovement = 0;
var topperMovement = 0;
var chime1, chime2, chime3, chime4, ball;
var topperMass, topperRadius, topper;
var transformAux1;
var clock;


//Rope Variables
var topRope, rope2, rope3, rope4, rope5, rope6;
var ropeNumSegments;
var ropeLength;
var ropeMass;
var ropePos;
var segmentLength;
var ropeGeometry;
var ropeMaterial;
var ropePositions = [];
var ropeIndices = [];

var controls;
var directionalLight;

var audioLoader, listner;
var audio1, audio2, audio3, audio4, audio5;

var windStrength;

function init() {
    clock = new THREE.Clock();
    transformAux1 = new Ammo.btTransform();
    var overlay = document.getElementById( 'overlay' );
    overlay.remove();
    var container = document.getElementById( 'container' );
    scene = new THREE.Scene;
    
    scene.background = new THREE.Color( 0xcce0ff );
    scene.fog = new THREE.Fog( 0xcce0ff, 30, 1000 );
    
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
    camera.position.set( - 7, 5, 8 );
    
    // lights
    
    var hemiLight = new THREE.HemisphereLight( 0xcce0ff, 0x228B22, 1 );
    hemiLight.position.copy(new THREE.Vector3(0, 500, 0));
    
    scene.add( hemiLight );
    
    directionalLight = new THREE.DirectionalLight(0xffffff, .75);
    directionalLight.position.copy(new THREE.Vector3(70, 40, 50));
    directionalLight.castShadow = true;
    directionalLight.shadowCameraVisible = false;
    directionalLight.shadow.camera.near= 25;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.visible = true;
    directionalLight.name = 'dirLight';
    scene.add(directionalLight);

    initPhysics();
    windStrength = document.getElementById("WS").value;
    
    createObjects();
    
    initInput();
    
    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    renderer.shadowMapCullFace = THREE.CullFaceBack;
    // Controls
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.maxPolarAngle = Math.PI * 0.5 + .1;
    controls.minDistance = 0;
    controls.maxDistance = 60;
    controls.target.set( 0, 2, 0 );
    controls.update();
    
    window.addEventListener( 'resize', onWindowResize, false );
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function initPhysics() {
    // Physics configuration
    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    softBodySolver = new Ammo.btDefaultSoftBodySolver();
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
    physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
}

function createObjects(){
    // Physics Variables
    var loader = new THREE.TextureLoader();
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    
    // audio
    audioLoader = new THREE.AudioLoader();
    listener = new THREE.AudioListener();
    camera.add( listener );
     
    
    // Ground
    pos.set( 0, - 0.5, 0 );
    quat.set( 0, 0, 0, 1 );
    var ground = createParalellepiped( 1000, 1, 1000, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
    ground.castShadow = true;
    ground.receiveShadow = true;
    loader.load( "textures/terrain/grasslight-big.jpg", function ( texture ) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set( 40, 40 );
                ground.material.map = texture;
                ground.material.needsUpdate = true;
                } );
    
    
    // Topper
    topperMass = 5;
    topperRadius = 1.5;
    pos.set( - 3, 5.8, 0 );
    quat.set( 0, 0, 0, 1 );
    material = new THREE.MeshPhongMaterial( { color: 0x593C1F } );
    //topper = new THREE.Mesh( new THREE.CylinderBufferGeometry(topperRadius, topperRadius, .1, 0), new THREE.MeshPhongMaterial( { color: 0xE4F6F8 } ) );
    topper = createParalellepiped( 2.2, 0.1, 2.2, topperMass, pos, quat, material );
    topper.castShadow = true;
    topper.receiveShadow = true;
    var topperShape = new Ammo.btCylinderShape( topperRadius );
    topperShape.setMargin( margin );
    createRigidBody( topper, topperShape, topperMass, pos, quat );
    topper.userData.physicsBody.setFriction( 0.5 );

    
    // Arm Holding Chimes
    var armMass = 2;
    var armLength = 3.6;
    var pylonHeight = 6.8;
    
    // The Rope Between Topper and Arm -> Rope 1
    ropeNumSegments = 10;
    ropeLength = 1.2;
    ropeMass = 2;
    ropePos = topper.position.clone();
    ropePos.y = pylonHeight - ropeLength;
    segmentLength = ropeLength / ropeNumSegments;
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropePositions1 = [];
    ropeIndices1 = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions1.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices1.push( i, i + 1 );
    }
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices1 ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions1 ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    topRope = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    topRope.castShadow = true;
    topRope.receiveShadow = true;
    scene.add( topRope );
    
    // base
    
    var baseMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
    pos.set( ropePos.x, 0.1, ropePos.z - armLength );
    quat.set( 0, 0, 0, 1 );
    var base = createParalellepiped( 1, 0.2, 1, 0, pos, quat, baseMaterial );
    base.castShadow = true;
    base.receiveShadow = true;
    pos.set( ropePos.x, 0.5 * pylonHeight, ropePos.z - armLength );
    var pylon = createParalellepiped( 0.1, pylonHeight, 0.1, 0, pos, quat, baseMaterial );
    pylon.castShadow = true;
    pylon.receiveShadow = true;
    pos.set( ropePos.x, pylonHeight, ropePos.z - 0.5 * armLength );
    var arm = createParalellepiped( 0.1, 0.1, armLength + .6, armMass, pos, quat, baseMaterial );
    arm.castShadow = true;
    arm.receiveShadow = true;
    
    // Define Physics for Rope 1
    var softBodyHelpers = new Ammo.btSoftBodyHelpers();
    var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
    var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
    var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
    var sbConfig = ropeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 10 );
    sbConfig.set_piterations( 10 );
    ropeSoftBody.setTotalMass( ropeMass, false );
    Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
    physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
    topRope.userData.physicsBody = ropeSoftBody;
    ropeSoftBody.setActivationState( 4 );
    
    // Attach Rope 1 and Arm
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, topper.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, arm.userData.physicsBody, true, influence );
    
    // Hinge constraint to move the arm
    var pivotA = new Ammo.btVector3( 0, pylonHeight * 0.47, 0 );
    var pivotB = new Ammo.btVector3( 0, - 0.2, - armLength * 0.5 );
    var axis = new Ammo.btVector3( 0, 1, 0 );
    hinge = new Ammo.btHingeConstraint( pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true );
    physicsWorld.addConstraint( hinge, true );
    
    // Hinge constraint to move the topper
    pivotA = new Ammo.btVector3( 0, pylonHeight * 0.2, -1.9 );
    pivotB = new Ammo.btVector3( 0, topper.position.y, topper.position.z );
    axis = new Ammo.btVector3( 0, 0, 1 );
    hinge2 = new Ammo.btHingeConstraint( topper.userData.physicsBody, topRope.userData.physicsBody, pivotA, pivotB, axis, axis, true );
    //physicsWorld.addConstraint( hinge2, true );

    
    
    // Middle Ball Rope
    
    ropeLength = 2;
    ropePos = topper.position.clone();
    ropePos.y -= 2;
    segmentLength = ropeLength / ropeNumSegments;
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropePositions = [];
    ropeIndices = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices.push( i, i + 1 );
    }
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope6 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope6.castShadow = true;
    rope6.receiveShadow = true;
    scene.add( rope6 );
    
    // Define Physics for Rope 6
    
    var softBodyHelpers = new Ammo.btSoftBodyHelpers();
    var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
    var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
    var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
    var sbConfig = ropeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 10 );
    sbConfig.set_piterations( 10 );
    ropeSoftBody.setTotalMass( ropeMass, false );
    Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
    physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
    rope6.userData.physicsBody = ropeSoftBody;
    ropeSoftBody.setActivationState( 4 );
    
    // Ball
    
    var ballMass = 6;
    var ballRadius = 0.4;
    ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 20, 20), new THREE.MeshPhongMaterial( { color: 0x593C1F } ) );
    ball.castShadow = true;
    ball.receiveShadow = true;
    var ballShape = new Ammo.btSphereShape( ballRadius );
    ballShape.setMargin( margin );
    pos.set( topper.position.x, ropePos.y, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( ball, ballShape, ballMass, pos, quat );
    ball.userData.physicsBody.setFriction( 0.5 );
    
    // Attach Rope 6 and Topper
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, ball.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, topper.userData.physicsBody, true, influence );
    
    
    
    // Left Chime Rope -> Rope 2
    
    ropeLength = .8;
    ropePos = topper.position.clone();
    ropePos.y -= ropeLength;
    ropePos.x -= .85;
    segmentLength = ropeLength / ropeNumSegments;
    ropePositions = [];
    ropeIndices = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices.push( i, i + 1 );
    }
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope2 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope2.castShadow = true;
    rope2.receiveShadow = true;
    scene.add( rope2 );
    
    // Define Physics for Rope 2
    var softBodyHelpers = new Ammo.btSoftBodyHelpers();
    var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
    var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
    var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
    var sbConfig = ropeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 10 );
    sbConfig.set_piterations( 10 );
    ropeSoftBody.setTotalMass( ropeMass, false );
    Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
    physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
    rope2.userData.physicsBody = ropeSoftBody;
    ropeSoftBody.setActivationState( 4 );
    
    // Left Chime -> Chime 1
    var chimeMass1 = 3;
    material = new THREE.MeshPhongMaterial( { color: 0xd3d3d3 } );
    pos.set( ropePos.x, ropePos.y - ropeLength - .5, 0 );
    quat.set( 0, 0, 0, 1 );
    chime1 = createParalellepiped(.35, 2.8, .35, chimeMass1, pos, quat, material);
    chime1.castShadow = true;
    chime1.receiveShadow = true;
    var chimeShape1 = new Ammo.btCylinderShape( 3 );
    chimeShape1.setMargin( margin );
    chime1.userData.physicsBody.setFriction( 0.5 );
 


    // Attach Rope 2 and Topper
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, chime1.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, topper.userData.physicsBody, true, influence );
               
    
    // Right Chime Rope -> Rope 3
    ropeLength = .8;
    ropePos = topper.position.clone();
    ropePos.y -= ropeLength;
    ropePos.x += .85;
    segmentLength = ropeLength / ropeNumSegments;
    ropePositions = [];
    ropeIndices = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices.push( i, i + 1 );
    }
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope3 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope3.castShadow = true;
    rope3.receiveShadow = true;
    scene.add( rope3 );
    
    // Define Physics for Rope 3
    var softBodyHelpers = new Ammo.btSoftBodyHelpers();
    var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
    var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
    var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
    var sbConfig = ropeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 10 );
    sbConfig.set_piterations( 10 );
    ropeSoftBody.setTotalMass( ropeMass, false );
    Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
    physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
    rope3.userData.physicsBody = ropeSoftBody;
    ropeSoftBody.setActivationState( 4 );
    
    // Right Chime -> Chime 2

    var chimeMass2 = 3;
    pos.set( ropePos.x, ropePos.y - ropeLength - .35, 0 );
    quat.set( 0, 0, 0, 1 );
    material = new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } );
    chime2 = createParalellepiped(.35, 2.5, .35, chimeMass2, pos, quat, material);
    chime2.castShadow = true;
    chime2.receiveShadow = true;
    var chimeShape2 = new Ammo.btCylinderShape( chimeMass2 );
    chimeShape2.setMargin( margin );
    chime2.userData.physicsBody.setFriction( 0.5 );

    // Attach Rope 3 and Topper
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, chime2.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, topper.userData.physicsBody, true, influence );
    
    // Top Chime Rope -> Rope 4
    
    ropeLength = .8;
    ropePos = topper.position.clone();
    ropePos.y -= ropeLength;
    ropePos.z -= .85
    segmentLength = ropeLength / ropeNumSegments;
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropePositions = [];
    ropeIndices = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices.push( i, i + 1 );
    }
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope4 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope4.castShadow = true;
    rope4.receiveShadow = true;
    scene.add( rope4 );
    
    // Define Physics for Rope 4
    var softBodyHelpers = new Ammo.btSoftBodyHelpers();
    var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
    var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
    var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
    var sbConfig = ropeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 10 );
    sbConfig.set_piterations( 10 );
    ropeSoftBody.setTotalMass( ropeMass, false );
    Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
    physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
    rope4.userData.physicsBody = ropeSoftBody;
    ropeSoftBody.setActivationState( 4 );
    
    // Top Chime -> Chime 3

    var chimeMass3 = 3;
    pos.set( ropePos.x, ropePos.y - 1.4, ropePos.z );
    quat.set( 0, 0, 0, 1 );
    material = new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } );
    chime3 = createParalellepiped(.35, 3, .35, chimeMass3, pos, quat, material);
    chime3.castShadow = true;
    chime3.receiveShadow = true;
    var chimeShape3 = new Ammo.btCylinderShape( chimeMass3 );
    chimeShape3.setMargin( margin );
    chime3.userData.physicsBody.setFriction( 0.5 );

    // Attach Rope 2 and Topper
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, chime3.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, topper.userData.physicsBody, true, influence );
   
    // Bottomm Chime Rope -> Rope 5
    
    ropeLength = .8;
    ropePos = topper.position.clone();
    ropePos.y -= ropeLength;
    ropePos.z += .85
    segmentLength = ropeLength / ropeNumSegments;
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropePositions = [];
    ropeIndices = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices.push( i, i + 1 );
    }
    ropeGeometry = new THREE.BufferGeometry();
    ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope5 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope5.castShadow = true;
    rope5.receiveShadow = true;
    scene.add( rope5 );
    
    // Define Physics for Rope 5
    
    var softBodyHelpers = new Ammo.btSoftBodyHelpers();
    var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
    var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
    var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
    var sbConfig = ropeSoftBody.get_m_cfg();
    sbConfig.set_viterations( 10 );
    sbConfig.set_piterations( 10 );
    ropeSoftBody.setTotalMass( ropeMass, false );
    Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
    physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
    rope5.userData.physicsBody = ropeSoftBody;
    ropeSoftBody.setActivationState( 4 );
    
    // Top Chime -> Chime 4
    
    var chimeMass4 = 3;
    pos.set( ropePos.x, ropePos.y - 1.4, ropePos.z );
    quat.set( 0, 0, 0, 1 );
    material = new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } );
    chime4 = createParalellepiped(.35, 3, .35, chimeMass4, pos, quat, material)
    chime4.castShadow = true;
    chime4.receiveShadow = true;
    var chimeShape4 = new Ammo.btCylinderShape( chimeMass4 );
    chimeShape4.setMargin( margin );
    chime4.userData.physicsBody.setFriction( 0.5 );
    
    
    // Attach Rope 2 and Topper
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, chime4.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, topper.userData.physicsBody, true, influence );
    audioLoader.load( 'sounds/chime1.ogg', function ( buffer ) {
        audio1 = new THREE.PositionalAudio( listener );
        audio1.setBuffer( buffer );
        chime1.add( audio1 );
    });
    audioLoader.load( 'sounds/chime2.ogg', function ( buffer ) {
        audio2 = new THREE.PositionalAudio( listener );
        audio2.setBuffer( buffer );
        chime2.add( audio2 );
    });
    audioLoader.load( 'sounds/chime3.ogg', function ( buffer ) {
        audio3 = new THREE.PositionalAudio( listener );
        audio3.setBuffer( buffer );
        chime3.add( audio3 );
    });
    audioLoader.load( 'sounds/chime4.ogg', function ( buffer ) {
        audio4 = new THREE.PositionalAudio( listener );
        audio4.setBuffer( buffer );
        chime4.add( audio4 );
    });
    audioLoader.load( 'sounds/wind.ogg', function ( buffer ) {
                     audio5 = new THREE.PositionalAudio( listener );
                     audio5.setBuffer( buffer );
                     topper.add( audio5 );
                     });
}

// Taken from three.JS Physics Rope Example
function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {
    threeObject.position.copy( pos );
    threeObject.quaternion.copy( quat );
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    var motionState = new Ammo.btDefaultMotionState( transform );
    var localInertia = new Ammo.btVector3( 0, 0, 0 );
    physicsShape.calculateLocalInertia( mass, localInertia );
    var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    var body = new Ammo.btRigidBody( rbInfo );
    threeObject.userData.physicsBody = body;
    scene.add( threeObject );
    if ( mass > 0 ) {
        rigidBodies.push( threeObject );
        // Disable deactivation
        body.setActivationState( 4 );
    }
    physicsWorld.addRigidBody( body );
}

// Taken from three.JS Physics Rope Example
function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {
    var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
    var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    shape.setMargin( margin );
    createRigidBody( threeObject, shape, mass, pos, quat );
    return threeObject;
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    
    var deltaTime = clock.getDelta();
    updatePhysics( deltaTime );
    renderer.render( scene, camera );
    
    
}

function updateLight(){
    var time = document.getElementById("time").value;

    directionalLight.position.copy(new THREE.Vector3(70, 40, 50));

    directionalLight.lookAt(scene.position);
}

function initInput() {
    window.addEventListener( 'keydown', function ( event ) {
                            switch ( event.keyCode ) {
                            //space
                            case 32:
                            audio5.play();
                            topperMovement = 1;
                            break;
                            }
                            }, false );
    window.addEventListener( 'keyup', function () {
                            armMovement = 0;
                            topperMovement = 0;
                            }, false );
}

function updatePhysics( deltaTime ) {
    physicsWorld.stepSimulation( deltaTime, 10 );
    // Hinge control
    windStrength = document.getElementById("WS").value;
    console.log(-1 * (camera.position.x/Math.abs(camera.position.x)));
    hinge.enableAngularMotor( true, 1.5 * windStrength * -1 * camera.position.x/Math.abs(camera.position.x) * topperMovement, 50 );
    hinge2.enableAngularMotor( true, 10 * topperMovement, 50 );
    // Update rope
    var softBody = topRope.userData.physicsBody;
    var softBody1 = rope2.userData.physicsBody;
    var softBody2 = rope3.userData.physicsBody;
    var softBody3 = rope4.userData.physicsBody;
    var softBody4 = rope5.userData.physicsBody;
    var softBody5 = rope6.userData.physicsBody;

    var ropePositions = topRope.geometry.attributes.position.array;
    var ropePositions1 = rope2.geometry.attributes.position.array;
    var ropePositions2 = rope3.geometry.attributes.position.array;
    var ropePositions3 = rope4.geometry.attributes.position.array;
    var ropePositions4 = rope5.geometry.attributes.position.array;
    var ropePositions5 = rope6.geometry.attributes.position.array;

    var numVerts = ropePositions.length / 3;
    var numVerts1 = ropePositions1.length / 3;
    var numVerts2 = ropePositions2.length / 3;
    var numVerts3 = ropePositions3.length / 3;
    var numVerts4 = ropePositions4.length / 3;
    var numVerts5 = ropePositions5.length / 3;

    var nodes = softBody.get_m_nodes();
    var nodes1 = softBody1.get_m_nodes();
    var nodes2 = softBody2.get_m_nodes();
    var nodes3 = softBody3.get_m_nodes();
    var nodes4 = softBody4.get_m_nodes();
    var nodes5 = softBody5.get_m_nodes();

    var indexFloat = 0;
    for ( var i = 0; i < numVerts; i ++ ) {
        var node = nodes.at( i );
        var nodePos = node.get_m_x();
        ropePositions[ indexFloat ++ ] = nodePos.x();
        ropePositions[ indexFloat ++ ] = nodePos.y();
        ropePositions[ indexFloat ++ ] = nodePos.z();
    }
    indexFloat = 0;
    for ( var i = 0; i < numVerts1; i ++ ) {
        var node = nodes1.at( i );
        var nodePos = node.get_m_x();
        ropePositions1[ indexFloat ++ ] = nodePos.x();
        ropePositions1[ indexFloat ++ ] = nodePos.y();
        ropePositions1[ indexFloat ++ ] = nodePos.z();
    }
    indexFloat = 0;
    for ( var i = 0; i < numVerts2; i ++ ) {
        var node = nodes2.at( i );
        var nodePos = node.get_m_x();
        ropePositions2[ indexFloat ++ ] = nodePos.x();
        ropePositions2[ indexFloat ++ ] = nodePos.y();
        ropePositions2[ indexFloat ++ ] = nodePos.z();
    }

    indexFloat = 0;
    for ( var i = 0; i < numVerts3; i ++ ) {
        var node = nodes3.at( i );
        var nodePos = node.get_m_x();
        ropePositions3[ indexFloat ++ ] = nodePos.x();
        ropePositions3[ indexFloat ++ ] = nodePos.y();
        ropePositions3[ indexFloat ++ ] = nodePos.z();
    }
    indexFloat = 0;
    for ( var i = 0; i < numVerts4; i ++ ) {
        var node = nodes4.at( i );
        var nodePos = node.get_m_x();
        ropePositions4[ indexFloat ++ ] = nodePos.x();
        ropePositions4[ indexFloat ++ ] = nodePos.y();
        ropePositions4[ indexFloat ++ ] = nodePos.z();
    }

    indexFloat = 0;
    for ( var i = 0; i < numVerts5; i ++ ) {
        var node = nodes5.at( i );
        var nodePos = node.get_m_x();
        ropePositions5[ indexFloat ++ ] = nodePos.x();
        ropePositions5[ indexFloat ++ ] = nodePos.y();
        ropePositions5[ indexFloat ++ ] = nodePos.z();
    }

    topRope.geometry.attributes.position.needsUpdate = true;
    rope2.geometry.attributes.position.needsUpdate = true;
    rope3.geometry.attributes.position.needsUpdate = true;
    rope4.geometry.attributes.position.needsUpdate = true;
    rope5.geometry.attributes.position.needsUpdate = true;
    rope6.geometry.attributes.position.needsUpdate = true;

    // Update rigid bodies
    for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {
        var objThree = rigidBodies[ i ];
        var objPhys = objThree.userData.physicsBody;
        var ms = objPhys.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( transformAux1 );
            var p = transformAux1.getOrigin();
            var q = transformAux1.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        }
        
        if( i >2 && i < 7){
            find_collisions(objThree, i);
        } 
    }
 }

function find_collisions(c1, i){
    var c1x = c1.position.x
    var c1z = c1.position.z
    var a = i -3; 
    
    for( var j = 2; j < 7; j++){
        if( i != j){
            var c2 = rigidBodies[ j ]
            var c2x = c2.position.x
            var c2z = c2.position.z
            if((c1z < c2z + .7) && (c1z > c2z - .7) && (c1x > c2x - .7) && (c1x < c2x + .7)){
                //play audio
                switch(a){
                    case 0: 
                        if(audio1.isPlaying == true){
                            break; 
                        } else{
                            audio1.play();
                        }
                    break; 
                    case 1: 
                        if(audio2.isPlaying == true){
                            break; 
                        } else { 
                            audio2.play();
                        }  
                    break; 
                    case 2: 
                        if(audio3.isPlaying == true){
                            break;
                        } else{ 
                            audio3.play();
                        }
                    break; 
                    case 3: 
                        if(audio4.isPlaying == true){
                            break; 
                        } else{
                            audio4.play();
                        }
                    break; 
                }  
            }
        }
    }


}
