var scene, camera, renderer;
//var clock = THREE.Clock(true);

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
var hinge;
var rope;
var armMovement = 0;
var chime1, chime2, chime3, chime4;
var topperMass, topperRadius, topper;
//var transformAux1 = new Ammo.btTransform();
var armMovement = 0;


//Rope Variables
var topRope, rope2, rope3, rope4, rope5;
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

function init() {
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
    directionalLight.shadowCameraNear = 25;
    directionalLight.shadowCameraFar = 200;
    directionalLight.shadowCameraLeft = -50;
    directionalLight.shadowCameraRight = 50;
    directionalLight.shadowCameraTop = 50;
    directionalLight.shadowCameraBottom = -50;
    directionalLight.visible = true;
    directionalLight.name = 'dirLight';
    scene.add(directionalLight);

    initPhysics();
    
    createObjects();
    
    //initInput();
    
    //TODO: Add Audio
    
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
    topperMass = 4;
    topperRadius = 1.5;
    topper = new THREE.Mesh( new THREE.CylinderGeometry(topperRadius, topperRadius, .1, 0), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    topper.castShadow = true;
    topper.receiveShadow = true;
    var topperShape = new Ammo.btCylinderShape( topperRadius );
    topperShape.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( topper, topperShape, topperMass, pos, quat );
    topper.position.y += 3;
    topper.userData.physicsBody.setFriction( 0.5 );
    
    
    // The Rope Between Topper and Arm -> Rope 1
    ropeNumSegments = 10;
    ropeLength = 1.2;
    ropeMass = 3;
    ropePos = topper.position.clone();
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
    
    // Arm Holding Chimes
    var armMass = 2;
    var armLength = 3;
    var pylonHeight = ropePos.y + ropeLength;
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
    var arm = createParalellepiped( 0.1, 0.1, armLength + 0.6, armMass, pos, quat, baseMaterial );
    arm.castShadow = true;
    arm.receiveShadow = true;
    
    // Attach Rope 1 and Arm
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, topper.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, arm.userData.physicsBody, true, influence );
    
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
    
    var chimeMass1 = 2.7;
    chime1 = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 2.6, 3), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    chime1.castShadow = true;
    chime1.receiveShadow = true;
    var chimeShape1 = new Ammo.btCylinderShape( 3 );
    chimeShape1.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime1, chimeShape1, chimeMass1, pos, quat );
    chime1.position.y = ropePos.y - 1.7 * ropeLength + .2;
    chime1.position.x -= .85
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
    
    var chimeMass2 = 2;
    chime2 = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 2.3, 3), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    chime2.castShadow = true;
    chime2.receiveShadow = true;
    var chimeShape2 = new Ammo.btCylinderShape( chimeMass2 );
    chimeShape2.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime2, chimeShape2, chimeMass2, pos, quat );
    chime2.position.y = ropePos.y - 1.4 * ropeLength;
    chime2.position.x += .85
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
    
    var chimeMass3 = 2.9;
    chime3 = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 3.8, 3.8), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    chime3.castShadow = true;
    chime3.receiveShadow = true;
    var chimeShape3 = new Ammo.btCylinderShape( chimeMass3 );
    chimeShape3.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime3, chimeShape3, chimeMass3, pos, quat );
    chime3.position.y = ropePos.y - 2 * ropeLength;
    chime3.position.z -= .85
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
    
    var chimeMass4 = 2.5;
    chime4 = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 3, 3), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    chime4.castShadow = true;
    chime4.receiveShadow = true;
    var chimeShape4 = new Ammo.btCylinderShape( chimeMass4 );
    chimeShape4.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime4, chimeShape4, chimeMass4, pos, quat );
    chime4.position.y = ropePos.y - 2 * ropeLength + .2;
    chime4.position.z += .85
    chime4.userData.physicsBody.setFriction( 0.5 );
    
    // Attach Rope 2 and Topper
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, chime4.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, topper.userData.physicsBody, true, influence );
    
    
    // Hinge constraint to move the arm
    var pivotA = new Ammo.btVector3( 0, pylonHeight * 0.5, 0 );
    var pivotB = new Ammo.btVector3( 0, - 0.2, - armLength * 0.5 );
    var axis = new Ammo.btVector3( 0, 1, 0 );
    hinge = new Ammo.btHingeConstraint( pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true );
    physicsWorld.addConstraint( hinge, true );
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
    document.body.onkeyup = function(e){
        if (e.keyCode === 32 || e.key === ' '){
            // TODO: Add Wind
            
            var windStrength = document.getElementById("windStrength").value;
            
            //topper.rotation.x = .2;
        }
    }
    
    renderer.render( scene, camera );
    
    
}

function updateLight(){
    var time = document.getElementById("time").value;

    directionalLight.position.copy(new THREE.Vector3(70, 40, 50));

    directionalLight.lookAt(scene.position);
}

/*function initInput() {
    window.addEventListener( 'keydown', function ( event ) {
                            switch ( event.keyCode ) {
                            // Q
                            case 81:
                            armMovement = 1;
                            break;
                            // A
                            case 65:
                            armMovement = - 1;
                            break;
                            }
                            }, false );
    window.addEventListener( 'keyup', function () {
                            armMovement = 0;
                            }, false );
}

function updatePhysics( deltaTime ) {
 hinge.enableAngularMotor( true, 1.5 * armMovement, 50 );
 // Step world
 physicsWorld.stepSimulation( deltaTime, 10 );
 // Update rope
 var softBody = topRope.userData.physicsBody;
 var ropePositions = topRope.geometry.attributes.position.array;
 var numVerts = ropePositions.length / 3;
 var nodes = softBody.get_m_nodes();
 var indexFloat = 0;
 for ( var i = 0; i < numVerts; i ++ ) {
 var node = nodes.at( i );
 var nodePos = node.get_m_x();
 ropePositions[ indexFloat ++ ] = nodePos.x();
 ropePositions[ indexFloat ++ ] = nodePos.y();
 ropePositions[ indexFloat ++ ] = nodePos.z();
 }
 topRope.geometry.attributes.position.needsUpdate = true;
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
 }
 }*/
