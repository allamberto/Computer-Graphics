
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
var hinge;
var rope;
var transformAux1 = new Ammo.btTransform();
var armMovement = 0;

function init() {
		var overlay = document.getElementById( 'overlay' );
		overlay.remove();
		var container = document.getElementById( 'container' );
		scene = new THREE.Scene();
		
        scene.background = new THREE.Color( 0xcce0ff );
        scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
        
        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
        camera.position.set( - 7, 5, 8 );
    
        // lights
        scene.add( new THREE.AmbientLight( 0x666666 ) );
        var light = new THREE.DirectionalLight( 0xdfebff, 1 );
        light.position.set( 50, 200, 100 );
        light.position.multiplyScalar( 1.3 );
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        var d = 300;
        light.shadow.camera.left = - d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = - d;
        light.shadow.camera.far = 1000;
        scene.add( light );
        
        initPhysics();
        
        // ground
        var loader = new THREE.TextureLoader();
        /*var groundTexture = loader.load( 'textures/terrain/grasslight-big.jpg' );
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set( 25, 25 );
        groundTexture.anisotropy = 16;
        var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );
        var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
        mesh.position.y = - 250;
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add( mesh );*/
    
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
    
        // poles
        /*var poleGeo = new THREE.BoxBufferGeometry( 5, 375, 5 );
        var poleMat = new THREE.MeshLambertMaterial();
        var mesh = new THREE.Mesh( poleGeo, poleMat );
        mesh.position.x = - 125;
        mesh.position.y = - 62;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add( mesh );
        var mesh = new THREE.Mesh( poleGeo, poleMat );
        mesh.position.x = 125;
        mesh.position.y = - 62;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add( mesh );
        var midMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 255, 5, 5 ), poleMat );
        midMesh.position.y = - 250 + ( 750 / 2 );
        midMesh.position.x = 0;
        midMesh.receiveShadow = true;
        midMesh.castShadow = true;
        scene.add( midMesh );
        var midPos = mesh.position.x;
        var gg = new THREE.BoxBufferGeometry( 10, 10, 10 );
        var mesh = new THREE.Mesh( gg, poleMat );
        mesh.position.y = - 250;
        mesh.position.x = 125;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add( mesh );
        var mesh = new THREE.Mesh( gg, poleMat );
        mesh.position.y = - 250;
        mesh.position.x = - 125;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add( mesh );
    
        // Base
        var geometry = new THREE.CircleGeometry( 40, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0x11111 } );
        var base = new THREE.Mesh( geometry, material );
        base.rotation.x = Math.PI * - 0.5;
        base.position.y += 30;
        base.receiveShadow = true;
        base.castShadow = true;
        scene.add( base );*/
		
        /*//Cylinder
        var geometry = new THREE.CylinderGeometry( 2, 2, 10, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0x000080} );
        var cylinder = new THREE.Mesh( geometry, material );
        var cylinderPos = cylinder.position.clone();
        cylinderPos.x -= 100;
        scene.add( cylinder );*/

    
    // Ball
    var ballMass = 4;
    var ballRadius = 1.5;
    var ball = new THREE.Mesh( new THREE.CylinderGeometry(1.5, 1.5, .1, 0), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    //var geometry = new THREE.CircleGeometry( 3, ballRadius );
    //var material = new THREE.MeshPhongMaterial( { color: 0x11111 } ) ;
    //var ball = new THREE.Mesh( geometry, material );
    ball.castShadow = true;
    ball.receiveShadow = true;
    var ballShape = new Ammo.btCylinderShape( ballRadius );
    ballShape.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( ball, ballShape, ballMass, pos, quat );
    ball.position.y += 3;
    ball.userData.physicsBody.setFriction( 0.5 );
    
    // The rope1
    // Rope graphic object
    var ropeNumSegments = 10;
    var ropeLength = 1.2;
    var ropeMass = 3;
    var ropePos = ball.position.clone();
    //ropePos.y += ballRadius;
    var segmentLength = ropeLength / ropeNumSegments;
    var ropeGeometry = new THREE.BufferGeometry();
    var ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
    var ropePositions = [];
    var ropeIndices = [];
    for ( var i = 0; i < ropeNumSegments + 1; i ++ ) {
        ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
    }
    for ( var i = 0; i < ropeNumSegments; i ++ ) {
        ropeIndices.push( i, i + 1 );
    }
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope.castShadow = true;
    rope.receiveShadow = true;
    scene.add( rope );
    // Rope physic object
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
    rope.userData.physicsBody = ropeSoftBody;
    // Disable deactivation
    ropeSoftBody.setActivationState( 4 );
    
    // The base
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
    // Glue the rope extremes to the ball and the arm
    var influence = 1;
    ropeSoftBody.appendAnchor( 0, ball.userData.physicsBody, true, influence );
    ropeSoftBody.appendAnchor( ropeNumSegments, arm.userData.physicsBody, true, influence );
    
    // The rope2
    // Rope graphic object
    ropeNumSegments = 10;
    ropeLength = .8;
    ropeMass = 3;
    ropePos = ball.position.clone();
    ropePos.y -= ropeLength;
    ropePos.x -= .85;
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
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope2 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope2.castShadow = true;
    rope2.receiveShadow = true;
    scene.add( rope2 );
    // Rope physic object
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
    rope.userData.physicsBody = ropeSoftBody;
    // Disable deactivation
    ropeSoftBody.setActivationState( 4 );
    
    //chime1
    
    var chimeMass = 2.7;
    var chime = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 2.6, 3), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    //var geometry = new THREE.CircleGeometry( 3, ballRadius );
    //var material = new THREE.MeshPhongMaterial( { color: 0x11111 } ) ;
    //var ball = new THREE.Mesh( geometry, material );
    chime.castShadow = true;
    chime.receiveShadow = true;
    var chimeShape = new Ammo.btCylinderShape( 3 );
    chimeShape.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime, chimeShape, chimeMass, pos, quat );
    chime.position.y = ropePos.y - 1.7 * ropeLength + .2;
    chime.position.x -= .85
    chime.userData.physicsBody.setFriction( 0.5 );
    
    
    // The rope3
    // Rope graphic object
    ropeNumSegments = 10;
    ropeLength = .8;
    ropeMass = 3;
    ropePos = ball.position.clone();
    ropePos.y -= ropeLength;
    ropePos.x += .85;
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
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope3 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope3.castShadow = true;
    rope3.receiveShadow = true;
    scene.add( rope3 );
    // Rope physic object
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
    rope.userData.physicsBody = ropeSoftBody;
    // Disable deactivation
    ropeSoftBody.setActivationState( 4 );
    
    //chime2
    
    var chimeMass = 2;
    var chime = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 2.3, 3), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    chime.castShadow = true;
    chime.receiveShadow = true;
    var chimeShape = new Ammo.btCylinderShape( 2 );
    chimeShape.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime, chimeShape, chimeMass, pos, quat );
    chime.position.y = ropePos.y - 1.4 * ropeLength;
    chime.position.x += .85
    chime.userData.physicsBody.setFriction( 0.5 );
    
    // The rope4
    // Rope graphic object
    ropeNumSegments = 10;
    ropeLength = .8;
    ropeMass = 3;
    ropePos = ball.position.clone();
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
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope4 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope4.castShadow = true;
    rope4.receiveShadow = true;
    scene.add( rope4 );
    // Rope physic object
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
    rope.userData.physicsBody = ropeSoftBody;
    // Disable deactivation
    ropeSoftBody.setActivationState( 4 );
    
    //chime3
    
    var chimeMass = 2.9;
    var chime = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 3.8, 3.8), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    chime.castShadow = true;
    chime.receiveShadow = true;
    var chimeShape = new Ammo.btCylinderShape( 3 );
    chimeShape.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime, chimeShape, chimeMass, pos, quat );
    chime.position.y = ropePos.y - 2 * ropeLength;
    chime.position.z -= .85
    chime.userData.physicsBody.setFriction( 0.5 );
    
    // The rope5
    // Rope graphic object
    ropeNumSegments = 10;
    ropeLength = .8;
    ropeMass = 3;
    ropePos = ball.position.clone();
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
    ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
    ropeGeometry.computeBoundingSphere();
    rope5 = new THREE.LineSegments( ropeGeometry, ropeMaterial );
    rope5.castShadow = true;
    rope5.receiveShadow = true;
    scene.add( rope5 );
    // Rope physic object
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
    rope.userData.physicsBody = ropeSoftBody;
    // Disable deactivation
    ropeSoftBody.setActivationState( 4 );
    
    //chime4
    
    var chimeMass = 2.5;
    var chime = new THREE.Mesh( new THREE.CylinderGeometry(.3, .3, 3, 3), new THREE.MeshPhongMaterial( { color: 0x11111 } ) );
    //var geometry = new THREE.CircleGeometry( 3, ballRadius );
    //var material = new THREE.MeshPhongMaterial( { color: 0x11111 } ) ;
    //var ball = new THREE.Mesh( geometry, material );
    chime.castShadow = true;
    chime.receiveShadow = true;
    var chimeShape = new Ammo.btCylinderShape( 3 );
    chimeShape.setMargin( margin );
    pos.set( - 3, 2, 0 );
    quat.set( 0, 0, 0, 1 );
    createRigidBody( chime, chimeShape, chimeMass, pos, quat );
    chime.position.y = ropePos.y - 2 * ropeLength + .2;
    chime.position.z += .85
    chime.userData.physicsBody.setFriction( 0.5 );
		
        // renderer
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        renderer.shadowMap.enabled = true;
    
        // controls
        var controls = new THREE.OrbitControls( camera, renderer.domElement );
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
		renderer.render( scene, camera );
	}
