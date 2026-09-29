import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export type FootballPlay =
  | 'messi_curl'
  | 'ronaldo_rocket'
  | 'chhetri_volley'
  | 'neymar_vs_ramos'
  | 'match_pass_sequence';

interface Football3DProps {
  interactive?: boolean;
  opacity?: number;
  className?: string;
  selectedPlay?: FootballPlay;
  onPlayChange?: (play: FootballPlay) => void;
}

export const Football3DBackground: React.FC<Football3DProps> = ({
  interactive = true,
  opacity = 0.95,
  className = '',
  selectedPlay = 'messi_curl',
  onPlayChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [currentPlay, setCurrentPlay] = useState<FootballPlay>(selectedPlay);
  const [cameraView, setCameraView] = useState<'broadcast' | 'striker' | 'goalline' | 'drone'>('broadcast');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const isPlayingRef = useRef(true);

  useEffect(() => {
    setCurrentPlay(selectedPlay);
  }, [selectedPlay]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';

    scene.background = new THREE.Color(isDark ? 0x06111e : 0x7ec8e3);
    scene.fog = new THREE.FogExp2(isDark ? 0x06111e : 0x7ec8e3, 0.01);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const setCameraPos = (view: 'broadcast' | 'striker' | 'goalline' | 'drone') => {
      if (view === 'broadcast') {
        camera.position.set(0, 18, 36);
        camera.lookAt(0, 2, 0);
      } else if (view === 'striker') {
        camera.position.set(0, 5, 20);
        camera.lookAt(0, 2, -18);
      } else if (view === 'goalline') {
        camera.position.set(0, 3, -22);
        camera.lookAt(0, 2, 0);
      } else if (view === 'drone') {
        camera.position.set(0, 48, 1);
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

    // 2. Lighting & Stadium Floodlights
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x223344 : 0xffffff,
      isDark ? 0.7 : 0.95
    );
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(isDark ? 0x90c5ff : 0xfffaed, isDark ? 1.3 : 1.8);
    sun.position.set(30, 45, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    if (isDark) {
      const floodlights = [
        [-38, 28, -30],
        [38, 28, -30],
        [-38, 28, 30],
        [38, 28, 30],
      ];
      floodlights.forEach(([x, y, z]) => {
        const spot = new THREE.SpotLight(0xa5f3fc, 3.5, 95, Math.PI / 3.8, 0.4, 1);
        spot.position.set(x, y, z);
        spot.target.position.set(0, 0, 0);
        scene.add(spot);
        scene.add(spot.target);

        // Tower Mast
        const mastGeo = new THREE.CylinderGeometry(0.3, 0.6, y, 8);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(x, y / 2, z);
        scene.add(mast);

        // Head lamps
        const lampGeo = new THREE.BoxGeometry(3, 2, 2);
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xecfeff });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(x, y, z);
        scene.add(lamp);
      });
    }

    // 3. Football Pitch & Regulation Lines
    const pitchLength = 54;
    const pitchWidth = 36;

    // Grass Base
    const pitchBaseGeo = new THREE.PlaneGeometry(pitchWidth + 8, pitchLength + 8);
    const pitchBaseMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x064e3b : 0x16a34a,
      roughness: 0.85,
    });
    const pitchBase = new THREE.Mesh(pitchBaseGeo, pitchBaseMat);
    pitchBase.rotation.x = -Math.PI / 2;
    pitchBase.receiveShadow = true;
    scene.add(pitchBase);

    // Mowing pattern turf stripes
    const stripeCount = 9;
    const stripeLen = pitchLength / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        const stripeGeo = new THREE.PlaneGeometry(pitchWidth, stripeLen);
        const stripeMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x047857 : 0x22c55e,
          roughness: 0.85,
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.01, -pitchLength / 2 + stripeLen / 2 + i * stripeLen);
        stripe.receiveShadow = true;
        scene.add(stripe);
      }
    }

    // Pitch Lines (Touchlines, halfway, penalty boxes)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Boundary touchlines
    const addLine = (w: number, h: number, x: number, z: number) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mesh = new THREE.Mesh(geo, lineMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.02, z);
      scene.add(mesh);
    };

    // Outer boundary rectangle
    addLine(pitchWidth, 0.15, 0, -pitchLength / 2); // North goal line
    addLine(pitchWidth, 0.15, 0, pitchLength / 2); // South goal line
    addLine(0.15, pitchLength, -pitchWidth / 2, 0); // West touch line
    addLine(0.15, pitchLength, pitchWidth / 2, 0); // East touch line

    // Halfway line & Center Circle
    addLine(pitchWidth, 0.15, 0, 0);

    const circleGeo = new THREE.RingGeometry(5.2, 5.35, 32);
    const circleMesh = new THREE.Mesh(circleGeo, lineMat);
    circleMesh.rotation.x = -Math.PI / 2;
    circleMesh.position.set(0, 0.02, 0);
    scene.add(circleMesh);

    // Penalty Boxes (North end z = -27)
    addLine(18, 0.15, 0, -18); // 18-yard box line
    addLine(0.15, 9, -9, -22.5); // 18-yard box side
    addLine(0.15, 9, 9, -22.5); // 18-yard box side

    // Penalty Spot
    const spotGeo = new THREE.CircleGeometry(0.2, 16);
    const spotMesh = new THREE.Mesh(spotGeo, lineMat);
    spotMesh.rotation.x = -Math.PI / 2;
    spotMesh.position.set(0, 0.02, -16);
    scene.add(spotMesh);

    // 4. 3D Goalposts & Net at North End
    const goalGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // Left Post, Right Post, Crossbar
    const postRadius = 0.12;
    const postHeight = 3.2;
    const goalWidth = 8.5;

    const leftPostGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
    const leftPost = new THREE.Mesh(leftPostGeo, postMat);
    leftPost.position.set(-goalWidth / 2, postHeight / 2, 0);
    leftPost.castShadow = true;
    goalGroup.add(leftPost);

    const rightPost = new THREE.Mesh(leftPostGeo, postMat);
    rightPost.position.set(goalWidth / 2, postHeight / 2, 0);
    rightPost.castShadow = true;
    goalGroup.add(rightPost);

    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 16);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, postHeight, 0);
    crossbar.castShadow = true;
    goalGroup.add(crossbar);

    // 3D Net Box
    const netMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const netGeo = new THREE.BoxGeometry(goalWidth, postHeight, 2.5);
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, postHeight / 2, -1.25);
    goalGroup.add(net);

    goalGroup.position.set(0, 0, -pitchLength / 2);
    scene.add(goalGroup);

    // 5. 3D Articulated Football Player Builder
    const createFootballer = (options: {
      jerseyColor: number;
      shortsColor: number;
      skinColor?: number;
      isGoalkeeper?: boolean;
    }) => {
      const footballerGroup = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: options.skinColor || 0xd2996e });
      const jerseyMat = new THREE.MeshStandardMaterial({ color: options.jerseyColor, roughness: 0.6 });
      const shortsMat = new THREE.MeshStandardMaterial({ color: options.shortsColor, roughness: 0.6 });

      // Torso
      const torsoGeo = new THREE.BoxGeometry(0.7, 0.95, 0.35);
      const torso = new THREE.Mesh(torsoGeo, jerseyMat);
      torso.position.y = 1.35;
      torso.castShadow = true;
      footballerGroup.add(torso);

      // Head & Hair
      const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 2.05;
      head.castShadow = true;
      footballerGroup.add(head);

      // Limbs: Legs with soccer socks & cleats
      const leftLeg = new THREE.Group();
      const rightLeg = new THREE.Group();

      const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.95, 12);
      const leftLegMesh = new THREE.Mesh(legGeo, shortsMat);
      leftLegMesh.position.y = -0.45;
      leftLegMesh.castShadow = true;
      leftLeg.add(leftLegMesh);
      leftLeg.position.set(-0.22, 0.9, 0);

      const rightLegMesh = new THREE.Mesh(legGeo, shortsMat);
      rightLegMesh.position.y = -0.45;
      rightLegMesh.castShadow = true;
      rightLeg.add(rightLegMesh);
      rightLeg.position.set(0.22, 0.9, 0);

      // Cleats / Boots
      const bootMat = new THREE.MeshStandardMaterial({
        color: options.isGoalkeeper ? 0xef4444 : 0x000000,
      });
      const bootGeo = new THREE.BoxGeometry(0.16, 0.14, 0.3);
      const leftBoot = new THREE.Mesh(bootGeo, bootMat);
      leftBoot.position.set(0, -0.9, 0.08);
      leftLeg.add(leftBoot);

      const rightBoot = new THREE.Mesh(bootGeo, bootMat);
      rightBoot.position.set(0, -0.9, 0.08);
      rightLeg.add(rightBoot);

      footballerGroup.add(leftLeg);
      footballerGroup.add(rightLeg);

      // Arms & Hands (or GK Gloves)
      const leftArm = new THREE.Group();
      const rightArm = new THREE.Group();

      const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.75, 12);
      const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
      leftArmMesh.position.y = -0.35;
      leftArmMesh.castShadow = true;
      leftArm.add(leftArmMesh);
      leftArm.position.set(-0.45, 1.7, 0);

      const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
      rightArmMesh.position.y = -0.35;
      rightArmMesh.castShadow = true;
      rightArm.add(rightArmMesh);
      rightArm.position.set(0.45, 1.7, 0);

      // Goalkeeper Gloves
      if (options.isGoalkeeper) {
        const gloveGeo = new THREE.BoxGeometry(0.18, 0.22, 0.14);
        const gloveMat = new THREE.MeshStandardMaterial({ color: 0x84cc16 });
        const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
        leftGlove.position.y = -0.75;
        leftArm.add(leftGlove);

        const rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
        rightGlove.position.y = -0.75;
        rightArm.add(rightGlove);
      }

      footballerGroup.add(leftArm);
      footballerGroup.add(rightArm);

      return {
        group: footballerGroup,
        torso,
        head,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
      };
    };

    // Color definitions for legends:
    // Messi: Argentina Albiceleste (Sky Blue 0x38bdf8 & White) or Inter Miami Pink 0xf472b6
    // Ronaldo: Portugal Red 0xdc2626 & Green 0x16a34a
    // Neymar: Brazil Canary Yellow 0xfacc15 & Royal Blue 0x1d4ed8
    // Sunil Chhetri: India National Blue Tigers 0x0284c7 & White 0xffffff
    // Sergio Ramos: Spain Red 0xb91c1c or Real Madrid White 0xffffff
    // Goalkeeper: Neon Yellow 0xeab308

    // Active Attacker (Messi, Ronaldo, Neymar, or Chhetri)
    let attackerColors = { jerseyColor: 0x38bdf8, shortsColor: 0x000000 };
    if (currentPlay === 'ronaldo_rocket') {
      attackerColors = { jerseyColor: 0xdc2626, shortsColor: 0x15803d }; // Ronaldo
    } else if (currentPlay === 'chhetri_volley') {
      attackerColors = { jerseyColor: 0x0284c7, shortsColor: 0xffffff }; // Sunil Chhetri
    } else if (currentPlay === 'neymar_vs_ramos') {
      attackerColors = { jerseyColor: 0xfacc15, shortsColor: 0x1d4ed8 }; // Neymar Jr
    }

    const striker = createFootballer(attackerColors);
    scene.add(striker.group);

    // Defender: Sergio Ramos (#4)
    const defender = createFootballer({
      jerseyColor: 0xffffff, // White kit
      shortsColor: 0xffffff,
    });
    scene.add(defender.group);

    // Goalkeeper (#1)
    const goalkeeper = createFootballer({
      jerseyColor: 0x84cc16, // Fluorescent GK kit
      shortsColor: 0x84cc16,
      isGoalkeeper: true,
    });
    goalkeeper.group.position.set(0, 0, -pitchLength / 2 + 1.5);
    scene.add(goalkeeper.group);

    // 6. 3D Football Ball with FIFA Pattern
    const ballGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    scene.add(ball);

    // 7. Dynamic Football Play Animation Loop
    let animClock = 0;
    let animId: number;
    const CYCLE_DURATION = 4.8; // seconds per play

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        animClock += 0.024;
      }

      const cycleTime = animClock % CYCLE_DURATION;

      // Reset defender default stance
      defender.group.position.set(1.5, 0, -8);
      defender.group.rotation.y = Math.PI;

      // Reset goalkeeper default stance
      goalkeeper.group.position.set(0, 0, -pitchLength / 2 + 1.2);
      goalkeeper.group.rotation.y = 0;

      // PLAY TYPE ANIMATION
      // ==========================================
      // 1. MESSI SIGNATURE DRIBBLE & TOP-CORNER CURL
      // ==========================================
      if (currentPlay === 'messi_curl') {
        if (cycleTime < 2.2) {
          // Messi dribbling up pitch with body feints
          const dribbleProgress = cycleTime / 2.2;
          const zPos = 8 - dribbleProgress * 15;
          const xWave = Math.sin(cycleTime * 7) * 1.2;

          striker.group.position.set(xWave, 0, zPos);
          striker.group.rotation.y = Math.PI + Math.cos(cycleTime * 7) * 0.4;

          const runRate = cycleTime * 16;
          striker.leftLeg.rotation.x = Math.sin(runRate) * 0.7;
          striker.rightLeg.rotation.x = -Math.sin(runRate) * 0.7;

          // Ball rolls at Messi's feet
          ball.position.set(xWave, 0.22, zPos - 0.7);
        } else if (cycleTime < 2.6) {
          // Left-foot curling shot strike
          const kickProgress = (cycleTime - 2.2) / 0.4;
          striker.leftLeg.rotation.x = -0.4 + kickProgress * 1.5; // Left leg whips
          striker.rightLeg.rotation.x = -0.3; // Plant foot

          ball.position.set(striker.group.position.x - 0.2, 0.4 + kickProgress * 0.8, -7.5 - kickProgress * 4);
        } else {
          // Ball curls high into top-right corner of the net
          const flightProgress = (cycleTime - 2.6) / 2.2;
          const targetX = 3.2;
          const targetY = 2.6; // Top corner
          const targetZ = -pitchLength / 2 + 0.3;

          const ballX = 0 + flightProgress * targetX + Math.sin(flightProgress * Math.PI) * 1.5;
          const ballY = Math.min(targetY, 1.2 + Math.sin(flightProgress * Math.PI * 0.8) * 2.0);
          const ballZ = -11.5 + flightProgress * (targetZ - (-11.5));

          ball.position.set(ballX, ballY, ballZ);

          // Goalkeeper dives to top corner
          goalkeeper.group.position.x = flightProgress * 2.2;
          goalkeeper.group.position.y = Math.sin(flightProgress * Math.PI) * 1.4;
          goalkeeper.group.rotation.z = -flightProgress * 0.8;
        }
      }
      // ==========================================
      // 2. CRISTIANO RONALDO EXPLOSIVE KNUCKLEBALL ROCKET
      // ==========================================
      else if (currentPlay === 'ronaldo_rocket') {
        if (cycleTime < 2.0) {
          // Power run-up
          const runProgress = cycleTime / 2.0;
          const zPos = 12 - runProgress * 18;
          striker.group.position.set(0, 0, zPos);
          striker.group.rotation.y = Math.PI;

          const runRate = cycleTime * 18;
          striker.leftLeg.rotation.x = Math.sin(runRate) * 0.8;
          striker.rightLeg.rotation.x = -Math.sin(runRate) * 0.8;
          ball.position.set(0, 0.22, -6.5);
        } else if (cycleTime < 2.4) {
          // Explosive right-foot knuckleball strike
          const kickProg = (cycleTime - 2.0) / 0.4;
          striker.rightLeg.rotation.x = -1.2 + kickProg * 2.2;
          ball.position.set(0, 0.3 + kickProg * 1.2, -6.5 - kickProg * 5);
        } else if (cycleTime < 3.6) {
          // Knuckleball bullet into the bottom corner
          const flightProgress = (cycleTime - 2.4) / 1.2;
          const targetX = -3.4;
          const targetY = 0.5;
          const targetZ = -pitchLength / 2 + 0.3;

          ball.position.set(
            flightProgress * targetX,
            Math.max(0.22, 1.5 - flightProgress * 1.0),
            -11.5 + flightProgress * (targetZ - (-11.5))
          );

          // Goalkeeper dives low
          goalkeeper.group.position.x = -flightProgress * 2.4;
          goalkeeper.group.rotation.z = flightProgress * 0.7;
        } else {
          // Iconic Ronaldo Siuuu celebration jump
          const celebProg = (cycleTime - 3.6) / 1.2;
          striker.group.position.set(0, Math.sin(celebProg * Math.PI) * 1.8, -10);
          striker.group.rotation.y = celebProg * Math.PI * 2;
          striker.leftArm.rotation.x = -2.2;
          striker.rightArm.rotation.x = -2.2;
        }
      }
      // ==========================================
      // 3. SUNIL CHHETRI FLYING HEADER / VOLLEY
      // ==========================================
      else if (currentPlay === 'chhetri_volley') {
        if (cycleTime < 2.0) {
          // Cross incoming from wing, Chhetri sprints into 6-yard box
          const crossProg = cycleTime / 2.0;
          ball.position.set(16 - crossProg * 14, 4.5 - crossProg * 2.5, -12 - crossProg * 6);

          striker.group.position.set(-1.0 + crossProg * 1.5, 0, -14 - crossProg * 4);
          striker.group.rotation.y = -Math.PI / 4;
        } else if (cycleTime < 2.5) {
          // Flying volley / diving header in mid-air
          const leapProg = (cycleTime - 2.0) / 0.5;
          striker.group.position.set(0.5, Math.sin(leapProg * Math.PI) * 1.6, -18);
          striker.group.rotation.x = 0.7; // Flying forward

          ball.position.set(0.6, 1.6 - leapProg * 0.4, -18 - leapProg * 3);
        } else {
          // Ball crashes into roof of the net
          const flightProgress = (cycleTime - 2.5) / 2.3;
          ball.position.set(
            0.5,
            2.4,
            -21 + flightProgress * (-pitchLength / 2 + 0.2 - (-21))
          );
          goalkeeper.group.position.y = Math.sin(flightProgress * Math.PI) * 1.2;
        }
      }
      // ==========================================
      // 4. NEYMAR FLAIR VS SERGIO RAMOS TACKLE
      // ==========================================
      else {
        if (cycleTime < 2.2) {
          // Neymar rainbow flick / elastico stepover
          const dribbleProg = cycleTime / 2.2;
          striker.group.position.set(Math.sin(cycleTime * 8) * 1.5, 0, 5 - dribbleProg * 12);
          ball.position.set(striker.group.position.x, 0.22, striker.group.position.z - 0.7);

          // Ramos tracking back
          defender.group.position.set(0.5, 0, -7 + dribbleProg * 2);
        } else if (cycleTime < 3.2) {
          // Ramos signature crunching slide tackle
          const tackleProg = (cycleTime - 2.2) / 1.0;
          defender.group.position.set(0.5 - tackleProg * 1.2, 0.2, -5 - tackleProg * 2);
          defender.group.rotation.z = Math.PI / 2.2; // sliding on ground
          defender.rightLeg.rotation.x = 1.4; // extended lead leg

          // Ball blocked / deflected away
          ball.position.set(
            defender.group.position.x - tackleProg * 6,
            0.3,
            defender.group.position.z + tackleProg * 4
          );
        }
      }

      // Camera drift
      if (cameraView === 'broadcast') {
        camera.position.x = Math.sin(animClock * 0.15) * 5;
        camera.lookAt(0, 2, -6);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

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
  }, [theme, currentPlay, cameraView]);

  const plays: { id: FootballPlay; label: string; player: string; detail: string }[] = [
    {
      id: 'messi_curl',
      label: 'Messi Magic Dribble & Curl',
      player: 'Lionel Messi #10',
      detail: 'Left-foot top corner curler',
    },
    {
      id: 'ronaldo_rocket',
      label: 'CR7 Knuckleball Rocket',
      player: 'Cristiano Ronaldo #7',
      detail: 'Explosive drive & Siuuu jump',
    },
    {
      id: 'chhetri_volley',
      label: 'Sunil Chhetri Clinical Strike',
      player: 'Sunil Chhetri #11',
      detail: 'Flying box volley past keeper',
    },
    {
      id: 'neymar_vs_ramos',
      label: 'Neymar Flair vs Ramos Slide',
      player: 'Neymar Jr #10 vs Sergio Ramos #4',
      detail: 'Brazilian flair vs legendary tackle',
    },
  ];

  const activePlayInfo = plays.find((p) => p.id === currentPlay) || plays[0];

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
          {/* Active 3D Play Tag */}
          <div className="pointer-events-auto p-3 rounded-2xl bg-zinc-900/80 dark:bg-black/75 backdrop-blur-md border border-emerald-500/30 text-white shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-300 text-black flex items-center justify-center font-black text-sm shadow-md">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  3D Match Action
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="text-xs font-bold text-zinc-100">
                {activePlayInfo.player}
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                {activePlayInfo.detail}
              </div>
            </div>
          </div>

          {/* Controls: Play Picker, Camera angle, Play/Pause */}
          <div className="pointer-events-auto flex items-center gap-2 bg-zinc-900/80 dark:bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-700/50 shadow-xl">
            {/* Play Selector */}
            <select
              value={currentPlay}
              onChange={(e) => {
                const play = e.target.value as FootballPlay;
                setCurrentPlay(play);
                onPlayChange?.(play);
              }}
              className="bg-zinc-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-zinc-700 outline-none hover:border-emerald-400 transition cursor-pointer"
            >
              {plays.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Camera Angle Selector */}
            <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded-xl text-[11px] font-bold text-zinc-300">
              <button
                onClick={() => setCameraView('broadcast')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'broadcast' ? 'bg-emerald-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Broadcast
              </button>
              <button
                onClick={() => setCameraView('striker')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'striker' ? 'bg-emerald-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Striker
              </button>
              <button
                onClick={() => setCameraView('goalline')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'goalline' ? 'bg-emerald-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Goal-Line
              </button>
              <button
                onClick={() => setCameraView('drone')}
                className={`px-2 py-1 rounded-lg transition ${
                  cameraView === 'drone' ? 'bg-emerald-500 text-black font-black' : 'hover:text-white'
                }`}
              >
                Drone
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
