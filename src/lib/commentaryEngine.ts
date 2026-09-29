import {
  CommentaryLog,
  CommentaryLanguage,
  FootballCommentaryStyle,
  SportType,
} from '../types/models';

/**
 * Bowler Speed Generator:
 * - Fast / Medium-Fast: 135–160 km/h
 * - Spin (Off-spin, Leg-spin, Orthodox, Wrist-spin): 70–95 km/h
 * - Medium Pace: 110–134 km/h
 * Imperial conversion: mph = kmph * 0.621371 (rounded to 1 decimal place)
 */
export function generateBowlerSpeed(bowlerType: 'fast' | 'spin' | 'medium'): {
  kmph: number;
  mph: number;
} {
  let min = 110,
    max = 134;
  if (bowlerType === 'fast') {
    min = 135;
    max = 160;
  } else if (bowlerType === 'spin') {
    min = 70;
    max = 95;
  }
  const kmph = Math.round((Math.random() * (max - min) + min) * 10) / 10;
  const mph = Math.round(kmph * 0.621371 * 10) / 10;
  return { kmph, mph };
}

/**
 * Consecutive repetition tracker to guarantee no identical commentary lines repeat consecutively.
 */
let lastCricketLineIndex: Record<string, number> = {};
let lastFootballLineIndex: Record<string, number> = {};

// Cricket Lines Dictionary
interface CommentaryLineSet {
  en: string;
  hi: string;
  bn: string;
}

const CRICKET_RUN_LINES: Record<string, CommentaryLineSet[]> = {
  dot: [
    {
      en: 'Good length delivery right on the stumps, defended cleanly back towards the bowler.',
      hi: 'सटीक लेंथ पर गेंद, बल्लेबाज ने रक्षात्मक अंदाज में गेंदबाज की तरफ खेला। कोई रन नहीं।',
      bn: 'সঠিক লেন্থে চমৎকার বল, ব্যাটসম্যান নিরাপদে বোলারের দিকে ঠেলে দিলেন। কোনো রান হলো না।',
    },
    {
      en: 'Beaten on the outside edge! Perfect seam presentation shaping away late.',
      hi: 'बल्ले का बाहरी किनारा बीट हुआ! हवा में बेहतरीन स्विंग और सीम का मुजाहिरा।',
      bn: 'বাইরের কানায় পরাস্ত! নিখুঁত সিম ও সুইংয়ে ব্যাটার সম্পূর্ণ পরাস্ত।',
    },
    {
      en: 'Pushed gently towards point, fielder attacks the ball quickly. Dot ball.',
      hi: 'पॉइंट की दिशा में खेला गया शॉट, फील्डर की तेज रफ्तार से रन का मौका खत्म।',
      bn: 'পয়েন্টে আলতো পুশ, ফিল্ডার দ্রুত বল কুড়িয়ে রান আটকালো। ডট বল।',
    },
  ],
  single: [
    {
      en: 'Tapped with soft hands towards mid-on and they sprint through for a quick single.',
      hi: 'नरम हाथों से मिड-ऑन की तरफ खेलकर तेजी से एक रन चुरा लिया।',
      bn: 'নরম হাতে মিড-অনের দিকে ঠেলে দ্রুতগতির একটি রান সংগ্রহ করলেন।',
    },
    {
      en: 'Worked neatly off the hips through square leg for a sensible single.',
      hi: 'पैड्स पर आई गेंद को बैकवर्ड स्क्वायर लेग की दिशा में मोड़कर एक रन लिया।',
      bn: 'প্যাডের ওপর থেকে স্কয়ার লেগে বল ঘুরিয়ে বিচক্ষণভাবে একটি রান নিলেন।',
    },
  ],
  two: [
    {
      en: 'Driven through the covers, excellent running between the wickets pushes it into a comfortable brace.',
      hi: 'कवर्स के बीच से खूबसूरत ड्राइव, दोनों बल्लेबाजों की शानदार रनिंग से दो रन पूरे।',
      bn: 'কভার দিয়ে দর্শনীয় ড্রাইভ, উইকেটের মাঝে দারুণ দৌড়ে সহজেই দুটি রান।',
    },
  ],
  three: [
    {
      en: 'Pierces the gap in the deep! Sweeper hauls it in right before the rope, three runs taken.',
      hi: 'गैप में भेजा गेंद! बाउंड्री लाइन पर शानदार स्लाइडिंग फील्डिंग, तीन रन मिले।',
      bn: 'গ্যাপ গলিয়ে বল সীমানার দিকে! বাউন্ডারি লাইনে দুর্দান্ত ফিল্ডিং, তিন রান।',
    },
  ],
  four: [
    {
      en: 'CRACKING SHOT! Leans into a picture-perfect cover drive, racing across the turf to the fence!',
      hi: 'शानदार चौका! फुटवर्क का कमाल और कवर्स के ऊपर से गेंद गोली की तरह बाउंड्री पार!',
      bn: 'দুর্দান্ত চার! সামনের পায়ে ভর দিয়ে চোখজুড়ানো কভার ড্রাইভে বল সীমানা পার!',
    },
    {
      en: 'Short and punished! Pulled with authority through mid-wicket for four.',
      hi: 'छोटी गेंद को बख्शा नहीं! मिड-विकेट की तरफ ताकतवर पुल शॉट और मिले चार रन।',
      bn: 'শর্ট বল এবং সীমানা ছাড়া! মিড-উইকেটের ওপর দিয়ে সজোরে পুল করে চার।',
    },
  ],
  six: [
    {
      en: 'MONSTER HIT! Right into the slot and launched high over long-on into the upper tiers for SIX!',
      hi: 'गगनचुंबी छक्का! गेंद सीधे स्लॉट में और बल्लेबाज ने उसे बादलों की सैर पर भेज दिया!',
      bn: 'বিশাল ছক্কা! বল সোজা স্লটে পেয়ে লং-অনের ওপর দিয়ে উড়িয়ে স্টেডিয়ামের বাইরে!',
    },
    {
      en: 'DANCED DOWN THE TRACK! Clean as a whistle, straight back over the bowler for a colossal maximum!',
      hi: 'कदमों का जादुई इस्तेमाल! गेंदबाज के सिर के ऊपर से गेंद सीधे स्टैंड्स में, छह रन!',
      bn: 'ক্রিজ ছেড়ে বেরিয়ে সোজা বোলারের মাথার ওপর দিয়ে অবিশ্বাস্য ছক্কা!',
    },
  ],
  wide: [
    {
      en: 'Sprayed well outside off-stump beyond the tramline. Signalled wide by the umpire.',
      hi: 'ऑफ-स्टंप के काफी बाहर गेंद, अंपायर ने दोनों हाथ फैलाकर वाइड करार दिया।',
      bn: 'অফ-স্ট্যাম্পের অনেক বাইরে বল, আম্পায়ার দুই হাত প্রসারিত করে ওয়াইড দিলেন।',
    },
  ],
  noball: [
    {
      en: 'Overstepped the popping crease! No-ball called, and a FREE HIT awaits!',
      hi: 'पॉपिंग क्रीज से पैर बाहर! नो-बॉल का इशारा और अगली गेंद होगी फ्री हिट!',
      bn: 'পপিং ক্রিজের বাইরে পা! আম্পায়ার নো-বল ডাকলেন, ফ্রি-হিটের সুযোগ!',
    },
  ],
  wicket_bowled: [
    {
      en: 'TIMBER! Beaten for pace, the off-stump goes cartwheeling into the sky! Clean bowled!',
      hi: 'क्लीन बोल्ड! गति से पूरी तरह चकमा खाया और स्टंप्स हवा में कलाबाजी खाते नजर आए!',
      bn: 'ক্লিন বোল্ড! গতির সামনে পরাস্ত হয়ে অফ-স্ট্যাম্প ছিটকে শূন্যে ঘুরতে লাগলো!',
    },
  ],
  wicket_caught: [
    {
      en: 'OUT! Top edge flies high into the night sky, and the fielder settles underneath with steady hands.',
      hi: 'कैच आउट! बल्ले का ऊपरी किनारा लेकर हवा में टंगी गेंद, फील्डर ने कोई गलती नहीं की।',
      bn: 'আউট! ব্যাটের কানায় লেগে বল আকাশে, ফিল্ডার অত্যন্ত শান্তভাবে ক্যাচ লুফে নিলেন।',
    },
  ],
  wicket_lbw: [
    {
      en: 'HUGE SHOUT AND GIVEN! Trapped plumb in front of middle and leg. Finger goes up!',
      hi: 'बड़ी अपील और अंपायर की अंगुली हवा में! पैड्स के ठीक सामने पकड़े गए, एलबीडब्ल्यू!',
      bn: 'জোরালো আবেদন এবং আউট! প্যাডে লেগে সোজা উইকেটের সামনে ধরাশায়ী, এলবিডব্লিউ!',
    },
  ],
  wicket_runout: [
    {
      en: 'DIRECT HIT! Brilliant piece of fielding from extra cover, beaten by inches!',
      hi: 'डायरेक्ट हिट! एक्स्ट्रा कवर से रॉकेट थ्रो और बल्लेबाज कुछ इंच से चूक गए, रन आउट!',
      bn: 'সরাসরি থ্রো! এক্সট্রা কভার থেকে বুলেট গতির থ্রোতে উইকেট ভেঙে চুরমার, রান আউট!',
    },
  ],
  wicket_stumped: [
    {
      en: 'STUMPED! Dragged out of the crease by the drift, bails whipped off in a flash!',
      hi: 'स्टंप आउट! टर्न और ड्रिफ्ट से चकमा खाए, विकेटकीपर ने पलक झपकते ही गिल्लियां बिखेर दीं!',
      bn: 'স্ট্যাম্পড! বলের স্পিনে বিভ্রান্ত হয়ে ক্রিজ ছাড়লেন, উইকেটকিপার পলকের মধ্যে বেল ফেলে দিলেন!',
    },
  ],
};

// Sidhuisms (Guru Special Cricket Commentary lines with fiery humor)
export const SIDHUISMS: CommentaryLineSet[] = [
  {
    en: '🔥 GURU! Form is temporary, class is permanent! This shot was like catching a falling knife with buttered hands!',
    hi: '🔥 ठोको ताली गुरु! फॉर्म पानी का बुलबुला है, क्लास हमेशा टिकती है! गेंद नहीं गोली मारी है!',
    bn: '🔥 গুরু! ফর্ম সাময়িক কিন্তু জাত চিরন্তন! ব্যাটার এমন শট খেললেন যেন মাখনে ছুরি চালানো হলো!',
  },
  {
    en: '🔥 CHAK DE PHATTE! You cannot make a bull out of a bullfrog! That delivery had eyes on the stumps from minute one!',
    hi: '🔥 गुरु चक दे फट्टे! मेंढक को कितना भी फुला लो वह बैल नहीं बनता! बल्लेबाज को दिन में तारे दिखा दिए!',
    bn: '🔥 জয় গুরু! বোলারের আগুনে ডেলিভারি যেন কামান থেকে বের হওয়া গোলা, ব্যাটার তাজ্জব!',
  },
  {
    en: '🔥 SHOT GURU! The ball travelled so fast that even the camera couldn’t take its photo! Tali thoko!',
    hi: '🔥 अरे गुरु क्या शॉट है! गेंद इतनी तेजी से बाउंड्री पार गई कि कैमरे की आंख भी धोखा खा गई!',
    bn: '🔥 আহা গুরু কী মার! বল এমন ঝড়ে উড়ে গেল যে ক্যামেরাম্যানও ছবি তোলার সময় পেল না!',
  },
  {
    en: '🔥 Statistics are like miniskirts, guru! What they reveal is suggestive, but what they conceal is vital!',
    hi: '🔥 अरे गुरु आंकड़े तो चश्मे की तरह होते हैं, जो दिख रहा है वो तो ठीक है, असली जादू मैदान पर है!',
    bn: '🔥 গুরু! পরিসংখ্যান দিয়ে আসল খেলার মেজাজ মাপা যায় না, উইকেটে এখন জ্বলন্ত লড়াই!',
  },
  {
    en: '🔥 If "ifs" and "buts" were pots and pans, there would be no tinkerers! That was sheer poetry in motion!',
    hi: '🔥 गुरु अगर अगर-मगर से काम चलता तो हर कोई नवाब होता! यह शॉट तो कला और क्लास का बेजोड़ संगम है!',
    bn: '🔥 কথায় চিড়ে ভেজে না গুরু! ব্যাটারের কবজির মোচড়ে বল যেন পাখির মতো ডানা মেলে সীমানা পার!',
  },
];

// Football Commentary Dictionary by Style
export const FOOTBALL_STYLE_LINES: Record<
  FootballCommentaryStyle,
  Record<string, CommentaryLineSet[]>
> = {
  worldcup: {
    goal: [
      {
        en: 'GOOOAAALLL! INCREDIBLE SCENES ON THE WORLD STAGE! A thunderous strike into the top corner!',
        hi: 'गोल! विश्व कप के मंच पर अविश्वसनीय दृश्य! गेंद सीधे टॉप कॉर्नर में जा समाई!',
        bn: 'গোললললল! বিশ্বকাপের মঞ্চে ইতিহাস! বুলেট গতির শট সোজা টপ কর্নারে!',
      },
      {
        en: 'THE NATION ERUPTS! Pure World Cup magic as the striker slips it beneath the goalkeeper!',
        hi: 'स्टेडियम झूम उठा! स्ट्राइकर ने गोलकीपर को छकाते हुए गेंद जाली में उलझा दी!',
        bn: 'গোটা গ্যালারি উত্তাল! গোলরক্ষকের পায়ের ফাঁক দিয়ে অনবদ্য ফিনিশিংয়ে গোল!',
      },
    ],
    yellow_card: [
      {
        en: 'Referee reaches into the pocket! Tactical foul in the middle third and a yellow card shown.',
        hi: 'रेफरी की जेब से निकला पीला कार्ड! खतरनाक फाउल के लिए चेतावनी।',
        bn: 'রেফারির পকেট থেকে বের হলো হলুদ কার্ড! বিপজ্জনক ট্যাকলের শাস্তি।',
      },
    ],
    red_card: [
      {
        en: 'RED CARD! Straight off the pitch! Dangerous studs-up challenge leaves the team down to 10 men!',
        hi: 'लाल कार्ड! सीधे मैदान से बाहर! खतरनाक टैकल की भारी कीमत चुकानी पड़ी!',
        bn: 'সরাসরি লাল কার্ড! ভয়াবহ ট্যাকল করে মাঠ ছাড়তে বাধ্য হলেন খেলোয়াড়!',
      },
    ],
    sub: [
      {
        en: 'Tactical change on the touchline! Fresh legs injected to shift the attacking dynamics.',
        hi: 'टचलाइन पर सामरिक बदलाव! आक्रमण को नई ऊर्जा देने के लिए नया खिलाड़ी मैदान में।',
        bn: 'সাইডলাইনে ট্যাকটিক্যাল বদল! আক্রমণের ধার বাড়াতে মাঠে নামলেন নতুন খেলোয়াড়।',
      },
    ],
    penalty_goal: [
      {
        en: 'COOL AS ICE! Sent the keeper the wrong way from the spot and converted effortlessly!',
        hi: 'बर्फ की तरह शांत! पेनल्टी स्पॉट से गोलकीपर को विपरीत दिशा में भेजकर शानदार गोल!',
        bn: 'বরফের মতো শান্ত চিত্তে স্পট-কিক! কিপারকে উল্টো দিকে পাঠিয়ে অনায়াস গোল!',
      },
    ],
  },
  epl: {
    goal: [
      {
        en: 'WHAT A STRIKE! Premier League intensity at its finest! Buries it low into the bottom corner!',
        hi: 'शानदार प्रहार! प्रीमियर लीग का असली रोमांच, गेंद सीधे बॉटम कॉर्नर में!',
        bn: 'কী অপূর্ব গোল! প্রিমিয়ার লিগের চরম উত্তেজনা, নিখুঁত শটে বল জালে জড়ালো!',
      },
    ],
    yellow_card: [
      {
        en: 'Booked! Late crunching sliding challenge near the halfway line.',
        hi: 'पीला कार्ड! हाफवे लाइन पर लेट स्लाइडिंग टैकल के लिए चेतावनी।',
        bn: 'হলুদ কার্ড! মাঝমাঠে বিপজ্জনক স্লাইডিং ট্যাকলের জন্য রেফারি সতর্ক করলেন।',
      },
    ],
    red_card: [
      {
        en: 'HE IS OFF! Denial of an obvious goalscoring opportunity, no hesitation from the ref!',
        hi: 'मैदान से बाहर! गोल का साफ मौका रोकने के जुर्म में सीधा लाल कार्ड!',
        bn: 'মাঠ থেকে বহিষ্কার! নিশ্চিত গোল আটকানোর অপরাধে লাল কার্ড!',
      },
    ],
    sub: [
      {
        en: 'Substitution made. High-press midfielder comes on to lock down the midfield engine.',
        hi: 'खिलाड़ी बदला गया। मिडफील्ड को मजबूत करने के लिए फ्रेश इंजन उतारा गया।',
        bn: 'খেলোয়াড় পরিবর্তন। মাঝমাঠের নিয়ন্ত্রণ বাড়াতে নতুন মিডফিল্ডার নামলেন।',
      },
    ],
    penalty_goal: [
      {
        en: 'SLOTS IT HOME! Smashed high into the roof of the net, untouchable penalty!',
        hi: 'जाली के ऊपरी हिस्से में जोरदार प्रहार! गोलकीपर के पास कोई मौका नहीं था।',
        bn: 'জালের উপরের কোণায় বুলেট শট! গোলকিপারের তাকিয়ে দেখা ছাড়া উপায় ছিল না।',
      },
    ],
  },
  laliga: {
    goal: [
      {
        en: 'QUÉ GOLAZO! MAGNIFICO! Silky tiki-taka passing finished with a delicate chip over the keeper!',
        hi: 'लाजवाब गोल! शानदार पासिंग का मुजाहिरा और गोलकीपर के सिर के ऊपर से चिप किया गया गोल!',
        bn: 'অবিশ্বাস্য গোল! টিকিটাকার অপূর্ব সমন্বয় শেষে আলতো চিপে গোলরক্ষককে পরাস্ত করলেন!',
      },
    ],
    yellow_card: [
      {
        en: 'Tarjeta Amarilla! Cynical shirt pull halts the counter-attack in its tracks.',
        hi: 'पीला कार्ड! काउंटर अटैक रोकने के लिए जर्सी खींचने की सजा।',
        bn: 'হলুদ কার্ড! কাউন্টার অ্যাটাক রুখতে জার্সি টেনে ধরার অপরাধে সতর্কতা।',
      },
    ],
    red_card: [
      {
        en: 'Tarjeta Roja! High boot into the chest, the referee does not hesitate for a second!',
        hi: 'लाल कार्ड! खतरनाक फाउल के बाद रेफरी ने बिना देर किए बाहर का रास्ता दिखाया!',
        bn: 'লাল কার্ড! বিপজ্জনক বুট তোলার জন্য রেফারি সাথে সাথে মাঠ থেকে বের করে দিলেন!',
      },
    ],
    sub: [
      {
        en: 'Cambio! The playmaker departs to a standing ovation as the defensive anchor enters.',
        hi: 'खिलाड़ी बदला! तालियों की गड़गड़ाहट के बीच प्लेमेकर बाहर और नया डिफेंडर अंदर।',
        bn: 'খেলোয়াড় বদল! করতালির মাঝে প্লেমেকার মাঠ ছাড়লেন, নামলেন রক্ষণাত্মক ভরসা।',
      },
    ],
    penalty_goal: [
      {
        en: 'PANENKA PENALTY! Pure audacity! Chips it down the middle with unbelievable nerve!',
        hi: 'पानेनका पेनल्टी! गजब का आत्मविश्वास, गेंद को धीमी गति से ठीक बीच में उछाला!',
        bn: 'পানেঙ্কা পেনাল্টি! অসীম সাহস নিয়ে আলতো করে মাঝখান দিয়ে বল জালে জড়ালেন!',
      },
    ],
  },
  sidhu: {
    goal: [
      {
        en: '🔥 GURU CHAK DE! The goalkeeper was looking for his cap while the ball was in the net! WHAT A GOAL!',
        hi: '🔥 अरे गुरु ठोको ताली! गोलकीपर टोपी ढूंढता रह गया और गेंद जाली फाड़कर निकल गई!',
        bn: '🔥 জয় গুরু! গোলকিপার খুঁজছিলেন ক্যাপ আর বল ততক্ষণে জালে! কী মারাত্মক গোল!',
      },
    ],
    yellow_card: [
      {
        en: '🔥 GURU! You cannot fly like an eagle with the wings of a sparrow! That yellow card was coming from yesterday!',
        hi: '🔥 अरे गुरु चिड़िया के पर लगाकर कोई बाज नहीं बनता! यह पीला कार्ड तो आना ही था!',
        bn: '🔥 গুরু! চড়াইয়ের ডানা নিয়ে কি আর ঈগল হওয়া যায়? এই ফাউলে হলুদ কার্ড ছাড়া উপায় ছিল না!',
      },
    ],
    red_card: [
      {
        en: '🔥 AND HE IS GONE! You can’t make an omelette without breaking eggs, but he broke the whole pan! Red card!',
        hi: '🔥 गुरु छुट्टी हो गई! खिलाड़ी ने अंडा नहीं पूरा तवा ही तोड़ दिया! सीधा लाल कार्ड!',
        bn: '🔥 গুরু লাল কার্ড পেয়ে মাঠ ছাড়া! বাড়াবাড়ির একটা সীমা থাকে, রেফারি সোজা রাস্তা দেখালেন!',
      },
    ],
    sub: [
      {
        en: '🔥 Fresh blood in the arena, guru! When the engine starts smoking, you change the spark plug!',
        hi: '🔥 अरे गुरु नया घोड़ा मैदान में! जब इंजन गर्म हो जाए तो प्लग बदलना ही पड़ता है!',
        bn: '🔥 টাটকা রক্ত মাঠে নামলো গুরু! দল যখন ক্লান্ত, তখন চাঙ্গা খেলোয়াড়ই আসল চাবিকাঠি!',
      },
    ],
    penalty_goal: [
      {
        en: '🔥 GURU WAQAL! That penalty was so cool, it could freeze hot water in the Sahara!',
        hi: '🔥 अरे गुरु ठंडा-ठंडा कूल-कूल! सहारा के रेगिस्तान में भी बर्फ जमा दे ऐसा पेनल्टी गोल!',
        bn: '🔥 গুরু কী ঠান্ডা মাথার শট! সাহারা মরুভূমিতেও যেন বরফ জমিয়ে দেবে এমন পেনাল্টি ফিনিশ!',
      },
    ],
  },
};

/**
 * Generates a real-time multi-lingual commentary item.
 * Guarantees textEn, textHi, textBn are populated simultaneously.
 * Enforces consecutive non-repetition.
 * Injects Sidhuism on every 4th cricket ball, and forces Sidhu style every 5th football event.
 */
export function generateCricketCommentary(
  matchId: string,
  overStr: string,
  ballNumber: number,
  eventType: 'dot' | 'single' | 'two' | 'three' | 'four' | 'six' | 'wide' | 'noball' | 'wicket',
  wicketSubtype?: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped',
  bowlerName: string = 'Bowler',
  bowlerType: 'fast' | 'spin' | 'medium' = 'fast',
  batterName: string = 'Batter',
  scoreSnapshot: string = ''
): Omit<CommentaryLog, 'id'> {
  const speed = generateBowlerSpeed(bowlerType);
  const isEvery4th = ballNumber > 0 && ballNumber % 4 === 0;

  let textSet: CommentaryLineSet;
  let isSidhuism = false;

  if (isEvery4th) {
    // Pick Sidhuism
    const idx = Math.floor(Math.random() * SIDHUISMS.length);
    textSet = SIDHUISMS[idx];
    isSidhuism = true;
  } else {
    // Pick normal commentary line based on event
    let key = eventType as string;
    if (eventType === 'wicket' && wicketSubtype) {
      key = `wicket_${wicketSubtype}`;
    }
    const pool = CRICKET_RUN_LINES[key] || CRICKET_RUN_LINES.dot;
    const lastIdx = lastCricketLineIndex[key] ?? -1;
    let chosenIdx = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && chosenIdx === lastIdx) {
      chosenIdx = (chosenIdx + 1) % pool.length;
    }
    lastCricketLineIndex[key] = chosenIdx;
    textSet = pool[chosenIdx];
  }

  // Prepend speed info and names for realism
  const speedPrefixEn = `${bowlerName} (${speed.kmph} km/h / ${speed.mph} mph) to ${batterName}: `;
  const speedPrefixHi = `${bowlerName} (${speed.kmph} किमी/घंटा) की ${batterName} को गेंद: `;
  const speedPrefixBn = `${bowlerName} (${speed.kmph} কিমি/ঘণ্টা) এর বলে ${batterName}: `;

  const mappedEventType =
    eventType === 'wicket'
      ? 'cricket_wicket'
      : eventType === 'four' || eventType === 'six'
      ? 'cricket_boundary'
      : eventType === 'wide' || eventType === 'noball'
      ? 'cricket_extra'
      : 'cricket_run';

  return {
    matchId,
    sport: 'cricket',
    timestamp: Date.now(),
    periodOrOver: `Over ${overStr}`,
    ballOrMinute: ballNumber,
    eventType: mappedEventType,
    textEn: `${speedPrefixEn}${textSet.en}`,
    textHi: `${speedPrefixHi}${textSet.hi}`,
    textBn: `${speedPrefixBn}${textSet.bn}`,
    bowlerSpeedKmph: speed.kmph,
    bowlerSpeedMph: speed.mph,
    bowlerStyle: bowlerType,
    isSidhuism,
    scoreSnapshot,
  };
}

/**
 * Generates a real-time multi-lingual football commentary item.
 * Supports style selection (worldcup, epl, laliga, sidhu).
 * Forces a sidhu style line every 5th event.
 */
export function generateFootballCommentary(
  matchId: string,
  minute: number,
  eventIndex: number,
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'penalty_goal',
  preferredStyle: FootballCommentaryStyle,
  playerName: string = 'Player',
  teamName: string = 'Team',
  scoreSnapshot: string = ''
): Omit<CommentaryLog, 'id'> {
  // Force sidhu style every 5th event
  const isEvery5th = eventIndex > 0 && eventIndex % 5 === 0;
  const effectiveStyle: FootballCommentaryStyle = isEvery5th ? 'sidhu' : preferredStyle;

  const stylePool = FOOTBALL_STYLE_LINES[effectiveStyle] || FOOTBALL_STYLE_LINES.worldcup;
  const pool = stylePool[eventType] || stylePool.goal;

  const key = `${effectiveStyle}_${eventType}`;
  const lastIdx = lastFootballLineIndex[key] ?? -1;
  let chosenIdx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && chosenIdx === lastIdx) {
    chosenIdx = (chosenIdx + 1) % pool.length;
  }
  lastFootballLineIndex[key] = chosenIdx;
  const textSet = pool[chosenIdx];

  const prefixEn = `[${minute}'] ${playerName} (${teamName}) - `;
  const prefixHi = `[${minute}'] ${playerName} (${teamName}) - `;
  const prefixBn = `[${minute}'] ${playerName} (${teamName}) - `;

  const mappedEventType =
    eventType === 'goal'
      ? 'football_goal'
      : eventType === 'yellow_card' || eventType === 'red_card'
      ? 'football_card'
      : eventType === 'sub'
      ? 'football_sub'
      : 'football_penalty';

  return {
    matchId,
    sport: 'football',
    timestamp: Date.now(),
    periodOrOver: `${minute}'`,
    ballOrMinute: minute,
    eventType: mappedEventType,
    textEn: `${prefixEn}${textSet.en}`,
    textHi: `${prefixHi}${textSet.hi}`,
    textBn: `${prefixBn}${textSet.bn}`,
    isSidhuism: effectiveStyle === 'sidhu',
    commentaryStyle: effectiveStyle,
    scoreSnapshot,
  };
}
