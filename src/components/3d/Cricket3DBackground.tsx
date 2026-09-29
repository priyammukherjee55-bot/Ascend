import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export type CricketDuel =
  | 'kohli_bumrah'
  | 'rohit_starc'
  | 'root_bumrah'
  | 'williamson_starc';

interface Cricket3DProps {
  interactive?: boolean;
  opacity?: number;
  className?: string;
  selectedDuel?: CricketDuel;
  onDuelChange?: (duel: CricketDuel) => void;
}

export const Cricket3DBackground: React.FC<Cricket3DProps> = ({
  interactive = true,
  opacity = 0.95,
  className = '',
  selectedDuel = 'kohli_bumrah',
  onDuelChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [currentDuel, setCurrentDuel] = useState<CricketDuel>(selectedDuel);
  const [cameraView, setCameraView] = useState<'broadcast' | 'bowler' | 'batsman' | 'drone'>('broadcast');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const isPlayingRef = useRef(true);

  useEffect(() => {
    setCurrentDuel(selectedDuel);
  }, [selectedDuel]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';

    // Sky & Fog
    scene.background = new THREE.Color(isDark ? 0x070b14 : 0x87ceeb);
    scene.fog = new THREE.FogExp2(isDark ? 0x070b14 : 0x87ceeb, 0.012);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const setCameraPos = (view: 'broadcast' | 'bowler' | 'batsman' | 'drone') => {
      if (view === 'broadcast') {
        camera.position.set(0, 16, 32);
        camera.lookAt(0, 2, 0);
      } else if (view === 'bowler') {
        camera.position.set(0, 6, 24);
        camera.lookAt(0, 3, -12);
      } else if (view === 'batsman') {
        camera.position.set(0, 4, -16);
        camera.lookAt(0, 3, 15);
      } else if (view === 'drone') {
        camera.position.set(0, 40, 2);
        camera.lookAt(0, 0, 0);
      }
    };
    setCameraPos(cameraView);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x223344 : 0xffffff,
      isDark ? 0.7 : 0.9
    );
    scene.add(ambientLight);

    // Sun / Main directional light
    const dirLight = new THREE.DirectionalLight(isDark ? 0x88bbff : 0xfff4e0, isDark ? 1.2 : 1.8);
    dirLight.position.set(25, 40, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Floodlight Towers (Stadium Atmosphere)
    if (isDark) {
      const floodlights = [
        [-35, 30, -35],
        [35, 30, -35],
        [-35, 30, 35],
        [35, 30, 35],
      ];
      floodlights.forEach(([x, y, z]) => {
        const spot = new THREE.SpotLight(0xaaddff, 3, 90, Math.PI / 4, 0.4, 1);
        spot.position.set(x, y, z);
        spot.target.position.set(0, 0, 0);
        scene.add(spot);
        scene.add(spot.target);

        // Floodlight Pole Mesh
        const poleGeo = new THREE.CylinderGeometry(0.3, 0.6, y, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, y / 2, z);
        scene.add(pole);

        // Floodlight head
        const headGeo = new THREE.BoxGeometry(3, 2, 2);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(x, y, z);
        scene.add(head);
      });
    }

    // 3. Ground, Stadium & 22-Yard Pitch
    // Stadium Ground (Grass Oval)
    const grassGeo = new THREE.CylinderGeometry(48, 50, 1, 64);
    const grassMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x14532d : 0x22c55e,
      roughness: 0.8,
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = -0.5;
    grass.receiveShadow = true;
    scene.add(grass);

    // Boundary Rope
    const ropeGeo = new THREE.TorusGeometry(42, 0.35, 12, 64);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.1;
    scene.add(rope);

    // 22-Yard Pitch Strip (Light Clay / Turf)
    const pitchLength = 22; // ~20.12 meters scaled
    const pitchWidth = 3.6;
    const pitchGeo = new THREE.PlaneGeometry(pitchWidth, pitchLength);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xca8a04 : 0xfde047,
      roughness: 0.9,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0.02, 0);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Crease lines (Popping and Bowling creases)
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const createCrease = (zPos: number) => {
      const creaseGeo = new THREE.PlaneGeometry(3.6, 0.12);
      const crease = new THREE.Mesh(creaseGeo, creaseMat);
      crease.rotation.x = -Math.PI / 2;
      crease.position.set(0, 0.03, zPos);
      scene.add(crease);
    };
    createCrease(-10); // Batsman bowling crease
    createCrease(-8.8); // Batsman popping crease
    createCrease(10); // Bowler bowling crease
    createCrease(8.8); // Bowler popping crease

    // 4. Stumps & Bails Builder
    const createStumps = (zPos: number) => {
      const stumpsGroup = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      for (let i = -1; i <= 1; i++) {
        const stumpGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
        const stump = new THREE.Mesh(stumpGeo, woodMat);
        stump.position.set(i * 0.15, 0.45, 0);
        stump.castShadow = true;
        stumpsGroup.add(stump);
      }
      // Bail
      const bailGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
      const bail = new THREE.Mesh(bailGeo, woodMat);
      bail.rotation.z = Math.PI / 2;
      bail.position.set(0, 0.91, 0);
      stumpsGroup.add(bail);

      stumpsGroup.position.set(0, 0, zPos);
      scene.add(stumpsGroup);
      return stumpsGroup;
    };
    createStumps(-10); // Striker end
    createStumps(10); // Non-striker end

    // 5. Build Articulated 3D Human Player Models
    // Helper to build a cricketer mesh with torso, head, arms, legs, bat
    const createPlayer = (options: {
      jerseyColor: number;
      pantsColor: number;
      skinColor?: number;
      hasBat?: boolean;
      hasPads?: boolean;
      hasHelmet?: boolean;
    }) => {
      const playerGroup = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: options.skinColor || 0xd2996e });
      const jerseyMat = new THREE.MeshStandardMaterial({ color: options.jerseyColor, roughness: 0.6 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: options.pantsColor, roughness: 0.6 });

      // Torso
      const torsoGeo = new THREE.BoxGeometry(0.65, 0.9, 0.35);
      const torso = new THREE.Mesh(torsoGeo, jerseyMat);
      torso.position.y = 1.35;
      torso.castShadow = true;
      playerGroup.add(torso);

      // Head
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 2.05;
      head.castShadow = true;
      playerGroup.add(head);

      // Helmet / Cap
      if (options.hasHelmet) {
        const helmetGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
        const helmet = new THREE.Mesh(helmetGeo, helmetMat);
        helmet.position.set(0, 2.1, -0.02);
        playerGroup.add(helmet);

        // Grille / Visor
        const visorGeo = new THREE.BoxGeometry(0.26, 0.15, 0.2);
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 2.0, 0.18);
        playerGroup.add(visor);
      }

      // Limbs: Legs
      const leftLeg = new THREE.Group();
      const rightLeg = new THREE.Group();

      const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.9, 12);
      const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
      leftLegMesh.position.y = -0.45;
      leftLegMesh.castShadow = true;
      leftLeg.add(leftLegMesh);
      leftLeg.position.set(-0.2, 0.9, 0);

      const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
      rightLegMesh.position.y = -0.45;
      rightLegMesh.castShadow = true;
      rightLeg.add(rightLegMesh);
      rightLeg.position.set(0.2, 0.9, 0);

      // Pads on legs for batsman
      if (options.hasPads) {
        const padGeo = new THREE.BoxGeometry(0.25, 0.7, 0.15);
        const padMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const leftPad = new THREE.Mesh(padGeo, padMat);
        leftPad.position.set(0, -0.45, 0.1);
        leftLeg.add(leftPad);

        const rightPad = new THREE.Mesh(padGeo, padMat);
        rightPad.position.set(0, -0.45, 0.1);
        rightLeg.add(rightPad);
      }

      playerGroup.add(leftLeg);
      playerGroup.add(rightLeg);

      // Arms
      const leftArm = new THREE.Group();
      const rightArm = new THREE.Group();

      const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.7, 12);
      const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
      leftArmMesh.position.y = -0.35;
      leftArmMesh.castShadow = true;
      leftArm.add(leftArmMesh);
      leftArm.position.set(-0.4, 1.7, 0);

      const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
      rightArmMesh.position.y = -0.35;
      rightArmMesh.castShadow = true;
      rightArm.add(rightArmMesh);
      rightArm.position.set(0.4, 1.7, 0);

      // Cricket Bat
      let bat: THREE.Mesh | null = null;
      if (options.hasBat) {
        const batGroup = new THREE.Group();
        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.y = 0.15;
        batGroup.add(handle);

        // Blade
        const bladeGeo = new THREE.BoxGeometry(0.14, 0.7, 0.04);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = -0.35;
        blade.castShadow = true;
        batGroup.add(blade);

        batGroup.position.set(0, -0.6, 0.15);
        rightArm.add(batGroup);
        bat = blade;
      }

      playerGroup.add(leftArm);
      playerGroup.add(rightArm);

      return {
        group: playerGroup,
        torso,
        head,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        bat,
      };
    };

    // Color definitions for legends:
    // India: Navy 0x1e3a8a, Sky 0x0284c7 (Kohli, Rohit, Bumrah)
    // England: Red 0xdc2626 / White (Root)
    // New Zealand: Black 0x18181b (Williamson)
    // Australia: Canary Yellow 0xeab308 / Green 0x15803d (Starc)

    const isBumrah = currentDuel.includes('bumrah');
    const bowlerColors = isBumrah
      ? { jerseyColor: 0x1e3a8a, pantsColor: 0x1e3a8a } // Jasprit Bumrah
      : { jerseyColor: 0xeab308, pantsColor: 0x15803d }; // Mitchell Starc

    const batsmanColors = currentDuel.startsWith('kohli')
      ? { jerseyColor: 0x1e3a8a, pantsColor: 0x1e3a8a, hasHelmet: true } // Virat Kohli
      : currentDuel.startsWith('rohit')
      ? { jerseyColor: 0x1e3a8a, pantsColor: 0x1e3a8a, hasHelmet: true } // Rohit Sharma
      : currentDuel.startsWith('root')
      ? { jerseyColor: 0xdc2626, pantsColor: 0x1e293b, hasHelmet: true } // Joe Root
      : { jerseyColor: 0x18181b, pantsColor: 0x18181b, hasHelmet: true }; // Kane Williamson

    // Instantiate Bowler
    const bowler = createPlayer({
      ...bowlerColors,
      hasBat: false,
      hasPads: false,
    });
    scene.add(bowler.group);

    // Instantiate Batsman
    const batsman = createPlayer({
      ...batsmanColors,
      hasBat: true,
      hasPads: true,
    });
    batsman.group.position.set(0.3, 0, -9.2);
    batsman.group.rotation.y = Math.PI / 2; // Facing the bowler sideways
    scene.add(batsman.group);

    // Instantiate Wicketkeeper
    const keeper = createPlayer({
      jerseyColor: bowlerColors.jerseyColor,
      pantsColor: bowlerColors.pantsColor,
      hasPads: true,
    });
    keeper.group.position.set(0, 0, -12);
    keeper.group.rotation.y = 0;
    scene.add(keeper.group);

    // Slip Fielder
    const slip = createPlayer({
      jerseyColor: bowlerColors.jerseyColor,
      pantsColor: bowlerColors.pantsColor,
    });
    slip.group.position.set(3.5, 0, -13.5);
    slip.group.rotation.y = -0.3;
    scene.add(slip.group);

    // 6. Cricket Ball
    const ballGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Red leather ball
      roughness: 0.3,
      metalness: 0.1,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    scene.add(ball);

    // Ball trail effect
    const trailCount = 15;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xff3b30,
      linewidth: 2,
      transparent: true,
      opacity: 0.7,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);

    // 7. Dynamic Delivery & Shot Animation Loop
    let animClock = 0;
    let animId: number;

    // Delivery Cycle: Runup -> Jump & Release -> Pitch Bounce -> Bat Impact -> Ball Flight -> Reset
    const CYCLE_DURATION = 4.2; // seconds per delivery cycle

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        animClock += 0.024;
      }

      const cycleTime = animClock % CYCLE_DURATION;

      // PHASE 1: Bowler Run-up (0.0s to 1.8s)
      if (cycleTime < 1.8) {
        const runProgress = cycleTime / 1.8;
        // Bowler runs from z = 22 to z = 10.5
        const currentZ = 22 - runProgress * 11.5;
        bowler.group.position.set(0.6, 0, currentZ);
        bowler.group.rotation.y = Math.PI;

        // Running leg animation
        const runCycle = cycleTime * 14;
        bowler.leftLeg.rotation.x = Math.sin(runCycle) * 0.7;
        bowler.rightLeg.rotation.x = -Math.sin(runCycle) * 0.7;
        bowler.leftArm.rotation.x = -Math.sin(runCycle) * 0.8;
        bowler.rightArm.rotation.x = Math.sin(runCycle) * 0.8;

        // Ball is in bowler's hand
        ball.position.set(bowler.group.position.x + 0.4, 1.5, bowler.group.position.z);
        ball.visible = true;

        // Batsman tapping bat in stance
        const tapCycle = Math.sin(cycleTime * 6);
        batsman.rightArm.rotation.x = -0.4 + tapCycle * 0.15;
        batsman.leftArm.rotation.x = -0.3 + tapCycle * 0.1;
      }
      // PHASE 2: Delivery Stride, Windup & Release (1.8s to 2.1s)
      else if (cycleTime < 2.1) {
        const strideProgress = (cycleTime - 1.8) / 0.3;
        bowler.group.position.set(0.6, Math.sin(strideProgress * Math.PI) * 0.4, 10.5);

        // Windup arm rotation (Bumrah slingshot / Starc high arm whip)
        if (isBumrah) {
          bowler.rightArm.rotation.x = -Math.PI + strideProgress * Math.PI * 2.2;
          bowler.rightArm.rotation.z = -0.4;
        } else {
          bowler.rightArm.rotation.x = -Math.PI + strideProgress * Math.PI * 2;
          bowler.rightArm.rotation.z = 0.2;
        }

        ball.position.set(
          bowler.group.position.x + 0.4,
          2.2 - strideProgress * 0.5,
          10.5 - strideProgress * 2
        );
      }
      // PHASE 3: Ball Flight to Batsman & Shot Execution (2.1s to 2.7s)
      else if (cycleTime < 2.7) {
        const flightProgress = (cycleTime - 2.1) / 0.6; // 0 to 1
        const startZ = 8.5;
        const endZ = -9.0;
        const currentZ = startZ + flightProgress * (endZ - startZ);

        // Pitch bounce trajectory (bounces at good length z = -2.5)
        let ballY = 1.8;
        if (flightProgress < 0.6) {
          // Descending to bounce
          const desc = flightProgress / 0.6;
          ballY = 1.8 - desc * 1.68; // hits pitch at y ~ 0.12
        } else {
          // Bouncing up to batsman waist/knee
          const asc = (flightProgress - 0.6) / 0.4;
          ballY = 0.12 + asc * 0.95;
        }

        // Seam / swing trajectory
        const ballX = Math.sin(flightProgress * Math.PI) * 0.35;
        ball.position.set(ballX, ballY, currentZ);

        // Batsman prepares and plays shot based on Legend Duel
        const shotProgress = (cycleTime - 2.3) / 0.4;
        if (shotProgress > 0) {
          if (currentDuel === 'kohli_bumrah') {
            // Virat Kohli: Classic cover drive with high elbow
            batsman.leftLeg.position.z = 0.4; // Front foot stride
            batsman.rightArm.rotation.x = -1.6 + shotProgress * 1.8; // High drive follow-through
            batsman.rightArm.rotation.y = -0.7;
          } else if (currentDuel === 'rohit_starc') {
            // Rohit Sharma: Front foot pull shot
            batsman.group.rotation.y = (Math.PI / 2) - shotProgress * 0.8;
            batsman.rightArm.rotation.x = -0.8 + shotProgress * 1.4;
            batsman.rightArm.rotation.z = -0.5;
          } else if (currentDuel === 'root_bumrah') {
            // Joe Root: Straight drive down the pitch
            batsman.leftLeg.position.z = 0.35;
            batsman.rightArm.rotation.x = -1.4 + shotProgress * 1.5;
          } else {
            // Kane Williamson: Late cut past slip
            batsman.rightLeg.position.z = -0.3; // Back foot movement
            batsman.rightArm.rotation.x = -0.9 + shotProgress * 1.2;
            batsman.rightArm.rotation.y = 0.6;
          }
        }
      }
      // PHASE 4: Shot Hit & Ball travels to boundary (2.7s to 4.2s)
      else {
        const exitProgress = (cycleTime - 2.7) / 1.5; // 0 to 1
        let targetX = -18;
        let targetZ = -25;

        if (currentDuel === 'kohli_bumrah') {
          // Cover boundary
          targetX = -32;
          targetZ = -12;
        } else if (currentDuel === 'rohit_starc') {
          // Mid-wicket boundary
          targetX = 30;
          targetZ = 5;
        } else if (currentDuel === 'root_bumrah') {
          // Long-on / straight drive
          targetX = 2;
          targetZ = 35;
        } else {
          // Third-man late cut
          targetX = 28;
          targetZ = -30;
        }

        const ballX = 0 + exitProgress * targetX;
        const ballZ = -9.2 + exitProgress * targetZ;
        const ballY = Math.max(0.12, Math.sin(exitProgress * Math.PI) * 4);
        ball.position.set(ballX, ballY, ballZ);

        // Slip and keeper watch ball
        slip.head.lookAt(ball.position);
        keeper.head.lookAt(ball.position);
      }

      // Gentle interactive camera drift or orbit
      if (cameraView === 'broadcast') {
        const camOsc = Math.sin(animClock * 0.2) * 4;
        camera.position.x = camOsc;
        camera.lookAt(0, 2, 0);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, currentDuel, cameraView]);

  const duels: { id: CricketDuel; label: string; bowler: string; batsman: string; shot: string }[] = [
    {
      id: 'kohli_bumrah',
      label: 'King Kohli vs Bumrah',
      batsman: 'Virat Kohli #18',
      bowler: 'Jasprit Bumrah #93',
      shot: 'Masterclass Cover Drive',
    },
    {
      id: 'rohit_starc',
      label: 'Hitman vs Starc',
      batsman: 'Rohit Sharma #45',
      bowler: 'Mitchell Starc #56',
      shot: 'Signature Pull Shot',
    },
    {
      id: 'root_bumrah',
      label: 'Root Classic vs Bumrah',
      batsman: 'Joe Root #66',
      bowler: 'Jasprit Bumrah #93',
      shot: 'Straight Drive Punch',
    },
    {
      id: 'williamson_starc',
      label: 'Williamson vs Starc',
      batsman: 'Kane Williamson #22',
      bowler: 'Mitchell Starc #56',
      shot: 'Soft-Hands Late Cut',
    },
  ];

  const activeDuelInfo = duels.find((d) => d.id === currentDuel) || duels[0];

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 3D Three.js WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 pointer-events-auto"
        style={{ opacity }}
      />

      {/* Interactive 3D Stadium HUD Overlay */}
      {interactive && (
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Active 3D Duel Tag */}
          <div className="pointer-events-auto p-3 rounded-2xl bg-zinc-900/80 dark:bg-black/75 backdrop-blur-md border border-amber-500/30 text-white shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-black text-sm shadow-md">
              🏏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  3D Arena Duel
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-xs font-bold text-zinc-100">
                {activeDuelInfo.batsman} <span className="text-amber-400">vs</span> {activeDuelInfo.bowler}
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Action: {activeDuelInfo.shot}
              </div>
            </div>
          </div>

          {/* Controls: Duel Picker, Camera angle, Play/Pause */}
          <div className="pointer-events-auto flex items-center gap-2 bg-zinc-900/80 dark:bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-700/50 shadow-xl">
            {/* Duel Selector */}
            <select
              value={currentDuel}
              onChange={(e) => {
                const duel = e.target.value as CricketDuel;
                setCurrentDuel(duel);
                onDuelChange?.(duel);
              }}
              className="bg-zinc-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-zinc-700 outline-none hover:border-amber-400 transition cursor-pointer"
            >
              {duels.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Camera Angle Selector */}
            <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded-xl text-[11px] font-bold text-zinc-300">
              <button
                onClick={() => setCameraView('broadcast')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'broadcast' ? 'bg-amber-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Broadcast
              </button>
              <button
                onClick={() => setCameraView('bowler')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'bowler' ? 'bg-amber-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Bowler
              </button>
              <button
                onClick={() => setCameraView('batsman')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'batsman' ? 'bg-amber-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Batsman
              </button>
              <button
                onClick={() => setCameraView('drone')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'drone' ? 'bg-amber-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Top-Down
              </button>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition text-xs font-bold px-2.5"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
