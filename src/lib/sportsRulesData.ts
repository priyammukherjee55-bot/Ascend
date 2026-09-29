export interface SportRuleEntry {
  id: string;
  name: string;
  aliases: string[];
  governingBody: string;
  category: 'team' | 'racquet' | 'combat' | 'equestrian' | 'target' | 'individual';
  icon: string;
  shortOverview: string;
  courtDimensions: string;
  teamSize: string;
  gameDuration: string;
  scoringSystem: string;
  coreRules: {
    title: string;
    description: string;
  }[];
  foulsAndPenalties: string[];
  refereeSignals: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const SPORTS_RULES_DATABASE: Record<string, SportRuleEntry> = {
  cricket: {
    id: 'cricket',
    name: 'Cricket',
    aliases: ['cricket', 'icc', 'batting', 'bowling', 't20', 'odi', 'test'],
    governingBody: 'International Cricket Council (ICC) / Marylebone Cricket Club (MCC)',
    category: 'team',
    icon: '🏏',
    shortOverview: 'A bat-and-ball game played between two teams of 11 players on a field with a 22-yard pitch. The batting team scores runs while the bowling and fielding team dismisses batters and restricts runs.',
    courtDimensions: 'Pitch length: 22 yards (20.12 m) between wickets. Bowling crease width: 8 ft 8 in (2.64 m). Popping crease: 4 ft (1.22 m) in front of bowling crease. Boundary radius: 65–85 meters from center.',
    teamSize: '11 players per side on the field (plus 12th man / concussion substitutes).',
    gameDuration: 'T20: 20 overs per side (~3.5 hours). ODI: 50 overs per side (~8 hours). Test Match: 5 days, 90 overs/day.',
    scoringSystem: 'Runs scored by batters running between wickets or hitting boundaries (4 runs along ground, 6 runs over boundary on full). Extras: Wides, No-Balls, Byes, Leg-Byes (1 or more runs).',
    coreRules: [
      {
        title: 'Law 36 - Leg Before Wicket (LBW)',
        description: 'To be given out LBW: 1) The ball must not be a No-Ball. 2) The ball must pitch in line with stumps or outside the off stump (cannot pitch outside leg). 3) The ball must strike the batter without touching the bat or glove. 4) The impact must be in line with stumps (unless no shot offered, in which case impact outside off is valid). 5) The ball would have gone on to hit the wickets.',
      },
      {
        title: 'Law 21 - No-Ball & Free Hit',
        description: 'Called if the bowler front foot lands entirely over the popping crease, back foot touches return crease, bowls a waist-high full toss (above waist when upright), or fields more than allowed fielders on leg-side (max 2 behind square leg). Awards 1 penalty run + mandatory Free Hit on next legal delivery in T20 & ODI cricket.',
      },
      {
        title: 'Law 22 - Wide Ball',
        description: 'Called when the ball passes outside the batter reaches and cannot be hit with a normal cricket stroke. Awards 1 penalty run and the delivery must be re-bowled.',
      },
      {
        title: 'Powerplay Field Restrictions',
        description: 'In ODI: Mandatory P1 (Overs 1-10, max 2 fielders outside 30-yd circle), P2 (Overs 11-40, max 4 fielders outside), P3 (Overs 41-50, max 5 fielders outside). In T20: Overs 1-6 mandatory powerplay with max 2 fielders outside the ring; overs 7-20 allow max 5 outside.',
      },
      {
        title: '10 Methods of Dismissal',
        description: 'Bowled, Caught, Leg Before Wicket (LBW), Run Out, Stumped, Hit Wicket, Obstructing the Field, Hit the Ball Twice, Timed Out (must face delivery within 2 mins of previous dismissal in T20, 3 mins in ODI/Test), and Mankad (run out at non-striker end before bowler releases ball under Law 38.3).',
      },
      {
        title: 'Duckworth-Lewis-Stern (DLS) Method',
        description: 'Mathematical formulation used in rain-interrupted limited overs matches to revise target scores based on balls remaining and wickets lost (resources left).',
      },
    ],
    foulsAndPenalties: [
      '5-run penalty for ball hitting fielder helmet lying on the ground behind keeper.',
      'Ball tampering penalty: 5 penalty runs to batting side + replacement of ball + disciplinary report.',
      'Dangerous and unfair short-pitched bowling: Warning followed by removal of bowler for the innings.',
      'Deliberate short run: Umpire disallows run and awards 5 penalty runs to fielding team.',
    ],
    refereeSignals: [
      'Out: One index finger raised vertically.',
      'Six: Both arms raised straight up above the head.',
      'Four: Hand waved side to side across the chest.',
      'No-Ball: One arm held horizontally to the side.',
      'Wide: Both arms held horizontally out to the sides.',
      'Dead Ball: Crossing and uncrossing wrists below waist level.',
      'Leg Bye: One knee raised and touched with hand.',
    ],
    faqs: [
      {
        question: 'Can a batter be given out LBW if the ball pitches outside the leg stump?',
        answer: 'No! According to Law 36, if the ball pitches outside the leg stump line, the batter can NEVER be given out LBW, regardless of whether it would have hit the stumps.',
      },
      {
        question: 'What happens during a Free Hit in white ball cricket?',
        answer: 'The batter cannot be dismissed by bowler modes (bowled, caught, LBW, stumped). The batter can only be dismissed by Run Out, Obstructing the Field, or Hitting the Ball Twice.',
      },
    ],
  },

  football: {
    id: 'football',
    name: 'Football (Soccer)',
    aliases: ['football', 'soccer', 'fifa', 'goal', 'penalty', 'offside', 'var'],
    governingBody: 'Fédération Internationale de Football Association (FIFA) / IFAB',
    category: 'team',
    icon: '⚽',
    shortOverview: 'Played by two teams of 11 players using any part of their bodies except their hands and arms (goalkeepers excepted in penalty box) to propel a ball into the opponent goal.',
    courtDimensions: 'Field Length: 100–110 meters (110–120 yds). Width: 64–75 meters (70–80 yds). Goal size: 7.32m wide x 2.44m high (8 ft x 8 yds). Penalty spot: 11 meters (12 yds) from goal line. Penalty area: 16.5m (18 yds).',
    teamSize: '11 players on the pitch per side (including 1 goalkeeper). Up to 5 substitutions in 3 windows.',
    gameDuration: '90 minutes (two 45-minute halves) + stoppage time. Knockout matches add two 15-minute extra time halves + penalty shootout.',
    scoringSystem: 'Each time the whole of the ball passes completely over the goal line between the goalposts and under the crossbar, 1 goal is awarded.',
    coreRules: [
      {
        title: 'Law 11 - The Offside Rule',
        description: 'A player is in an offside position if any part of their head, body, or feet is in the opponents half AND nearer to the opponents goal line than both the ball and the second-last opponent. It is only penalized if at the moment the ball is played, they actively interfere with play, interfere with an opponent, or gain an advantage. You CANNOT be offside directly from a throw-in, corner kick, or goal kick.',
      },
      {
        title: 'Law 12 - Fouls & Misconduct',
        description: 'Direct free kicks are awarded for kicking, tripping, charging, striking, pushing, holding, biting, or deliberate handball. Indirect free kicks are awarded for dangerous play, impeding without contact, or goalkeeper holding ball >6 seconds / handling deliberate back-pass from a teammate foot.',
      },
      {
        title: 'Disciplinary Cards (Yellow & Red)',
        description: 'Yellow card cautions reckless tackles, unsporting behavior, dissent, or time-wasting. Red card sends off player for serious foul play, violent conduct, spitting, abusive language, second yellow card, or denying an obvious goal-scoring opportunity (DOGSO).',
      },
      {
        title: 'Law 14 - Penalty Kick Execution',
        description: 'Awarded for direct free kick foul committed inside defending penalty area. The ball is placed 11m out. All players except kicker and goalkeeper must be outside the box and penalty arc (at least 9.15m away). The goalkeeper must keep at least part of one foot touching or above the goal line until the ball is kicked.',
      },
      {
        title: 'VAR (Video Assistant Referee) Protocol',
        description: 'Reviews only 4 match-changing categories: 1) Goals / no goal incidents (fouls or offside in build-up). 2) Penalty decisions. 3) Direct Red Card incidents. 4) Mistaken identity.',
      },
    ],
    foulsAndPenalties: [
      'DOGSO: Denying Obvious Goal Scoring Opportunity results in a direct red card unless a penalty is awarded and the foul was a genuine attempt to play the ball (Double Jeopardy rule reduces to Yellow).',
      'Handball: Touching the ball when the hand/arm has made the body unnaturally bigger, or scoring directly with arm.',
      'Goalkeeper Back-Pass Rule: Goalkeeper cannot touch ball with hands if deliberately kicked to them by teammate foot.',
    ],
    refereeSignals: [
      'Direct Free Kick: Arm pointed forward horizontally in direction of attack.',
      'Indirect Free Kick: Arm held vertically straight up above head until kick is taken and touches another player.',
      'Penalty Kick: Arm pointed decisively to the penalty spot.',
      'Advantage: Both arms extended forward in sweeping motion.',
      'Corner Kick: Arm pointed toward relevant corner flag.',
      'Yellow/Red Card: Card raised high above head with straight arm.',
    ],
    faqs: [
      {
        question: 'Can a player be offside if they receive the ball directly from a throw-in or corner?',
        answer: 'No! According to FIFA Law 11, there is NO offside offense directly from a throw-in, corner kick, or goal kick.',
      },
      {
        question: 'Can a goalkeeper pick up the ball if a teammate passes it with their chest or head?',
        answer: 'Yes! The back-pass rule only applies if the ball is deliberately kicked to the goalkeeper with the foot or leg. Heading, chesting, or kneeing the ball back is permitted (unless a trick is used to circumvent the rule).',
      },
    ],
  },

  kabaddi: {
    id: 'kabaddi',
    name: 'Kabaddi',
    aliases: ['kabaddi', 'kabadi', 'pkl', 'pro kabaddi', 'raider', 'tackle', 'bonus line'],
    governingBody: 'International Kabaddi Federation (IKF) / Pro Kabaddi League (PKL)',
    category: 'combat',
    icon: '🤼',
    shortOverview: 'An ancient contact sport from India. A "raider" crosses into the opponent half, tag defenders while chanting "Kabaddi", and returns to their half within 30 seconds without being tackled.',
    courtDimensions: 'Men: 13m length x 10m width. Women: 12m x 8m. Baulk line: 3.75m from midline. Bonus line: 4.75m from midline (1m beyond baulk line). Lobby: 1 meter wide yellow corridors on both sidelines.',
    teamSize: '7 active players on the court per side (squad of 10–12 players with 5 rolling substitutions).',
    gameDuration: '40 minutes (two 20-minute halves) with a 5-minute half-time break.',
    scoringSystem: '1 point per touch by raider. 1 point for successful tackle by defenders. 1 bonus point if raider crosses bonus line with trailing foot in air (when 6 or 7 defenders on court). 2 extra points for All-Out.',
    coreRules: [
      {
        title: '30-Second Raid Clock & Canting',
        description: 'Every raid has a strict 30-second countdown clock. The raider must chant the word "Kabaddi" loudly, clearly, and continuously in a single exhalation without pause. Breaking the cant makes the raider OUT.',
      },
      {
        title: 'Baulk Line Crossing Rule',
        description: 'To make an empty raid valid (without touches), the raider must cross the baulk line with at least one foot fully across and no body part touching behind. If a defender is touched, the baulk line condition is automatically satisfied.',
      },
      {
        title: 'Do-or-Die Raid (3rd Empty Raid Rule)',
        description: 'If a team conducts two consecutive empty raids (no points scored), the 3rd raid is designated as a "Do-or-Die Raid". The raider MUST score at least 1 point (touch point or bonus point). If they fail to score, the raider is declared OUT and the defending team gets 1 point.',
      },
      {
        title: 'Super Tackle (2 Points)',
        description: 'When the defending team has 3 or fewer players remaining on the mat and successfully executes a tackle to stop the raider, they are awarded 2 points instead of the standard 1 point.',
      },
      {
        title: 'Lobby Activation Rule',
        description: 'The 1-meter side corridors (lobbies) are out of bounds until contact is made between the raider and any defender. Once a touch occurs, the lobbies become part of the active playing court. Stepping into the lobby before a touch results in the player being declared OUT.',
      },
      {
        title: 'All-Out & Revival Protocol',
        description: 'When all 7 players of a team are eliminated, the opponent earns an "All-Out" bonus of 2 extra points, and all 7 eliminated players immediately revive back onto the mat.',
      },
    ],
    foulsAndPenalties: [
      'Scissors tackle or gripping by clothes/hair: Foul awarded, yellow/green card, point to raider.',
      'Stepping out of bounds without contact: Player is automatically OUT.',
      'Pushing raider out of court aggressively: Technical point awarded to raiding team.',
      'Green Card (Warning), Yellow Card (2-minute suspension), Red Card (disqualification from match).',
    ],
    refereeSignals: [
      'Touch Point: Hand extended towards the scoring team with finger pointing to the mat.',
      'Bonus Point: Thumb pointing upwards with arm bent at the elbow.',
      'Super Tackle: Both arms raised with 2 fingers displayed on both hands.',
      'All-Out: Crossing wrists and spreading arms outward.',
      'Time-Out: Forming a "T" shape with hands.',
    ],
    faqs: [
      {
        question: 'When is a bonus point awarded in Kabaddi?',
        answer: 'A bonus point is awarded when the defending team has 6 or 7 active players on court, and the raider crosses the bonus line with their leading foot planted inside the bonus zone while their trailing foot is completely lifted in the air.',
      },
      {
        question: 'What is a Super Raid in Kabaddi?',
        answer: 'A raid in which the raider scores 3 or more points (e.g., 3 touch points, or 2 touch points + 1 bonus point) in a single 30-second raid.',
      },
    ],
  },

  tennis: {
    id: 'tennis',
    name: 'Tennis',
    aliases: ['tennis', 'tenis', 'itf', 'atp', 'wta', 'deuce', 'grand slam', 'ace'],
    governingBody: 'International Tennis Federation (ITF) / ATP / WTA',
    category: 'racquet',
    icon: '🎾',
    shortOverview: 'A racquet sport played individually against a single opponent (singles) or between two teams of two players each (doubles) across a rectangular court divided by a net.',
    courtDimensions: 'Court length: 78 feet (23.77 m). Singles width: 27 feet (8.23 m). Doubles width: 36 feet (10.97 m). Net height: 3 feet (0.914 m) at center, 3.5 feet (1.07 m) at posts.',
    teamSize: '1 player per side (Singles) or 2 players per side (Doubles).',
    gameDuration: 'Best of 3 sets (~1.5–2.5 hours) or Best of 5 sets in Men Grand Slams (~3–5 hours).',
    scoringSystem: 'Points: 0 (Love), 15, 30, 40, Game. Deuce at 40-40 (requires 2-point lead: Advantage -> Game). Sets won by first to 6 games with 2-game margin. At 6-6, a 7-point tiebreak is played.',
    coreRules: [
      {
        title: 'Service Order & Technique',
        description: 'Server starts from behind the baseline to the right of the center mark and must serve diagonally into the opponent service box. Two serves are allowed per point. Fault occurs if the ball lands outside or strikes the net.',
      },
      {
        title: 'The Let Rule',
        description: 'If a served ball touches the net cord but still lands lawfully inside the correct service box, a "Let" is called and the server replays that serve without penalty.',
      },
      {
        title: 'Foot Fault Law',
        description: 'The server may not step on or over the baseline, or cross imaginary extensions of the center mark or sideline, until after the racket strikes the ball.',
      },
      {
        title: '7-Point Tiebreak (Set Decider)',
        description: 'When the set score reaches 6-6, a tiebreak is played. Player A serves 1 point from deuce court, then players alternate 2 serves each. First to 7 points with a 2-point margin wins the set 7-6. In Grand Slams, deciding 5th/3rd sets feature a 10-point super tiebreak at 6-6.',
      },
      {
        title: 'Ball In Play & Double Bounce',
        description: 'The ball must be struck before it bounces twice on the player side. A ball touching any boundary line is considered IN.',
      },
    ],
    foulsAndPenalties: [
      'Double Fault: Failing two consecutive serves results in losing the point.',
      'Touching the net with racket, body, or clothing while ball is in play forfeits the point.',
      'Hindrance: Deliberate noise or shouting while opponent is striking ball results in loss of point.',
      'Code Violations: Racket abuse, ball abuse, coaching violation (Warning -> Point Penalty -> Game Penalty -> Default).',
    ],
    refereeSignals: [
      'Out: Arm extended horizontally in direction of line calling.',
      'In: Both hands pointed down towards the court.',
      'Foot Fault: Arm pointed towards the baseline where violation occurred.',
      'Let: Arm raised vertically with open palm.',
    ],
    faqs: [
      {
        question: 'Does a ball that hits the line count as in or out in tennis?',
        answer: 'It is 100% IN! If any portion of the tennis ball touches any part of the boundary line, the ball is officially in play.',
      },
      {
        question: 'What is Deuce and Advantage in tennis?',
        answer: 'When a game reaches 40-40, it is called Deuce. A player must win 2 consecutive points from Deuce. The first point won gives Advantage (Ad). Winning the next point secures the Game; losing it returns the score to Deuce.',
      },
    ],
  },

  basketball: {
    id: 'basketball',
    name: 'Basketball',
    aliases: ['basketball', 'fiba', 'nba', 'dunk', 'three pointer', 'shot clock', 'free throw'],
    governingBody: 'International Basketball Federation (FIBA) / NBA',
    category: 'team',
    icon: '🏀',
    shortOverview: 'Two teams of 5 players compete on an indoor court to shoot an inflated basketball through an elevated 10-foot hoop while defending their own goal.',
    courtDimensions: 'Court length: 28 meters x 15 meters (FIBA) or 94 ft x 50 ft (NBA). Rim height: 10 feet (3.05 m). Three-point line: 6.75m (FIBA) / 7.24m (NBA). Free throw line: 4.6m (15 ft) from backboard.',
    teamSize: '5 players on the court per team (12 active squad members with unlimited substitutions).',
    gameDuration: 'FIBA: 40 minutes (four 10-minute quarters). NBA: 48 minutes (four 12-minute quarters). 5-minute overtime periods if tied.',
    scoringSystem: '3 points for shots made outside 3-point arc. 2 points for field goals inside the arc. 1 point for each made free throw.',
    coreRules: [
      {
        title: 'Shot Clock (24-Second Rule)',
        description: 'A team has 24 seconds to attempt a shot that touches the rim. If an offensive rebound is secured, the clock resets to 14 seconds.',
      },
      {
        title: 'Dribbling & Ball Handling Violations',
        description: 'Traveling: Taking more than 2 steps without dribbling the ball. Double Dribble: Dribbling with two hands at the same time, or stopping your dribble and dribbling again. Carrying: Placing hand underneath the ball while dribbling.',
      },
      {
        title: 'Time Violations (8s, 5s, 3s)',
        description: '8-Second Rule: Offense must advance ball past mid-court within 8 seconds. 5-Second Inbound: Must throw ball inbound within 5 seconds. 3-Second Rule: Offensive player cannot remain inside opponent key/paint for more than 3 consecutive seconds.',
      },
      {
        title: 'Goaltending & Basket Interference',
        description: 'Defenders cannot touch the ball while it is on its downward flight toward the rim, or when it is on or directly above the rim cylinder. If violated, the basket automatically counts.',
      },
      {
        title: 'Personal Fouls & Disqualification',
        description: 'Players are disqualified after committing 5 personal fouls in FIBA (or 6 fouls in the NBA). A team is "in the bonus" after 5 team fouls in a quarter, awarding 2 free throws on subsequent non-shooting fouls.',
      },
    ],
    foulsAndPenalties: [
      'Technical Foul: Unsporting behavior, arguing with officials (1 free throw + possession in FIBA).',
      'Unsportsmanlike / Flagrant Foul: Excessive or violent contact (2 free throws + ball possession).',
      'Backcourt Violation: Passing or dribbling ball back across half-court once advanced into frontcourt.',
    ],
    refereeSignals: [
      'Traveling: Rotating clenched fists in front of chest.',
      'Double Dribble: Patting motion with alternate open palms.',
      '3-Second Violation: Three fingers pointed out from hip level.',
      'Technical Foul: Forming a "T" with open palm and perpendicular fingers.',
      '3-Pointer Attempt / Made: One arm raised with 3 fingers / both arms raised with 3 fingers.',
    ],
    faqs: [
      {
        question: 'What is the Euro step in basketball?',
        answer: 'A legal move where an attacking player picks up their dribble, takes one step in one direction, and immediately takes a second step in a different direction to bypass a defender before shooting.',
      },
      {
        question: 'What happens when a shot clock expires in basketball?',
        answer: 'A turnover is called immediately, play is whistled dead, and possession of the ball is awarded to the opposing team at the nearest sideline.',
      },
    ],
  },

  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    aliases: ['volleyball', 'vollyball', 'fivb', 'spike', 'setter', 'libero', 'block'],
    governingBody: 'Fédération Internationale de Volleyball (FIVB)',
    category: 'team',
    icon: '🏐',
    shortOverview: 'Two teams of 6 players separated by a high net use their hands to volley a ball back and forth, attempting to make it ground on the opponents court.',
    courtDimensions: 'Court length: 18 meters x 9 meters (each half is 9m x 9m). Attack line (10-foot line): 3 meters from net. Net height: Men 2.43m (7 ft 11 5/8 in); Women 2.24m (7 ft 4 1/8 in). Antennae: 80cm above net.',
    teamSize: '6 active players on the court per team (12–14 squad roster including up to 2 Liberos).',
    gameDuration: 'Best of 5 sets. First 4 sets played to 25 points. 5th set decider played to 15 points (must win by 2).',
    scoringSystem: 'Rally scoring: Every serve results in a point for the team that wins the rally. Sets won by reaching 25 points with at least a 2-point cushion.',
    coreRules: [
      {
        title: '3-Touch Rule',
        description: 'A team is entitled to a maximum of 3 touches before returning the ball across the net. A block contact does not count as a team touch in FIVB rules.',
      },
      {
        title: 'Player Rotations',
        description: 'When the receiving team wins a rally and gains the serve, its players must rotate one position clockwise (position 1 through 6).',
      },
      {
        title: 'The Libero Specialist Role',
        description: 'Wears a distinctly contrasting jersey. Restricted to back-row defense. The Libero CANNOT serve (FIVB), cannot attack a ball when it is entirely above the net height, and cannot block or attempt to block.',
      },
      {
        title: 'Antenna & Boundary Rules',
        description: 'The ball must cross over the net entirely between the two vertical antennae. If the ball touches an antenna, referee stand, or ceiling outside boundaries, it is out of play.',
      },
      {
        title: 'Net Contact & Center Line Infringements',
        description: 'Contact with the top tape of the net during action of playing the ball is a fault. Stepping completely over the centerline into opponent court is a fault.',
      },
    ],
    foulsAndPenalties: [
      'Four Hits: Team contacts ball 4 times before crossing net.',
      'Double Contact: Player hits ball twice in succession (except on first team touch or block).',
      'Held Ball / Lift: Ball is caught, scooped, or thrown rather than cleanly rebounded.',
      'Back-Row Attack: Back-row player takes off from in front of 3-meter attack line and attacks ball above net.',
    ],
    refereeSignals: [
      'Point Awarded: Pointing finger towards the court of the serving/scoring team.',
      'Ball In: Pointing arm and fingers diagonally towards the floor.',
      'Ball Out: Raising forearms vertically with open palms facing backwards.',
      'Double Contact: Raising 2 fingers vertically on one hand.',
      'Four Hits: Raising 4 fingers vertically.',
      'Net Touch: Placing hand on top tape of net.',
    ],
    faqs: [
      {
        question: 'Can you use your feet to hit the ball in volleyball?',
        answer: 'Yes! According to official FIVB rules, the ball may contact any part of the body, including the legs and feet, as long as it is hit cleanly without being scooped or held.',
      },
    ],
  },

  racket: {
    id: 'racket',
    name: 'Racquet Sports (Badminton, Table Tennis, Squash, Pickleball)',
    aliases: ['racket', 'badminton', 'table tennis', 'ping pong', 'squash', 'pickleball'],
    governingBody: 'BWF (Badminton), ITTF (Table Tennis), WSF (Squash), USA Pickleball',
    category: 'racquet',
    icon: '🏸',
    shortOverview: 'Covers major global racket disciplines: Badminton with high-speed shuttlecocks, Table Tennis with fast spins, Squash on 4-walled enclosed courts, and Pickleball.',
    courtDimensions: 'Badminton: 13.4m x 6.1m (doubles) or 5.18m (singles); net 1.55m. Table Tennis: Table 2.74m x 1.525m, height 76cm. Squash: 9.75m x 6.4m court. Pickleball: 20ft x 44ft with 7ft Kitchen non-volley zone.',
    teamSize: '1 vs 1 (Singles) or 2 vs 2 (Doubles).',
    gameDuration: 'Best of 3 or 5 games (15 to 45 minutes per match).',
    scoringSystem: 'Badminton: 21 points rally scoring. Table Tennis: 11 points (serve alternates every 2 points). Squash: 11 points (PAR scoring). Pickleball: 11 points (win by 2, only serving team scores points in traditional rules).',
    coreRules: [
      {
        title: 'Badminton - BWF Service Law',
        description: 'The entire shuttlecock must be below 1.15 meters from the court surface at the instant of being struck by the server racket. Server and receiver must stand within diagonal service courts without touching boundary lines.',
      },
      {
        title: 'Table Tennis - ITTF Toss & Service Rules',
        description: 'The ball must rest on the palm of the free hand, be tossed upward at least 16 cm (6.3 in) without spin, and struck as it falls. The ball must bounce first on the server side, clear the net, and bounce on the receiver side.',
      },
      {
        title: 'Squash - Out Lines & Tin Rule',
        description: 'The ball must hit the front wall above the 17-inch metal tin and below the out line, and may touch side/back walls before bouncing on floor. The ball can only bounce once on the floor.',
      },
      {
        title: 'Pickleball - The Kitchen & Two-Bounce Rule',
        description: 'Non-Volley Zone (The Kitchen): Players cannot volley (hit without bouncing) while standing in or touching the 7-foot zone. Two-Bounce Rule: The serve must bounce once, and the return must bounce once before volleys are permitted.',
      },
    ],
    foulsAndPenalties: [
      'Badminton: Touching the net with racket or body, hitting shuttle before it crosses net.',
      'Table Tennis: Touching table surface with free hand during point forfeits the point.',
      'Squash: Obstructing opponent swing or path to ball (results in Let or Stroke penalty).',
    ],
    refereeSignals: [
      'Badminton Service Fault: Hand held over waist height or pointing to foot across line.',
      'Table Tennis Edge Ball: Finger pointed horizontally across edge of table.',
      'Squash Stroke: Arm raised fully upright indicating point awarded for obstruction.',
    ],
    faqs: [
      {
        question: 'What is the Kitchen rule in Pickleball?',
        answer: 'The Kitchen is the 7-foot non-volley zone on both sides of the net. You cannot hit the ball on the volley (in mid-air) while any part of your body touches the kitchen floor or its boundary lines.',
      },
    ],
  },

  rugby: {
    id: 'rugby',
    name: 'Rugby (Union & League)',
    aliases: ['rugby', 'raghbi', 'scrum', 'lineout', 'try', 'six nations', 'world rugby'],
    governingBody: 'World Rugby (Union) / International Rugby League (IRL)',
    category: 'team',
    icon: '🏉',
    shortOverview: 'A high-impact collision team sport played with an oval ball. Players run with the ball, kick it forward, but can only pass the ball backward or sideways to teammates.',
    courtDimensions: 'Field Length: 100 meters in-field + up to 22 meters in-goal area. Width: 70 meters. H-shaped goal posts: 5.6m wide crossbar at 3m height.',
    teamSize: 'Rugby Union: 15 players per side. Rugby League: 13 players per side.',
    gameDuration: '80 minutes (two 40-minute halves).',
    scoringSystem: 'Rugby Union: Try (5 pts), Conversion kick (2 pts), Penalty kick (3 pts), Drop goal (3 pts). Rugby League: Try (4 pts), Conversion (2 pts), Penalty (2 pts), Drop goal (1 pt).',
    coreRules: [
      {
        title: 'Backward Pass Law',
        description: 'The ball can never be thrown or passed forward by hand. Passing forward is an offense resulting in a scrum to the opposition.',
      },
      {
        title: 'Knock-On Offense',
        description: 'Occurs when a player loses possession of the ball forward onto the ground or onto another player. Play restarts with an opposition scrum.',
      },
      {
        title: 'Tackle, Ruck & Maul Laws (Union)',
        description: 'Once tackled to the ground, the ball-carrier must release the ball immediately, and the tackler must roll away. Incoming players must join rucks from behind the hindmost foot ("through the gate").',
      },
      {
        title: 'Scrums & Lineouts',
        description: 'Scrum: 8 forwards from each team bind together to contest possession after minor infringements. Lineout: Ball thrown down middle between two parallel lines of forwards after ball goes into touch (sideline).',
      },
      {
        title: 'Strict High Tackle Protocol',
        description: 'Any tackle making contact with the head or neck is subject to strict sanctions. High-speed shoulder charges to the head result in an immediate Red Card.',
      },
    ],
    foulsAndPenalties: [
      'Offside at Ruck/Maul: Standing ahead of the hindmost foot of the contest.',
      'Collapsing a scrum or maul intentionally: Direct penalty kick awarded.',
      'Yellow Card (Sin Bin): 10-minute suspension for repeated fouls or cynical play.',
    ],
    refereeSignals: [
      'Penalty: Arm pointed upwards at a 45-degree angle towards the non-offending team.',
      'Scrum: Arm extended horizontally forward indicating which team throws in.',
      'Try: Whistle blown and arm pointed down towards the goal-line turf.',
    ],
    faqs: [
      {
        question: 'What is the difference between Rugby Union and Rugby League?',
        answer: 'Union has 15 players, contests scrums, lineouts, rucks, and mauls, with tries worth 5 points. League has 13 players, no lineouts or contested rucks, uses a 6-tackle handover system, and tries are worth 4 points.',
      },
    ],
  },

  polo: {
    id: 'polo',
    name: 'Polo',
    aliases: ['polo', 'equestrian', 'chukker', 'mallet', 'hurlingham', 'ponies'],
    governingBody: 'Federation of International Polo (FIP) / Hurlingham Polo Association (HPA) / USPA',
    category: 'equestrian',
    icon: '🏇',
    shortOverview: 'An equestrian sport known as "The Sport of Kings". Teams of 4 mounted riders use long wooden mallets to drive a small white ball into the opponent goal.',
    courtDimensions: 'Field: 300 yards (274 m) length x 160 yards (146 m) width (the largest playing field in organized sports). Goal posts: 8 yards (7.3 m) apart.',
    teamSize: '4 riders and horses per side on field. Teams switch ends after each goal scored.',
    gameDuration: 'Match consists of 4 to 6 "chukkers" (periods) of 7 minutes each. 3-minute breaks between chukkers for riders to switch fresh ponies.',
    scoringSystem: 'Each time the ball passes completely between the goal posts at any height, 1 goal is awarded. Ends are switched after every goal.',
    coreRules: [
      {
        title: 'Line of the Ball & Right of Way (Safety Constitution)',
        description: 'The fundamental safety rule of polo. When the ball is struck, an imaginary line is created along its trajectory. The rider traveling closest to the direction of the ball on that line has the unconditional right of way. Crossing that line in front of another galloping pony is a severe dangerous riding penalty.',
      },
      {
        title: 'The Ride-Off (Bumping Rule)',
        description: 'A player may push an opponent off the line of the ball by riding alongside their horse, provided the horses are traveling at the same speed and at an angle not exceeding 30 degrees.',
      },
      {
        title: 'Hooking Mallets',
        description: 'A player may use their mallet to hook an opponent mallet to spoil a shot, but only when on the same side of the pony as the ball or directly behind.',
      },
      {
        title: 'Right-Hand Only Rule',
        description: 'For absolute safety to prevent head-on pony collisions, ALL polo players must hold the mallet in their right hand. Left-handed play was banned in 1975.',
      },
      {
        title: 'Handicap System (-2 to 10 Goals)',
        description: 'Players are rated on a handicap scale from -2 (novice) up to 10 (world-class elite, such as Adolfo Cambiaso and Facundo Pieres). Team handicap is the sum of its four players.',
      },
    ],
    foulsAndPenalties: [
      'Crossing the Line of the Ball: Dangerous foul resulting in free penalty hit from 30 or 40 yards.',
      'Careless or dangerous riding (zigzagging, blinding a pony): Yellow card or penalty goal.',
      'Reaching over an opponent pony neck with mallet: Strict foul.',
    ],
    refereeSignals: [
      'Goal Scored: Goal judge waves flag vertically overhead.',
      'Goal Missed: Goal judge waves flag horizontally back and forth across ground.',
      'Foul Whistle: Mounted field umpires blow loud whistle and raise hand.',
    ],
    faqs: [
      {
        question: 'Why do polo teams switch goals after every score?',
        answer: 'Because polo fields are huge outdoor grounds where wind, turf condition, and glaring sunlight can provide significant physical advantages. Switching ends after every goal neutralizes external environmental factors.',
      },
    ],
  },

  golf: {
    id: 'golf',
    name: 'Golf',
    aliases: ['golf', 'pga', 'usga', 'r&a', 'birdie', 'eagle', 'par', 'bogey', 'putt'],
    governingBody: 'The R&A / United States Golf Association (USGA)',
    category: 'individual',
    icon: '⛳',
    shortOverview: 'A precision club-and-ball sport in which players use various clubs to hit a ball into a series of 18 holes on a course in as few strokes as possible.',
    courtDimensions: 'Standard 18-hole championship course: 6,500 to 7,500 yards total distance. Hole cup diameter: 4.25 inches (108 mm) and at least 4 inches deep.',
    teamSize: 'Individual stroke play or 2-player team formats (Ryder Cup fourballs/foursomes).',
    gameDuration: '18 holes takes approximately 4 to 4.5 hours for a group of 4 players.',
    scoringSystem: 'Stroke Play: Lowest cumulative strokes over round/tournament wins. Match Play: Winner determined by total holes won. Par (target strokes): Birdie (-1), Eagle (-2), Albatross (-3), Bogey (+1), Double Bogey (+2).',
    coreRules: [
      {
        title: 'Play the Ball as it Lies (Rule 9)',
        description: 'You must play the ball from wherever it comes to rest without improving your lie, line of play, stance, or area of intended swing, unless a specific rule allows relief.',
      },
      {
        title: 'Maximum 14 Clubs Rule (Rule 4.1b)',
        description: 'A player must not start a round with more than 14 clubs in their bag. Exceeding 14 clubs incurs a 2-stroke penalty for each hole played with the excess club (max 4 strokes).',
      },
      {
        title: 'Out of Bounds (White Stakes / Line)',
        description: 'A ball is Out of Bounds when all of it lies beyond the boundary line. You must take stroke-and-distance relief (1 penalty stroke) and play from the spot of your previous shot.',
      },
      {
        title: 'Penalty Areas (Red & Yellow Stakes)',
        description: 'Yellow Penalty Area: 1 penalty stroke. Relief: Play from previous spot OR drop back on the line. Red Penalty Area: Provides an extra 3rd relief option: lateral drop within two club-lengths of the edge where the ball crossed into the hazard.',
      },
      {
        title: 'Lost Ball Time Limit (Rule 18.2)',
        description: 'A player has exactly 3 minutes to search for their ball. If not found within 3 minutes, the ball is officially lost, incurring stroke-and-distance penalty.',
      },
    ],
    foulsAndPenalties: [
      'Signing incorrect scorecard (lower score than actually achieved): Disqualification.',
      'Touching sand in bunker during practice swing: 2-stroke penalty in stroke play.',
      'Hitting the wrong ball: 2-stroke penalty, and the mistake must be corrected before teeing off next hole.',
    ],
    refereeSignals: [
      'Official Rules official drives white buggy with flag; clarifies rulings on the spot.',
    ],
    faqs: [
      {
        question: 'What is the difference between a Red and Yellow penalty area in golf?',
        answer: 'Yellow penalty areas offer stroke-and-distance relief or back-on-the-line relief. Red penalty areas offer those two plus a third option: lateral relief within 2 club-lengths of where the ball last crossed the edge, no closer to the hole.',
      },
    ],
  },

  archery: {
    id: 'archery',
    name: 'Archery',
    aliases: ['archery', 'bow', 'arrow', 'world archery', 'recurve', 'compound', 'bullseye'],
    governingBody: 'World Archery (WA)',
    category: 'target',
    icon: '🏹',
    shortOverview: 'A target discipline where competitors shoot arrows using a recurve or compound bow at a 10-ring target face over distances up to 70 meters.',
    courtDimensions: 'Olympic Target Distance: 70 meters (Recurve) or 50 meters (Compound). Target Face: 122 cm diameter for 70m Olympic Recurve; 80cm 6-ring face for 50m Compound.',
    teamSize: 'Individual matches (1 vs 1) or Team events (3 archers per team) and Mixed Team (1 male + 1 female).',
    gameDuration: 'Individual match: 5 sets of 3 arrows (~15 minutes).',
    scoringSystem: 'Target has 10 concentric scoring rings valued 1 to 10 from outside to inside. The central 10-ring contains an inner X-ring (tiebreaker). Set System: Set win = 2 pts, tie = 1 pt. First to 6 set points wins.',
    coreRules: [
      {
        title: 'Olympic Set Play Scoring System',
        description: 'In individual Olympic recurve matches, archers shoot 3 arrows per set. The archer with the higher 3-arrow score receives 2 set points; a tie awards 1 point each. First archer to reach 6 set points wins the match.',
      },
      {
        title: 'One-Arrow Shoot-Off (Golden Arrow)',
        description: 'If a match is tied at 5-5 after 5 sets, a dramatic single-arrow shoot-off occurs. Each archer shoots 1 arrow. The arrow closest to the dead center of the target wins, regardless of whether both scored a 10.',
      },
      {
        title: 'Line-Cutter Advantage Rule',
        description: 'If the shaft of an arrow touches any portion of the divider line between two scoring rings, the archer is officially awarded the higher point value.',
      },
      {
        title: 'Time Limits Per Arrow',
        description: 'Archers have 20 seconds per arrow when shooting alternating shots in individual televised finals, or 40 seconds per arrow in standard bracket play.',
      },
      {
        title: 'Shooting Line Foot Placement',
        description: 'Both feet must straddle or stand behind the shooting line. Once an arrow is released from the bow, it cannot be re-shot unless dropped within 3 meters without being propelled.',
      },
    ],
    foulsAndPenalties: [
      'Shooting before whistle / buzzer: Arrow scored as a miss (0 points).',
      'Exceeding allocated shooting time: Highest scoring arrow of the end is disqualified.',
      'Sky drawing (pointing bow excessively upward during draw): Strict safety violation resulting in warning/disqualification.',
    ],
    refereeSignals: [
      'Two Whistle Blasts: Archers may step to the shooting line.',
      'One Whistle Blast: Shooting may begin.',
      'Three Whistle Blasts: Shooting ends; archers walk to target to score and retrieve arrows.',
      'Series of rapid whistle blasts: EMERGENCY STOP - Immediately un-draw bow and step back.',
    ],
    faqs: [
      {
        question: 'What is an X in archery scoring?',
        answer: 'The X is the inner central ring located inside the 10-ring. It is worth 10 points on the scorecard, and the count of Xs is used as the primary tiebreaker in qualifying rounds.',
      },
    ],
  },
};

/**
 * Searches the sports rules database or finds specific rule details
 */
export function querySportsRules(queryText: string, currentSport?: string): {
  sportMatch: SportRuleEntry;
  matchingRule?: { title: string; description: string };
  foulMatches?: string[];
  faqMatch?: { question: string; answer: string };
  confidence: number;
} {
  const query = queryText.toLowerCase().trim();

  // 1. Identify sport
  let matchedSportKey = currentSport && SPORTS_RULES_DATABASE[currentSport] ? currentSport : 'cricket';

  // Check query against sport aliases
  for (const [key, entry] of Object.entries(SPORTS_RULES_DATABASE)) {
    if (entry.aliases.some((alias) => query.includes(alias))) {
      matchedSportKey = key;
      break;
    }
  }

  const sport = SPORTS_RULES_DATABASE[matchedSportKey] || SPORTS_RULES_DATABASE.cricket;

  // 2. Find matching core rule
  const matchingRule = sport.coreRules.find(
    (rule) =>
      query.includes(rule.title.toLowerCase()) ||
      rule.title.toLowerCase().split(' ').some((word) => word.length > 3 && query.includes(word)) ||
      query.split(' ').some((word) => word.length > 4 && rule.description.toLowerCase().includes(word))
  );

  // 3. Find matching FAQs
  const faqMatch = sport.faqs.find(
    (f) =>
      query.includes(f.question.toLowerCase()) ||
      f.question.toLowerCase().split(' ').some((w) => w.length > 4 && query.includes(w))
  );

  // 4. Find matching fouls
  const foulMatches = sport.foulsAndPenalties.filter((foul) =>
    foul.toLowerCase().split(' ').some((w) => w.length > 4 && query.includes(w))
  );

  return {
    sportMatch: sport,
    matchingRule,
    faqMatch,
    foulMatches: foulMatches.length > 0 ? foulMatches : undefined,
    confidence: matchingRule || faqMatch ? 0.95 : 0.7,
  };
}
