import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Trophy,
  Shield,
  Zap,
  Target,
  Flame,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Users,
  Award,
  Radio,
  Clock,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Gamepad2,
  Flag,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Real World Rosters
export const CRICKET_ROSTERS: Record<string, { country: string; flag: string; players: string[] }> = {
  india: {
    country: 'India',
    flag: '🇮🇳',
    players: ['Rohit Sharma (C)', 'Virat Kohli', 'Shubman Gill', 'Suryakumar Yadav', 'KL Rahul (WK)', 'Hardik Pandya', 'Ravindra Jadeja', 'Jasprit Bumrah', 'Kuldeep Yadav', 'Mohammed Siraj', 'Mohammed Shami'],
  },
  australia: {
    country: 'Australia',
    flag: '🇦🇺',
    players: ['Pat Cummins (C)', 'Travis Head', 'David Warner', 'Mitchell Marsh', 'Steve Smith', 'Glenn Maxwell', 'Alex Carey (WK)', 'Mitchell Starc', 'Adam Zampa', 'Josh Hazlewood', 'Marcus Stoinis'],
  },
  bangladesh: {
    country: 'Bangladesh',
    flag: '🇧🇩',
    players: ['Najmul Hossain Shanto (C)', 'Litton Das (WK)', 'Shakib Al Hasan', 'Towhid Hridoy', 'Mahmudullah', 'Taskin Ahmed', 'Mustafizur Rahman', 'Shoriful Islam', 'Rishad Hossain', 'Tanzid Hasan', 'Mehidy Hasan Miraz'],
  },
  pakistan: {
    country: 'Pakistan',
    flag: '🇵🇰',
    players: ['Babar Azam (C)', 'Mohammad Rizwan (WK)', 'Fakhar Zaman', 'Saim Ayub', 'Iftikhar Ahmed', 'Shadab Khan', 'Shaheen Afridi', 'Naseem Shah', 'Haris Rauf', 'Imad Wasim', 'Mohammad Amir'],
  },
  japan: {
    country: 'Japan (ICC Associate)',
    flag: '🇯🇵',
    players: ['Kendel Kadowaki-Fleming (C)', 'Lachlan Yamamoto-Lake', 'Ibrahim Takahashi', 'Wataru Miyauchi (WK)', 'Sabaorish Ravichandran', 'Declan Suzuki', 'Reo Sakurano-Thomas', 'Makoto Taniyama', 'Kohei Kubota', 'Koji Hardgrave-Abe', 'Kazuma Kato-Stafford'],
  },
  nepal: {
    country: 'Nepal (ICC Associate)',
    flag: '🇳🇵',
    players: ['Rohit Paudel (C)', 'Aasif Sheikh (WK)', 'Kushal Bhurtel', 'Kushal Malla', 'Dipendra Singh Airee', 'Sundeep Jora', 'Sompal Kami', 'Karan KC', 'Lalit Rajbanshi', 'Abinash Bohara', 'Gulshan Jha'],
  },
  usa: {
    country: 'United States (ICC Associate)',
    flag: '🇺🇸',
    players: ['Monank Patel (C & WK)', 'Steven Taylor', 'Andries Gous', 'Aaron Jones', 'Corey Anderson', 'Nitish Kumar', 'Harmeet Singh', 'Ali Khan', 'Saurabh Netravalkar', 'Jasdeep Singh', 'Nosthush Kenjige'],
  },
  netherlands: {
    country: 'Netherlands (ICC Associate)',
    flag: '🇳🇱',
    players: ['Scott Edwards (C & WK)', 'Max O\'Dowd', 'Vikramjit Singh', 'Bas de Leede', 'Colin Ackermann', 'Sybrand Engelbrecht', 'Logan van Beek', 'Roelof van der Merwe', 'Paul van Meekeren', 'Aryan Dutt', 'Vivian Kingma'],
  },
};

export const FOOTBALL_TEAMS: Record<string, { country: string; flag: string; players: string[] }> = {
  argentina: {
    country: 'Argentina',
    flag: '🇦🇷',
    players: ['Lionel Messi (C)', 'Emiliano Martinez (GK)', 'Julian Alvarez', 'Angel Di Maria', 'Rodrigo De Paul', 'Alexis Mac Allister', 'Enzo Fernandez', 'Cristian Romero', 'Nicolas Otamendi', 'Nahuel Molina', 'Nicolas Tagliafico'],
  },
  france: {
    country: 'France',
    flag: '🇫🇷',
    players: ['Kylian Mbappe (C)', 'Mike Maignan (GK)', 'Antoine Griezmann', 'Ousmane Dembele', 'Aurelien Tchouameni', 'Eduardo Camavinga', 'Theo Hernandez', 'William Saliba', 'Dayot Upamecano', 'Jules Kounde', 'Marcus Thuram'],
  },
  brazil: {
    country: 'Brazil',
    flag: '🇧🇷',
    players: ['Vinicius Jr', 'Alisson (GK)', 'Rodrygo', 'Raphinha', 'Bruno Guimaraes', 'Lucas Paqueta', 'Casemiro', 'Marquinhos', 'Gabriel Magalhaes', 'Danilo', 'Endrick'],
  },
  india: {
    country: 'India',
    flag: '🇮🇳',
    players: ['Sunil Chhetri (C)', 'Gurpreet Singh Sandhu (GK)', 'Sandesh Jhingan', 'Anirudh Thapa', 'Sahal Abdul Samad', 'Lallianzuala Chhangte', 'Subhasish Bose', 'Nikhil Poojary', 'Jeakson Singh', 'Manvir Singh', 'Mahesh Singh'],
  },
  england: {
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    players: ['Harry Kane (C)', 'Jordan Pickford (GK)', 'Jude Bellingham', 'Phil Foden', 'Bukayo Saka', 'Declan Rice', 'Kobbie Mainoo', 'Kyle Walker', 'John Stones', 'Marc Guehi', 'Kieran Trippier'],
  },
  japan: {
    country: 'Japan',
    flag: '🇯🇵',
    players: ['Wataru Endo (C)', 'Zion Suzuki (GK)', 'Takefusa Kubo', 'Kaoru Mitoma', 'Takumi Minamino', 'Ritsu Doan', 'Hidemasa Morita', 'Takehiro Tomiyasu', 'Ko Itakura', 'Yukinari Sugawara', 'Hiroki Ito'],
  },
};

export const GameArena: React.FC = () => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<'umpire' | 'cricket_game' | 'football_game'>('umpire');

  // ==========================================
  // SECTION 1: UMPIRE CONTROL CENTER STATE
  // ==========================================
  const [umpireTeamA, setUmpireTeamA] = useState('India');
  const [umpireTeamB, setUmpireTeamB] = useState('Australia');
  const [umpireScoreA, setUmpireScoreA] = useState(168);
  const [umpireWicketsA, setUmpireWicketsA] = useState(3);
  const [umpireOvers, setUmpireOvers] = useState(17);
  const [umpireBalls, setUmpireBalls] = useState(4);
  const [umpireMaxOvers, setUmpireMaxOvers] = useState(20);
  const [umpireTarget, setUmpireTarget] = useState(185);

  // Umpire Controls
  const [powerplayActive, setPowerplayActive] = useState(true);
  const [powerplayType, setPowerplayType] = useState<'mandatory' | 'batting' | 'bowling' | 'last_over'>('mandatory');
  const [bounceWarningCount, setBounceWarningCount] = useState<number>(0);
  const [lastUmpireSignal, setLastUmpireSignal] = useState<string>('PLAY BALL');
  const [penaltyRunsCount, setPenaltyRunsCount] = useState<number>(0);

  // ==========================================
  // SECTION 2: PLAYABLE CRICKET 3D STATE
  // ==========================================
  const cricketCanvasRef = useRef<HTMLDivElement>(null);
  const [cricketTeamAKey, setCricketTeamAKey] = useState('india');
  const [cricketTeamBKey, setCricketTeamBKey] = useState('australia');
  const [cricketMode, setCricketMode] = useState<'series' | 'world_cup'>('series');
  const [seriesLength, setSeriesLength] = useState<3 | 5 | 7>(3);
  const [cricketOversConfig, setCricketOversConfig] = useState<number>(5);
  const [cricketRuns, setCricketRuns] = useState(0);
  const [cricketWickets, setCricketWickets] = useState(0);
  const [cricketBallCount, setCricketBallCount] = useState(0);
  const [cricketLastShot, setCricketLastShot] = useState<string>('Ready for Delivery');
  const [cricketTimingMsg, setCricketTimingMsg] = useState<string>('Tap stroke button on delivery');

  // ==========================================
  // SECTION 3: PLAYABLE FOOTBALL 3D STATE
  // ==========================================
  const footballCanvasRef = useRef<HTMLDivElement>(null);
  const [fbTeamAKey, setFbTeamAKey] = useState('argentina');
  const [fbTeamBKey, setFbTeamBKey] = useState('france');
  const [fbMode, setFbMode] = useState<'friendly' | 'world_cup'>('world_cup');
  const [fbDurationMins, setFbDurationMins] = useState(5);
  const [fbGoalsA, setFbGoalsA] = useState(0);
  const [fbGoalsB, setFbGoalsB] = useState(0);
  const [fbMinute, setFbMinute] = useState(1);
  const [fbLastAction, setFbLastAction] = useState('Kickoff! Game underway');

  // Three.js instances refs
  const cricketSceneRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; ball: THREE.Mesh; bat: THREE.Mesh; stumps: THREE.Group } | null>(null);
  const footballSceneRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; ball: THREE.Mesh; playerA: THREE.Mesh; playerB: THREE.Mesh } | null>(null);

  // =========================================================
  // Playable Cricket Three.js Engine Init & Animation Loop
  // =========================================================
  useEffect(() => {
    if (activeSection !== 'cricket_game') return;
    const container = cricketCanvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? 0x0a101d : 0x87ceeb);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Pitch Ground
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1b4d20 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Pitch Strip (22 yards)
    const pitchGeo = new THREE.PlaneGeometry(3.6, 22);
    const pitchMat = new THREE.MeshLambertMaterial({ color: 0xd4b483 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.02;
    scene.add(pitch);

    // Stumps (Batting End)
    const stumpsGroup = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      const stumpGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
      const stumpMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const stump = new THREE.Mesh(stumpGeo, stumpMat);
      stump.position.set(i * 0.18, 0.55, 9.8);
      stumpsGroup.add(stump);
    }
    // Bails
    const bailGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
    const bailMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const bail = new THREE.Mesh(bailGeo, bailMat);
    bail.rotation.z = Math.PI / 2;
    bail.position.set(0, 1.12, 9.8);
    stumpsGroup.add(bail);
    scene.add(stumpsGroup);

    // Bat
    const batGeo = new THREE.BoxGeometry(0.18, 1.0, 0.06);
    const batMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const bat = new THREE.Mesh(batGeo, batMat);
    bat.position.set(0.4, 0.7, 9.4);
    scene.add(bat);

    // Cricket Ball
    const ballGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 1.6, -9);
    scene.add(ball);

    cricketSceneRef.current = { scene, camera, renderer, ball, bat, stumps: stumpsGroup };

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [activeSection, theme]);

  // Execute Cricket Bat Stroke
  const playCricketShot = (shotType: 'drive' | 'pull' | 'loft' | 'defend') => {
    if (!cricketSceneRef.current) return;
    const { ball, bat, stumps } = cricketSceneRef.current;

    // Animate ball delivery toward batter
    ball.position.set(0, 1.6, -9);
    const duration = 1200;
    const startTime = Date.now();

    const ballInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      ball.position.z = -9 + progress * 18.5;
      ball.position.y = 1.6 - Math.sin(progress * Math.PI) * 0.8 + (progress > 0.6 ? 0.3 : 0);

      // Swing bat near impact
      if (progress > 0.75) {
        bat.rotation.x = -Math.PI / 4;
        bat.rotation.y = shotType === 'pull' ? -Math.PI / 3 : Math.PI / 4;
      }

      if (progress >= 1) {
        clearInterval(ballInterval);
        bat.rotation.set(0, 0, 0);

        // Determine outcome
        const luck = Math.random();
        let runsScored = 0;
        let shotText = '';

        if (shotType === 'loft') {
          if (luck > 0.45) {
            runsScored = 6;
            shotText = 'MASSIVE SIX! Cleared over the boundary ropes!';
            ball.position.set(Math.random() * 8 - 4, 12, 28);
          } else if (luck > 0.15) {
            runsScored = 4;
            shotText = 'ONE BOUNCE FOUR! Struck hard through extra cover!';
            ball.position.set(12, 0.2, 22);
          } else {
            setCricketWickets((w) => w + 1);
            shotText = 'OUT! Caught at deep mid-wicket boundary!';
            ball.position.set(0, 0.5, 20);
          }
        } else if (shotType === 'drive') {
          if (luck > 0.3) {
            runsScored = 4;
            shotText = 'CRACKING COVER DRIVE! Pierces the gap for FOUR!';
            ball.position.set(10, 0.1, 16);
          } else {
            runsScored = 2;
            shotText = 'Firm push through mid-off, quick running for 2!';
          }
        } else if (shotType === 'pull') {
          if (luck > 0.4) {
            runsScored = 4;
            shotText = 'POWERFUL PULL SHOT! Dispatched behind square leg!';
          } else if (luck > 0.2) {
            runsScored = 1;
            shotText = 'Controlled pull to deep backward square, 1 run.';
          } else {
            setCricketWickets((w) => w + 1);
            shotText = 'OUT! Top edge caught comfortably by the wicketkeeper!';
          }
        } else {
          // Defend
          runsScored = 0;
          shotText = 'Defended with soft hands right back down the pitch. Dot ball.';
          ball.position.set(0, 0.1, 8.5);
        }

        setCricketRuns((r) => r + runsScored);
        setCricketBallCount((b) => b + 1);
        setCricketLastShot(shotText);
        setCricketTimingMsg(runsScored >= 4 ? '🔥 PERFECT SWEET SPOT TIMING' : 'GOOD SOLID CONTACT');
      }
    }, 16);
  };

  // =========================================================
  // Playable Football Three.js Engine Init & Animation Loop
  // =========================================================
  useEffect(() => {
    if (activeSection !== 'football_game') return;
    const container = footballCanvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? 0x050c18 : 0x64b5f6);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 10, 22);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 30, 20);
    scene.add(sun);

    // Pitch Ground
    const pitchGeo = new THREE.PlaneGeometry(40, 28);
    const pitchMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);

    // Goal Post (Far End)
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2), postMat);
    leftPost.position.set(-3.5, 1.6, -13.5);
    scene.add(leftPost);

    const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2), postMat);
    rightPost.position.set(3.5, 1.6, -13.5);
    scene.add(rightPost);

    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7.2), postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 3.2, -13.5);
    scene.add(crossbar);

    // Football Ball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    ball.position.set(0, 0.28, 2);
    scene.add(ball);

    // Active Player (Striker)
    const playerA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x10b981 })
    );
    playerA.position.set(0, 0.9, 3.5);
    scene.add(playerA);

    // Opponent Goalkeeper
    const playerB = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    playerB.position.set(0, 0.9, -12.5);
    scene.add(playerB);

    footballSceneRef.current = { scene, camera, renderer, ball, playerA, playerB };

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      // Small idle keeper hover
      if (playerB) {
        playerB.position.x = Math.sin(Date.now() * 0.003) * 1.5;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [activeSection, theme]);

  // Execute Football Shoot Action
  const playFootballAction = (action: 'shoot' | 'pass' | 'tackle') => {
    if (!footballSceneRef.current) return;
    const { ball, playerB } = footballSceneRef.current;

    if (action === 'shoot') {
      const luck = Math.random();
      const targetX = (Math.random() - 0.5) * 5;
      const targetY = 0.5 + Math.random() * 2.2;

      // Animate ball to goal
      let step = 0;
      const shotInterval = setInterval(() => {
        step += 0.05;
        ball.position.z = 2 - step * 15;
        ball.position.x += (targetX - ball.position.x) * 0.1;
        ball.position.y = 0.28 + Math.sin(step * Math.PI) * 2;

        if (step >= 1) {
          clearInterval(shotInterval);
          if (luck > 0.35) {
            setFbGoalsA((g) => g + 1);
            setFbLastAction(`GOAL! Thunderous strike into the corner by ${FOOTBALL_TEAMS[fbTeamAKey]?.players[0]}!`);
          } else {
            setFbLastAction('DIVING SAVE! Goalkeeper parries away with acrobatic stop!');
          }
          setTimeout(() => ball.position.set(0, 0.28, 2), 1200);
        }
      }, 20);
    } else if (action === 'pass') {
      ball.position.x += (Math.random() - 0.5) * 4;
      setFbLastAction('Precision ground pass into space, attack advancing!');
    } else {
      setFbLastAction('CRUNCHING TACKLE! Regains possession cleanly!');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Game Arena Header Navigation */}
      <div className="p-6 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              ASCEND Interactive Game Arena
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase text-white mt-1">
            Umpire Center & 3D Playable Games
          </h2>
          <p className="text-xs text-zinc-400">
            Switch between professional Umpire Ground Tracking, Playable Cricket Engine (Real Rosters), and 3D Football Engine.
          </p>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveSection('umpire')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
              activeSection === 'umpire'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>1. Umpire Center</span>
          </button>

          <button
            onClick={() => setActiveSection('cricket_game')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
              activeSection === 'cricket_game'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🏏</span>
            <span>2. Play Cricket 3D</span>
          </button>

          <button
            onClick={() => setActiveSection('football_game')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
              activeSection === 'football_game'
                ? 'bg-cyan-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>⚽</span>
            <span>3. Play Football 3D</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: UMPIRE CONTROL CENTER (PART 1) */}
      {/* ==================================================================== */}
      {activeSection === 'umpire' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Umpire Scoreboard & Run Rate Banner */}
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-emerald-400" /> Match Official Live Ground Tracking
              </div>
              <div className="flex items-baseline gap-4 mt-1">
                <h3 className="text-4xl font-mono font-black text-emerald-400">
                  {umpireScoreA}/{umpireWicketsA}
                </h3>
                <span className="text-sm font-mono text-zinc-400">
                  ({umpireOvers}.{umpireBalls} / {umpireMaxOvers} ov)
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-mono text-cyan-400">
                  CRR: {((umpireScoreA) / Math.max(1, umpireOvers + umpireBalls / 6)).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Target: <strong className="text-white">{umpireTarget}</strong> • Need{' '}
                <strong className="text-amber-400">{Math.max(0, umpireTarget - umpireScoreA)} runs</strong> in{' '}
                <strong className="text-amber-400">
                  {Math.max(0, (umpireMaxOvers * 6) - (umpireOvers * 6 + umpireBalls))} balls
                </strong>
              </div>
            </div>

            {/* Signal Display Badge */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center min-w-[200px]">
              <div className="text-[10px] font-bold text-zinc-500 uppercase">Active Umpire Signal</div>
              <div className="text-base font-black text-emerald-400 uppercase mt-0.5 animate-pulse">
                {lastUmpireSignal}
              </div>
            </div>
          </div>

          {/* Ball-by-Ball Attributes & Warnings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fast Bounce & Delivery Attributes */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-black uppercase text-amber-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Fast Bounce & Short-Pitch Warnings
                </span>
                <span className="text-[10px] text-zinc-400">Law 41.6</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Bouncers Logged This Over:
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {bounceWarningCount === 0
                      ? 'No warnings issued'
                      : bounceWarningCount === 1
                      ? 'First Bouncer Warning (1 of 2 max allowed)'
                      : 'Penalty/No-Ball Threshold Exceeded!'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const next = (bounceWarningCount + 1) % 3;
                      setBounceWarningCount(next);
                      setLastUmpireSignal(next === 1 ? '1st Bounce Warning' : next === 2 ? 'NO BALL (2nd Bouncer)' : 'Warnings Reset');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase"
                  >
                    + Log Bouncer ({bounceWarningCount}/2)
                  </button>
                </div>
              </div>

              {/* Byes, Overthrow & Penalty Runs (+5) */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => {
                    setUmpireScoreA((s) => s + 1);
                    setLastUmpireSignal('BYE RUN (✋)');
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 font-bold"
                >
                  Bye Run (+1)
                </button>
                <button
                  onClick={() => {
                    setUmpireScoreA((s) => s + 1);
                    setLastUmpireSignal('LEG BYE (🦵)');
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 font-bold"
                >
                  Leg Bye (+1)
                </button>
                <button
                  onClick={() => {
                    setUmpireScoreA((s) => s + 2);
                    setLastUmpireSignal('OVERTHROW RUNS (+2)');
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 font-bold"
                >
                  Overthrow (+2)
                </button>
              </div>

              <button
                onClick={() => {
                  setUmpireScoreA((s) => s + 5);
                  setPenaltyRunsCount((p) => p + 5);
                  setLastUmpireSignal('⚠️ +5 PENALTY RUNS AWARDED');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase transition shadow-md"
              >
                Award +5 Penalty Runs (Ball hits helmet / Unfair play)
              </button>
            </div>

            {/* Powerplay Management */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-black uppercase text-emerald-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Powerplay Management
                </span>
                <span className="text-[10px] font-bold text-zinc-400">
                  {powerplayActive ? '⚡ Status: ACTIVE' : 'Status: OFF'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => {
                    setPowerplayActive(!powerplayActive);
                    setLastUmpireSignal(powerplayActive ? 'Powerplay Concluded' : 'Powerplay Initiated');
                  }}
                  className={`p-3 rounded-xl uppercase transition ${
                    powerplayActive
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  Powerplay Toggle: {powerplayActive ? 'ON' : 'OFF'}
                </button>

                <select
                  value={powerplayType}
                  onChange={(e) => {
                    setPowerplayType(e.target.value as any);
                    setLastUmpireSignal(`Powerplay: ${e.target.value.toUpperCase()}`);
                  }}
                  className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold"
                >
                  <option value="mandatory">Mandatory P1 (Overs 1-6)</option>
                  <option value="batting">Batting Powerplay P2</option>
                  <option value="bowling">Bowling Powerplay</option>
                  <option value="last_over">Last-Over Powerplay</option>
                </select>
              </div>

              {/* Match Signals Interactive Grid */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2">
                  Official Match Signal Buttons:
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  <button
                    onClick={() => setLastUmpireSignal('☝️ OUT (Index Finger Raised)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white transition"
                  >
                    ☝️ Out
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('🙌 SIX (Both Arms Raised)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 transition"
                  >
                    🙌 Six
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('⚡ FOUR (Arm Swept Across)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 transition"
                  >
                    ⚡ Four
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('⚑ NO BALL (Arm Extended Horizontally)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-500 hover:text-white transition"
                  >
                    ⚑ No Ball
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('↔ WIDE (Both Arms Outstretched)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-500 hover:text-white transition"
                  >
                    ↔ Wide
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('✕ DEAD BALL (Wrists Crossed)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
                  >
                    ✕ Dead Ball
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('🦵 LEG BYE (Knee Touched)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
                  >
                    🦵 Leg Bye
                  </button>
                  <button
                    onClick={() => setLastUmpireSignal('✋ FREE HIT (Arm Circled Above Head)')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-400 hover:text-zinc-950 transition"
                  >
                    ✋ Free Hit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: PLAYABLE CRICKET GAME ENGINE (PART 2) */}
      {/* ==================================================================== */}
      {activeSection === 'cricket_game' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Tournament & Series Config Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Team Selection */}
            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Batting Team:</span>
                <select
                  value={cricketTeamAKey}
                  onChange={(e) => setCricketTeamAKey(e.target.value)}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  {Object.entries(CRICKET_ROSTERS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.flag} {v.country}
                    </option>
                  ))}
                </select>
              </div>

              <span className="font-black text-zinc-400">VS</span>

              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Bowling Team:</span>
                <select
                  value={cricketTeamBKey}
                  onChange={(e) => setCricketTeamBKey(e.target.value)}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  {Object.entries(CRICKET_ROSTERS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.flag} {v.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode & Overs */}
            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Tournament Mode:</span>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold">
                  <button
                    onClick={() => setCricketMode('series')}
                    className={`px-2.5 py-1 rounded-md ${
                      cricketMode === 'series' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    Series ({seriesLength}-Match)
                  </button>
                  <button
                    onClick={() => setCricketMode('world_cup')}
                    className={`px-2.5 py-1 rounded-md ${
                      cricketMode === 'world_cup' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    World Cup
                  </button>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Match Length:</span>
                <select
                  value={cricketOversConfig}
                  onChange={(e) => setCricketOversConfig(parseInt(e.target.value))}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  <option value={3}>3 Overs (Super Short)</option>
                  <option value={5}>5 Overs (Fast Action)</option>
                  <option value={10}>10 Overs (T10)</option>
                  <option value={20}>20 Overs (T20)</option>
                  <option value={30}>30 Overs</option>
                  <option value={50}>50 Overs (ODI)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Three.js Interactive 3D Stadium Canvas */}
          <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
            <div ref={cricketCanvasRef} className="w-full h-[400px]" />

            {/* Live In-Game Overlay */}
            <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-white font-mono shadow-xl">
              <div className="text-[10px] text-amber-400 font-sans font-bold uppercase">
                {CRICKET_ROSTERS[cricketTeamAKey]?.flag} {CRICKET_ROSTERS[cricketTeamAKey]?.country}
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {cricketRuns} / {cricketWickets}
              </div>
              <div className="text-xs text-zinc-400 font-sans">
                Overs: {Math.floor(cricketBallCount / 6)}.{cricketBallCount % 6} / {cricketOversConfig}
              </div>
            </div>

            {/* Commentary Callout */}
            <div className="absolute top-4 right-4 z-10 p-3 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-right text-white max-w-xs shadow-xl">
              <div className="text-[10px] font-sans font-bold text-emerald-400 uppercase flex items-center justify-end gap-1">
                <Sparkles className="w-3 h-3" /> {cricketTimingMsg}
              </div>
              <div className="text-xs font-bold text-zinc-200 mt-1 line-clamp-2">
                "{cricketLastShot}"
              </div>
            </div>

            {/* Interactive Bat Stroke Controls Toolbar */}
            <div className="absolute bottom-4 inset-x-4 z-10 p-3 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 flex flex-wrap items-center justify-between gap-2 shadow-2xl">
              <div className="text-xs font-sans text-zinc-300 font-bold hidden sm:block">
                ⚡ Select Batting Stroke:
              </div>

              <div className="grid grid-cols-4 gap-2 flex-1 max-w-xl">
                <button
                  onClick={() => playCricketShot('loft')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 cursor-pointer"
                >
                  🚀 Lofted Six
                </button>
                <button
                  onClick={() => playCricketShot('drive')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 cursor-pointer"
                >
                  ⚡ Cover Drive
                </button>
                <button
                  onClick={() => playCricketShot('pull')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 cursor-pointer"
                >
                  🏏 Pull Shot
                </button>
                <button
                  onClick={() => playCricketShot('defend')}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  🛡️ Defend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: PLAYABLE FOOTBALL GAME ENGINE (PART 3) */}
      {/* ==================================================================== */}
      {activeSection === 'football_game' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Football Team & Match Config Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Home Team:</span>
                <select
                  value={fbTeamAKey}
                  onChange={(e) => setFbTeamAKey(e.target.value)}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  {Object.entries(FOOTBALL_TEAMS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.flag} {v.country}
                    </option>
                  ))}
                </select>
              </div>

              <span className="font-black text-zinc-400">VS</span>

              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Away Team:</span>
                <select
                  value={fbTeamBKey}
                  onChange={(e) => setFbTeamBKey(e.target.value)}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  {Object.entries(FOOTBALL_TEAMS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.flag} {v.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Tournament Format:</span>
                <select
                  value={fbMode}
                  onChange={(e) => setFbMode(e.target.value as any)}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  <option value="world_cup">World Cup Campaign Mode</option>
                  <option value="friendly">Friendly International Match</option>
                </select>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block font-bold">Duration:</span>
                <select
                  value={fbDurationMins}
                  onChange={(e) => setFbDurationMins(parseInt(e.target.value))}
                  className="font-bold bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                >
                  <option value={3}>3 Minutes (Fast Blitz)</option>
                  <option value={5}>5 Minutes (Standard)</option>
                  <option value={10}>10 Minutes (Full Match)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Three.js Interactive 3D Football Stadium Canvas */}
          <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
            <div ref={footballCanvasRef} className="w-full h-[400px]" />

            {/* Scoreboard Overlay */}
            <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-white font-mono shadow-xl flex items-center gap-4">
              <div>
                <div className="text-[10px] text-zinc-400 font-sans font-bold">
                  {FOOTBALL_TEAMS[fbTeamAKey]?.flag} {FOOTBALL_TEAMS[fbTeamAKey]?.country}
                </div>
                <div className="text-2xl font-black text-emerald-400">{fbGoalsA}</div>
              </div>
              <div className="text-zinc-500 font-sans font-bold">VS</div>
              <div>
                <div className="text-[10px] text-zinc-400 font-sans font-bold">
                  {FOOTBALL_TEAMS[fbTeamBKey]?.flag} {FOOTBALL_TEAMS[fbTeamBKey]?.country}
                </div>
                <div className="text-2xl font-black text-amber-400">{fbGoalsB}</div>
              </div>
            </div>

            {/* Live Play Action Feed */}
            <div className="absolute top-4 right-4 z-10 p-3 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-right text-white max-w-xs shadow-xl">
              <div className="text-[10px] font-sans font-bold text-emerald-400 uppercase">
                Match Telemetry
              </div>
              <div className="text-xs font-bold text-zinc-200 mt-1">
                {fbLastAction}
              </div>
            </div>

            {/* Interactive Football Controls */}
            <div className="absolute bottom-4 inset-x-4 z-10 p-3 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 flex flex-wrap items-center justify-between gap-2 shadow-2xl">
              <div className="text-xs font-sans text-zinc-300 font-bold hidden sm:block">
                ⚽ Direct Play Actions:
              </div>

              <div className="grid grid-cols-3 gap-2 flex-1 max-w-md">
                <button
                  onClick={() => playFootballAction('shoot')}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 cursor-pointer"
                >
                  🚀 Strike Goal
                </button>
                <button
                  onClick={() => playFootballAction('pass')}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  👟 Through Pass
                </button>
                <button
                  onClick={() => playFootballAction('tackle')}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  🛡️ Slide Tackle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
