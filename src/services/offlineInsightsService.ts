import {
  GameAttempt,
  AICaregiverInsightResult,
  Language,
  CognitiveSkillId,
  GameId,
} from '../types';
import { CognitiveMLInferenceService, MLPredictionResult } from './mlInferenceService';
import { AdaptiveDifficultyEngine, DifficultyRecommendation } from './adaptiveEngine';

const DISCLAIMER_MAP: Record<Language, string> = {
  en: "Memora's insights are based on activity performance and are intended for supportive guidance only. They are not a medical assessment.",
  as: "মেমোৰাৰ পৰামৰ্শসমূহ খেলৰ কাৰ্যক্ষমতাৰ ওপৰত আধাৰিত আৰু কেৱল মানসিক সহায়কৰ বাবেহে, চিকিৎসাজনিত নিদান নহয়।",
  bn: "মেমোরার এই অন্তর্দৃষ্টি কার্যকলাপের উপর ভিত্তি করে তৈরি এবং এটি শুধুমাত্র সহায়ক নির্দেশনার জন্য, কোনো চিকিৎসাগত মূল্যায়ন নয়।",
  ne: "मेमोराका यी सिफारिसहरू खेलको गतिविधिको आधारमा सहयोगी मार्गदर्शनका लागि मात्र हुन्, कुनै चिकित्सकीय निदान होइनन्।",
  lus: "Memora thurawn hi infiahna atanga buatsaih a ni a, puihthawmna mai a ni, doctor enkawlna aiah a hman theih loh.",
  kha: "Ki jingbthah Memora ki long tang ban pynshngain, kim dei ka jingsumar doctor.",
  ny: "Memora agan hie gennam kape, doctor kape ma.",
  trp: "মেমোরানি পরামর্শ সামুং খ্লাইমানি ওপর নির্ভর, অ ডাক্তরনি রিপোর্ট নয়া।",
  mni: "ꯃꯦꯃꯣꯔꯥꯒꯤ ꯄꯥꯎꯇꯥꯛꯁꯤꯡꯁꯤ ꯁꯥꯟꯅ-ꯈꯣꯠꯅꯕꯗ ꯌꯨꯝꯐꯝ ꯑꯣꯏꯕꯅꯤ, ꯃꯁꯤ ꯂꯥꯌꯦꯡꯕꯒꯤ ꯊꯕꯛ ꯅꯠꯇꯦ (মেমোরাগী পাউতাক)।",
};

const SKILL_LABELS: Record<CognitiveSkillId, Record<Language, string>> = {
  recall: {
    en: 'Routine Recall',
    as: 'ৰুটিন সোঁৱৰণ',
    bn: 'রুটিন স্মরণ',
    ne: 'दैनिक तालिका स्मरण',
    lus: 'Nitin thil hriatchhuah',
    kha: 'Kynmaw ia ka rukom im',
    ny: 'Romrrom mit-nam',
    trp: 'নিয়ম উয়ানসুমা',
    mni: 'ꯔꯨꯇꯤꯟ ꯅꯤꯡꯁꯤꯡꯕ (রুটিন নীংশিংবা)',
  },
  recognition: {
    en: 'Familiar Recognition',
    as: 'চিনাকি মুখ আৰু মাত',
    bn: 'পরিচিত মুখ ও কণ্ঠ',
    ne: 'चिनजान पहिचान',
    lus: 'Hmelhriat hriatfiahna',
    kha: 'Ithuh ia kiba ieid',
    ny: 'Mongo si-nam',
    trp: 'চিনাকি বরোক সিমা',
    mni: 'ꯃꯁꯛ ꯈꯪꯗꯣꯛꯄ (মশক খঙদোকপা)',
  },
  associative_memory: {
    en: 'Family Connections',
    as: 'সম্পৰ্ক চিনাক্তকৰণ',
    bn: 'পারিবারিক সম্পর্ক',
    ne: 'पारिवारिक सम्बन्ध',
    lus: 'Chhungkaw inlaichinna',
    kha: 'Ka jingiadei kur',
    ny: 'Akam do-nam',
    trp: 'নখরোনি সম্পর্ক',
    mni: 'ꯏꯃꯨꯡꯒꯤ ꯃꯔꯤ (ইমুংগী মরী)',
  },
  problem_solving: {
    en: 'Visual Puzzle Solving',
    as: 'ছবিৰ সাঁথৰ সমাধান',
    bn: 'চিত্র ধাঁধা সমাধান',
    ne: 'तस्विर पजल समाधान',
    lus: 'Thlalak puzzle chinfel',
    kha: 'Wad buit ia ki dur',
    ny: 'Elek pennam',
    trp: 'ফটোনি পাজল সুংমা',
    mni: 'ꯐꯣꯇꯣ ꯄꯖꯜ ꯋꯥꯔꯣꯏꯁꯤꯟ (পজল ৱারোইশিন)',
  },
  categorization: {
    en: 'Object Categorization',
    as: 'বস্তুৰ শ্ৰেণী বিভাজন',
    bn: 'বস্তুর শ্রেণিবিভাগ',
    ne: 'वस्तु वर्गीकरण',
    lus: 'Thil hrang lakchhuah',
    kha: 'Jied ia kiba pher',
    ny: 'Aching do-nam',
    trp: 'জিনিস সিমুং',
    mni: 'ꯄꯣꯠꯂꯝꯁꯤꯡ ꯈꯥꯏꯗꯣꯛꯄ (পোৎলম খাইদোকপা)',
  },
  visual_spatial: {
    en: 'Shape & Spatial Awareness',
    as: 'আকৃতি চিনাক্তকৰণ',
    bn: 'আকৃতি ও স্থানিক ধারণা',
    ne: 'आकार र स्थान पहिचान',
    lus: 'Hmun leh pianhmang hriatna',
    kha: 'Ka jingthew dur',
    ny: 'Apun si-nam',
    trp: 'আকার তেই জায়া সিমা',
    mni: 'ꯁꯛꯇꯝ ꯑꯃꯁꯨꯡ ꯃꯐꯝ ꯈꯪꯕ (শকতম খঙবা)',
  },
};

export class OfflineInsightsService {
  static generateOfflineInsights(
    patientName: string = 'the senior',
    attempts: GameAttempt[],
    lang: Language = 'en'
  ): AICaregiverInsightResult {
    const analytics = AdaptiveDifficultyEngine.evaluateCognitiveSkills(attempts);
    const strongestSkill = analytics.strongestArea;
    const practiceSkill = analytics.practiceArea;
    const recommendedActivity = analytics.recommendedActivity;

    const recommendation = AdaptiveDifficultyEngine.getDifficultyRecommendation(recommendedActivity, attempts);
    const recommendedLevel = recommendation.level;
    const confidence = Number(recommendation.confidence.toFixed(2));

    const getSkillLabel = (skill: CognitiveSkillId): string => {
      return SKILL_LABELS[skill]?.[lang] || SKILL_LABELS[skill]?.en || skill;
    };

    const strongestLabel = getSkillLabel(strongestSkill);
    const practiceLabel = getSkillLabel(practiceSkill);
    const strongestScore = analytics.cognitiveScores[strongestSkill] || 85;

    const recent = attempts.slice(-5);
    const avgResponseTime =
      recent.length > 0
        ? Math.round(recent.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0) / recent.length)
        : 25;

    let summary = '';
    let reason = '';
    let caregiverSuggestions: string[] = [];

    const isPromotion = recommendation.features && recommendation.level > recommendation.features.currentDifficulty;
    const isDemotion = recommendation.features && recommendation.level < recommendation.features.currentDifficulty;

    switch (lang) {
      case 'as':
        if (attempts.length === 0) {
          summary = `${patientName}ৰ বাবে শান্ত আৰু আনন্দদায়ক চিনাকি খেলৰ মাধ্যমেৰে আৰম্ভ কৰা হৈছে। প্ৰথম পৰ্যায়ত স্তৰ ১ পৰামৰ্শ দিয়া হ’ল।`;
          reason = `অফলাইন নিউৰেল মডেলে মানসিক চাপ নপৰাকৈ প্ৰাথমিক স্তৰ নিৰ্ধাৰণ কৰিছে। কোনো ইণ্টাৰনেটৰ প্ৰয়োজন নাই।`;
        } else if (isPromotion) {
          summary = `${patientName}য়ে ${strongestLabel}-ত বিশেষ দক্ষতা দেখুৱাইছে (${strongestScore}%)। অগ্ৰগতিৰ বাবে খেলৰ স্তৰ ${recommendedLevel}-লৈ বৃদ্ধি কৰা হৈছে।`;
          reason = `অফলাইন নিউৰেল MLP মডেলে শেহতীয়া সঁহাৰি পৰ্যবেক্ষণ কৰি স্তৰ ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) নিৰ্ধাৰণ কৰিছে।`;
        } else if (isDemotion) {
          summary = `শেহতীয়া খেলত সামান্য দ্বিধাবোধ লক্ষ্য কৰা হৈছে। সেয়েহে সহজ অনুভৱৰ বাবে খেলৰ স্তৰ ${recommendedLevel}-লৈ নিৰ্ধাৰণ কৰা হৈছে।`;
          reason = `অফলাইন নিউৰেল মডেলে কোনো মানসিক চাপ নপৰাকৈ আৰামদায়ক স্তৰ ${recommendedLevel} বাছি লৈছে।`;
        } else {
          summary = `${patientName}য়ে ${strongestLabel}-ত স্থিৰ আনন্দ লাভ কৰিছে (${strongestScore}%)। ${practiceLabel} নিয়মীয়াকৈ অনুশীলন কৰাৰ পৰামৰ্শ দিয়া হ’ল।`;
          reason = `অফলাইন নিউৰেল MLP মডেলে ইণ্টাৰনেট অবিহনে খেলৰ অগ্ৰগতি নিৰীক্ষণ কৰি স্তৰ ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) বাছি লৈছে।`;
        }
        caregiverSuggestions = [
          `উত্তৰ দিবলৈ তাড়াহুড়া নকৰি আৰামেৰে সময় ল’বলৈ দিয়ক (গড় সময়: ${avgResponseTime} ছেকেণ্ড)।`,
          'শুদ্ধ বা ভুলৰ সলনি মানসিক সন্তুষ্টি আৰু আত্মবিশ্বাসক অধিক গুৰুত্ব দিয়ক।',
          'খেলৰ সময়খিনিক চিনাকি চাহৰ কাপ, সুমধুৰ গীত বা শান্ত সান্নিধ্যৰ সৈতে সংযোগ কৰক।',
        ];
        break;

      case 'bn':
        if (attempts.length === 0) {
          summary = `${patientName}-এর জন্য শান্ত ও আনন্দদায়ক পরিচিত খেলার মাধ্যমে শুরু করা হয়েছে। প্রথম পর্যায়ে স্তর ১ সুপারিশ করা হলো।`;
          reason = `অফলাইন এআই মডেল কোনো মানসিক চাপ ছাড়াই প্রাথমিক স্তর নির্ধারণ করেছে। কোনো ইন্টারনেটের প্রয়োজন নেই।`;
        } else if (isPromotion) {
          summary = `${patientName} ${strongestLabel}-এ চমৎকার দক্ষতা দেখিয়েছেন (${strongestScore}%)। অগ্রগতির জন্য খেলার স্তর ${recommendedLevel}-এ উন্নীত করা হয়েছে।`;
          reason = `অফলাইন নিউরাল মডেল সাম্প্রতিক ফলাফলের ভিত্তিতে স্তর ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) নির্ধারণ করেছে।`;
        } else if (isDemotion) {
          summary = `সাম্প্রতিক খেলায় সামান্য দ্বিধা লক্ষ্য করা গেছে। সহজ অনুভূতির জন্য খেলার স্তর ${recommendedLevel}-এ রাখা হয়েছে।`;
          reason = `অফলাইন এআই মডেল কোনো চাপ সৃষ্টি না করে স্বাচ্ছন্দ্যময় স্তর ${recommendedLevel} বেছে নিয়েছে।`;
        } else {
          summary = `${patientName} ${strongestLabel}-এ ধারাবাহিক মনোযোগ বজায় রেখেছেন (${strongestScore}%)। ${practiceLabel} নিয়মিত অনুশীলন করার পরামর্শ দেওয়া হলো।`;
          reason = `ইন্টারনেট ছাড়াই অন-ডিভাইস নিউরাল মডেল স্তর ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) বেছে নিয়েছে।`;
        }
        caregiverSuggestions = [
          `উত্তর দেওয়ার জন্য তাড়াহুড়ো না করে স্বস্তিদায়ক সময় দিন (গড় সময়: ${avgResponseTime} সেকেন্ড)।`,
          'ভুল সংশোধনের চেয়ে মানসিক আত্মবিশ্বাস ও প্রশান্তিকে বেশি গুরুত্ব দিন।',
          'খেলার সময়টিকে প্রিয় স্মৃতি, এক কাপ চা বা শান্ত সঙ্গীতের সাথে যুক্ত করুন।',
        ];
        break;

      case 'ne':
        if (attempts.length === 0) {
          summary = `${patientName}का लागि शान्त र रमाइलो परिचित खेलहरूबाट सुरुवात गरिएको छ। पहिलो चरणमा तह १ सिफारिस गरिएको छ।`;
          reason = `अफलाइन न्युरल मोडेलले कुनै तनाव बिना नै सुरक्षित सुरुवाती तह निर्धारण गरेको छ। इन्टरनेटको आवश्यकता छैन।`;
        } else if (isPromotion) {
          summary = `${patientName}ले ${strongestLabel}मा राम्रो आत्मविश्वास देखाउनुभएको छ (${strongestScore}%)। प्रगतिका लागि खेलको तह ${recommendedLevel}मा बढाइएको छ।`;
          reason = `अफलाइन एआई मोडेलले हालको प्रदर्शन हेरेर तह ${recommendedLevel} (${Math.round(confidence * 100)}% निश्चितता) चयन गरेको छ।`;
        } else if (isDemotion) {
          summary = `हालको खेलमा केही अलमल देखिएकाले सहजताका लागि खेलको तह ${recommendedLevel}मा मिलाइएको छ।`;
          reason = `अफलाइन मोडेलले कुनै मानसिक तनाव बिना नै सहज तह ${recommendedLevel} चयन गरेको छ।`;
        } else {
          summary = `${patientName}ले ${strongestLabel}मा स्थिर संलग्नता देखाउनुभएको छ (${strongestScore}%)। ${practiceLabel} नियमित अभ्यास गर्न सल्लाह दिइन्छ।`;
          reason = `इन्टरनेट बिना नै अन-डिभाइस मोडेलले तह ${recommendedLevel} (${Math.round(confidence * 100)}% निश्चितता) सिफारिस गरेको छ।`;
        }
        caregiverSuggestions = [
          `प्रश्नको उत्तर दिन हतार नगरी पर्याप्त समय दिनुहोस् (औसत समय: ${avgResponseTime} सेकेन्ड)।`,
          'गल्ती देखाउनुको सट्टा भावनात्मक सन्तुष्टि र आत्मविश्वासलाई महत्त्व दिनुहोस्।',
          'खेलको समयलाई चिया, पारिवारिक कुराकानी वा शान्त बाँसुरीको धुनसँग जोड्नुहोस्।',
        ];
        break;

      case 'lus':
        if (attempts.length === 0) {
          summary = `${patientName} tana hahdam thlak taka bul tan nan level 1 rawt a ni.`;
          reason = `Internet mamawh lovin on-device AI-in him takin bul tan theih nan a ruahman a ni.`;
        } else if (isPromotion) {
          summary = `${patientName}-in ${strongestLabel}-ah thiamna tha tak a hmuh tir (${strongestScore}%). Zawi zawia level ${recommendedLevel}-ah chhohtir a ni.`;
          reason = `On-device neural model-in level ${recommendedLevel} (${Math.round(confidence * 100)}% rinngamna) a thlang a ni.`;
        } else if (isDemotion) {
          summary = `Rilru buai a awm loh nan awlsam zawkin level ${recommendedLevel}-ah dah a ni.`;
          reason = `Hahthlak lova chinfel theih nan on-device model-in level ${recommendedLevel} a thlang e.`;
        } else {
          summary = `${strongestLabel}-ah inhmanhnathawh tha a la nei reng (${strongestScore}%). ${practiceLabel} zir nawn leh tura rawt a ni.`;
          reason = `Internet mamawh lovin level ${recommendedLevel} (${Math.round(confidence * 100)}%) thlan a ni.`;
        }
        caregiverSuggestions = [
          `Chhanna pe turin hmanhmawh tir lovin hun pe rawh (hun hman chawhrual: ${avgResponseTime}s).`,
          'A dik leh dik loh aiah an rilru thlamuanna ngaihpawimawh zawk rawh.',
          'Infiam hun hi chhungkaw thlalak en emaw thingpui in nen zawm kawp rawh.',
        ];
        break;

      case 'kha':
        if (attempts.length === 0) {
          summary = `Ia ${patientName} la pdiang sngewbha ha ka jingpynmlien ha ka kyrdan 1 ban ai jingshngain.`;
          reason = `Ka on-device AI ka la jied ia ka kyrdan kaba biang khlem donkam internet.`;
        } else if (isPromotion) {
          summary = `${patientName} la pyni ia ka jingtbit ha ${strongestLabel} (${strongestScore}%). Ka jingpyrshang ka kiew sha ka kyrdan ${recommendedLevel}.`;
          reason = `Ka on-device AI ka la pynbeit ia ka kyrdan ${recommendedLevel} (${Math.round(confidence * 100)}% jingthikna).`;
        } else if (isDemotion) {
          summary = `Ban nym pynshitom jingmut, la pynjem ia ka kyrdan sha ka kyrdan ${recommendedLevel}.`;
          reason = `Ka on-device AI ka la pynjem ia ka kyrdan ban ai jingjem jingmut.`;
        } else {
          summary = `${strongestLabel} ka pyni ia ka jingtrei kam ba neh (${strongestScore}%). Rawt ban bteng ha ${practiceLabel}.`;
          reason = `Khlem donkam internet, ka AI ka jied ia ka kyrdan ${recommendedLevel} (${Math.round(confidence * 100)}%).`;
        }
        caregiverSuggestions = [
          `Ai por ba pura ban jubab khlem jingkyrkieh (ka por: ${avgResponseTime}s).`,
          'Pynshngain ia ka jingmut ha ka jaka ban batai ia ki jingbakla.',
          'Pynyasoh ia kane ka por bad ka cha, ki dur ba ieid lane ki jingrwai jem.',
        ];
        break;

      case 'ny':
        if (attempts.length === 0) {
          summary = `${patientName} nam-lo albo longo shuru kam, level 1 agan tennan.`;
          reason = `Offline AI mongo dabav ma shuru kam tennan.`;
        } else if (isPromotion) {
          summary = `${patientName} ${strongestLabel}-lo albo kam le-ka (${strongestScore}%). Level ${recommendedLevel}-lo kakam.`;
          reason = `Offline AI model level ${recommendedLevel} (${Math.round(confidence * 100)}%) tennan.`;
        } else if (isDemotion) {
          summary = `${patientName} ashanti ma, level ${recommendedLevel}-lo longo kam le-ka.`;
          reason = `Offline AI albo level ${recommendedLevel} tennan.`;
        } else {
          summary = `${patientName} ${strongestLabel}-lo albo do-ka (${strongestScore}%). ${practiceLabel} romrrom kam le-ka.`;
          reason = `Internet ma offline model level ${recommendedLevel} (${Math.round(confidence * 100)}%) tennan.`;
        }
        caregiverSuggestions = [
          `Agan pennam samay go-ka (samay: ${avgResponseTime}s).`,
          'Bhul ma, mongo shanti albo le-ka.',
          'Kam samay cha do bemin sur tatka.',
        ];
        break;

      case 'trp':
        if (attempts.length === 0) {
          summary = `${patientName}-নি বাগৈ সান্ত্বনা তেই কাহাম লামায় লেভেল ১-ও সামুং শুরু খালাইখা।`;
          reason = `অফলাইন AI কোনো চাপ কুরুই প্রাথমিক স্তর নির্ধারণ খালাইখা। ইন্টারনেট দরকার কুরুই।`;
        } else if (isPromotion) {
          summary = `${patientName} ${strongestLabel}-ও কাহাম দক্ষতা তিন্তিখা (${strongestScore}%)। লেভেল ${recommendedLevel}-ও বৃদ্ধি খালাইখা।`;
          reason = `অফলাইন AI মডেল লেভেল ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) রপখা।`;
        } else if (isDemotion) {
          summary = `খাপাং দ্বিধাবোধ কুরুই খ্লাইমানি বাগৈ লেভেল ${recommendedLevel}-ও মানি তনখা।`;
          reason = `অফলাইন AI শান্তিময় লেভেল ${recommendedLevel} বাছিখা।`;
        } else {
          summary = `${patientName} ${strongestLabel}-ও সমান মনোযোগ তংগো (${strongestScore}%)। ${practiceLabel} সালব্রুম খ্লাইমানি পরামর্শ রিখা।`;
          reason = `ইন্টারনেট কুরুই অন-ডিভাইস মডেল লেভেল ${recommendedLevel} (${Math.round(confidence * 100)}%) বাছিখা।`;
        }
        caregiverSuggestions = [
          `কক সাকাপ তাড়াহুড়া তা খ্লাই, সময় রিদি (সময়: ${avgResponseTime}s)।`,
          'ভুল না সাফারিখা খাপাংনি শান্তিনো মূল গুরুত্ব রিদি।',
          'সামুংনি সমায়ো চিনাকি ফটো, চা তেই রিমাউই বাই লগে থনদি।',
        ];
        break;

      case 'mni':
        if (attempts.length === 0) {
          summary = `${patientName}ꯒꯤ ꯅꯨꯡꯉꯥꯏꯅ ꯁꯥꯟꯅ-ꯈꯣꯠꯅꯅꯕ ꯊꯥꯛ ১ ꯄꯥꯎꯇꯥꯛ ꯄꯤꯔꯤ꯫`;
          reason = `ꯑꯣꯐꯂꯥꯏꯟ AI ꯃꯣꯗꯦꯜꯅ ꯏꯟꯇꯔꯅꯦꯠ ꯌꯥꯎꯗꯅ ꯂꯥꯏꯕ ꯊꯥꯛ ১ ꯈꯟꯒꯠꯂꯦ꯫`;
        } else if (isPromotion) {
          summary = `${patientName}ꯅ ${strongestLabel}-ꯗ ꯑꯐꯕ ꯊꯧꯅꯥ ꯎꯠꯂꯦ (${strongestScore}%)꯫ ꯊꯥꯛ ${recommendedLevel}-ꯗ ꯀꯥꯈꯠꯍꯜꯂꯦ꯫`;
          reason = `ꯑꯣꯐꯂꯥꯏꯟ ꯅꯤꯎꯔꯦꯜ ꯃꯣꯗꯦꯜꯅ ꯍꯧꯖꯤꯛꯀꯤ ꯐꯤꯚꯝ ꯌꯦꯡꯂꯒ ꯊꯥꯛ ${recommendedLevel} (${Math.round(confidence * 100)}% ꯊꯥꯖꯕ) ꯈꯟꯂꯦ꯫`;
        } else if (isDemotion) {
          summary = `ꯋꯥꯈꯜ ꯋꯥꯕ ꯍꯟꯊꯍꯟꯅꯕ ꯁꯥꯟꯅꯕꯒꯤ ꯊꯥꯛ ${recommendedLevel}-ꯗ ꯍꯟꯊꯍꯜꯂꯦ꯫`;
          reason = `ꯑꯣꯐꯂꯥꯏꯟ AI ꯃꯣꯗꯦꯜꯅ ꯅꯨꯡꯉꯥꯏꯕ ꯑꯣꯏꯍꯟꯅꯕ ꯊꯥꯛ ${recommendedLevel} ꯈꯟꯂꯦ꯫`;
        } else {
          summary = `${patientName}ꯅ ${strongestLabel}-ꯗ ꯂꯦꯡꯗꯕ ꯊꯧꯅꯥ ꯎꯠꯂꯦ (${strongestScore}%)꯫ ${practiceLabel} ꯆꯥꯡ ꯅꯥꯏꯅ ꯇꯧꯕꯤꯌꯨ꯫`;
          reason = `ꯏꯟꯇꯔꯅꯦꯠ ꯌꯥꯎꯗꯅ ꯑꯣꯟ-ꯗꯤꯚꯥꯏꯁ ꯃꯣꯗꯦꯜꯅ ꯊꯥꯛ ${recommendedLevel} (${Math.round(confidence * 100)}%) ꯄꯥꯎꯇꯥꯛ ꯄꯤꯔꯤ꯫`;
        }
        caregiverSuggestions = [
          `ꯄꯥꯎꯈꯨꯝ ꯄꯤꯕꯗ ꯈꯔ ꯃꯇꯝ ꯄꯤꯕꯤꯌꯨ (ꯆꯥꯡꯆꯠ ꯃꯇꯝ: ${avgResponseTime}s)꯫`,
          'ꯑꯁꯣꯏꯕ ꯇꯥꯛꯄꯗꯒꯤ ꯄꯨꯛꯅꯤꯡꯒꯤ ꯅꯨꯡꯉꯥꯏꯕ ꯑꯃꯁꯨꯡ ꯊꯧꯅꯥ ꯄꯤꯕꯕꯨ ꯃꯔꯨꯑꯣꯏꯍꯟꯕꯤꯌꯨ꯫',
          'ꯁꯥꯟꯅ-ꯈꯣꯠꯅꯕꯒꯤ ꯃꯇꯝ ꯑꯁꯤ ꯏꯃꯨꯡꯒꯤ ꯐꯣꯇꯣ, ꯆꯥ ꯊꯛꯄ ꯅꯠꯇ꯭ꯔꯒ ꯇꯞꯄ ꯏꯁꯩꯒ ꯄꯨꯟꯁꯤꯟꯕꯤꯌꯨ꯫',
        ];
        break;

      default: // 'en'
        if (attempts.length === 0) {
          summary = `Welcome to Memora. Initial gentle activities at Level 1 recommended to build comfort and familiarity for ${patientName}.`;
          reason = `On-device neural network initialized safe starting levels without requiring internet connection.`;
        } else if (isPromotion) {
          summary = `${patientName} demonstrates strong engagement and steady confidence in ${strongestLabel} (${strongestScore}%). The local cognitive model gently progressed challenge to Level ${recommendedLevel}.`;
          reason = `Local on-device neural model selected Level ${recommendedLevel} (${Math.round(confidence * 100)}% certainty) without needing internet or cloud APIs.`;
        } else if (isDemotion) {
          summary = `Mild hesitation detected during recent sessions. Difficulty was automatically simplified to Level ${recommendedLevel} to prevent frustration and preserve comfort.`;
          reason = `On-device cognitive model automatically eased challenge to Level ${recommendedLevel} (${Math.round(confidence * 100)}% confidence).`;
        } else {
          summary = `${strongestLabel} shows consistent engagement (${strongestScore}%). Continued gentle practice in ${practiceLabel} will maintain reassuring cognitive stimulation.`;
          reason = `Local on-device neural model selected Level ${recommendedLevel} (${Math.round(confidence * 100)}% certainty) without needing internet or cloud APIs.`;
        }
        caregiverSuggestions = [
          `Allow comfortable unhurried time for answering questions (current average: ${avgResponseTime}s).`,
          'Validate emotional comfort rather than accuracy; avoid pointing out mistakes.',
          'Pair short gameplay sessions with soothing family memories, tea, or gentle traditional flute melodies.',
        ];
        break;
    }

    return {
      summary,
      strongestArea: strongestLabel,
      practiceArea: practiceLabel,
      recommendedActivity,
      recommendedLevel,
      reason,
      caregiverSuggestions,
      confidence,
      disclaimer: DISCLAIMER_MAP[lang] || DISCLAIMER_MAP.en,
      isAiPowered: true,
    };
  }
}
