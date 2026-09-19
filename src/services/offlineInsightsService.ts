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
  lus: "मेमोरा रौतना ही इन्फिअमना अतंङ्गा बुअत्सैह अ नी अ, पुइह्वौम्ना मै अ नी, डॉक्टर एन्कौलना अइअह अ ह्मान थैह लोह।",
  kha: "কি জিংব্থাহ মেমোরা কি লং তাং বান প্যনশঙাইন, কিম দেই কা জিংসুমার ডক্টর।",
  ny: "मेमोरा अगन हिए गेन्नम कापे, डॉक्टर कापे मा।",
  trp: "মেমোরানি পরামর্শ সামুং খ্লাইমানি ওপর নির্ভর, অ ডাক্তরনি রিপোর্ট নয়া।",
};

const SKILL_LABELS: Record<CognitiveSkillId, Record<Language, string>> = {
  recall: {
    en: 'Routine Recall',
    as: 'ৰুটিন সোঁৱৰণ',
    bn: 'রুটিন স্মরণ',
    ne: 'दैनिक तालिका स्मरण',
    lus: 'नीतीन थिल ह्रिअत्छुअह',
    kha: 'ক্যনমাব য়া কা রুকম ইম',
    ny: 'रोमर्रोम मित-नाम',
    trp: 'নিয়ম উয়ানসুমা',
  },
  recognition: {
    en: 'Familiar Recognition',
    as: 'চিনাকি মুখ আৰু মাত',
    bn: 'পরিচিত মুখ ও কণ্ঠ',
    ne: 'चिनजान पहिचान',
    lus: 'ह्मेल्ह्रिअत ह्रिअत्फिअहना',
    kha: 'ইথুহ য়া কিবা ঈইত',
    ny: 'मोंगो सि-नाम',
    trp: 'চিনাকি বরোক সিমা',
  },
  associative_memory: {
    en: 'Family Connections',
    as: 'সম্পৰ্ক চিনাক্তকৰণ',
    bn: 'পারিবারিক সম্পর্ক',
    ne: 'पारिवारिक सम्बन्ध',
    lus: 'च्छुंगकौ इन्लैचिन्न',
    kha: 'কা জিংইয়াদেই কুর',
    ny: 'अकम दो-नाम',
    trp: 'নখরোনি সম্পর্ক',
  },
  problem_solving: {
    en: 'Visual Puzzle Solving',
    as: 'ছবিৰ সাঁথৰ সমাধান',
    bn: 'চিত্র ধাঁধা সমাধান',
    ne: 'तस्विर पजल समाधान',
    lus: 'थ्लालाक पज़ल च्हींफेल',
    kha: 'ওয়াদ বুইত য়া কি দুর',
    ny: 'एलेक पेन्नाम',
    trp: 'ফটোনি পাজল সুংমা',
  },
  categorization: {
    en: 'Object Categorization',
    as: 'বস্তুৰ শ্ৰেণী বিভাজন',
    bn: 'বস্তুর শ্রেণিবিভাগ',
    ne: 'वस्तु वर्गीकरण',
    lus: 'थिल ह्रांग लाकच्छुअह',
    kha: 'জিয়েদ য়া কিবা ফের',
    ny: 'आचिंग दो-नाम',
    trp: 'জিনিস সিমুং',
  },
  visual_spatial: {
    en: 'Shape & Spatial Awareness',
    as: 'আকৃতি চিনাক্তকৰণ',
    bn: 'আকৃতি ও স্থানিক ধারণা',
    ne: 'आकार र स्थान पहिचान',
    lus: 'ह्मून लेह पिअनह्मंग ह्रिअत्ना',
    kha: 'কা জিংথেও দুর',
    ny: 'अपुन सि-नाम',
    trp: 'আকার তেই জায়া সিমা',
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
          summary = `${patientName} ताना हा्हदाम थ्लाक ताका बुल तान नान कैलौन १ रौत अ नी।`;
          reason = `इंटरनेट मामौह लोविन ऑन-डिवाइस AI-इन हीम ताकिन बुल तान थैह नान अ रुअह्मैन अ नी।`;
        } else if (isPromotion) {
          summary = `${patientName}-इन ${strongestLabel}-आह थिअमना था तक अ ह्मूह तीर (${strongestScore}%)। ज़ौइ ज़ौइइन कैलौन ${recommendedLevel}-आह च्छोह्तीर अ नी।`;
          reason = `ऑन-डिवाइस न्यूरल मॉडल-इन कैलौन ${recommendedLevel} (${Math.round(confidence * 100)}% रीन्नगामना) अ थ्लांग अ नी।`;
        } else if (isDemotion) {
          summary = `रील्रु बुआई अ औम लोह नान औलसम ज़ौकिन कैलौन ${recommendedLevel}-आह दाह अ नी।`;
          reason = `हाहतक लोवा च्हींफेल थैह नान ऑन-डिवाइस मॉडल-इन कैलौन ${recommendedLevel} अ थ्लांग ए।`;
        } else {
          summary = `${strongestLabel}-आह इन्ह्मन्ना था अ ला नै रेंग (${strongestScore}%)। ${practiceLabel} ज़िर नौन लेह तूरा रौत अ नी।`;
          reason = `इंटरनेट मामौह लोविन कैलौन ${recommendedLevel} (${Math.round(confidence * 100)}%) थ्लान अ नी।`;
        }
        caregiverSuggestions = [
          `च्छान्ना पे तूfacedrin ह्मान्ह्मावह तीर लोविन हून पे रौह (हून ह्मान चौहरुअल: ${avgResponseTime}s)।`,
          'अ दीक लेহ दीक लोহ अइइन अन रील्रु थ्लामुअन्ना गाइহপৌइमौহ ज़ौक रौহ।',
          'इन्फिअम हून ही च्हुंगकौ थ्लालाक एन एमाव थिंगपुई इन नेन ज़ौम कौप रौহ।',
        ];
        break;

      case 'kha':
        if (attempts.length === 0) {
          summary = `য়া ${patientName} লা প্দিয়াং স্ঙেওভা হা কা জিংপ্যনম্লিয়েন হা কা ক্যরদান ১ বান আই জিংশঙাইন।`;
          reason = `কা অন-ডিভাইস AI কা লা জিয়েদ য়া কা ক্যরদান কাবা বিয়াং খ্লেম দনকাম ইন্টারনেট।`;
        } else if (isPromotion) {
          summary = `${patientName} লা প্যনি য়া কা জিংতবিত হা ${strongestLabel} (${strongestScore}%)। কা জিংপ্যরশাং কা কিয়েও শা কা ক্যরদান ${recommendedLevel}।`;
          reason = `কা অন-ডিভাইস AI কা লা প্যনবেইত য়া কা ক্যরদান ${recommendedLevel} (${Math.round(confidence * 100)}% জিংথিকনা)।`;
        } else if (isDemotion) {
          summary = `বান ন্যম প্যনশিতম জিংমুত, লা প্যনজেম য়া কা ক্যরদান শা কা ক্যরদান ${recommendedLevel}।`;
          reason = `কা অন-ডিভাইস AI কা লা প্যনজেম য়া কা ক্যরদান বান আই জিংজেম জিংমুত।`;
        } else {
          summary = `${strongestLabel} কা প্যনি য়া কা জিংত্রেই কাম বা নেহ (${strongestScore}%)। রওত বান ব্তেং হা ${practiceLabel}।`;
          reason = `খ্লেম দনকাম ইন্টারনেট, কা AI কা জিয়েদ য়া কা ক্যরদান ${recommendedLevel} (${Math.round(confidence * 100)}%)।`;
        }
        caregiverSuggestions = [
          `আই পোর বা পুরা বান জুবাব খ্লেম জিংক্যরকিয়েহ (কা পোর: ${avgResponseTime}s)।`,
          'প্যনশঙাইন য়া কা জিংমুত হা কা জাকা বান বাতাই য়া কি জিংবাকলা।',
          'প্যনয়াসোহ য়া কানে কা পোর বাদ কা চা, কি দুর বা ঈইত লানে কি জিংর্বাই জেম।',
        ];
        break;

      case 'ny':
        if (attempts.length === 0) {
          summary = `${patientName} नम-लो अल्बो लोंगो शुरू कम, लेवल 1 अगन तेन्नान।`;
          reason = `ऑफलाइन AI मोंगो दबाव मा शुरू कम तेन्नान।`;
        } else if (isPromotion) {
          summary = `${patientName} ${strongestLabel}-लो अल्बो काम ले-का (${strongestScore}%)। लेवल ${recommendedLevel}-लो ककम।`;
          reason = `ऑफलाइन AI मॉडल लेवल ${recommendedLevel} (${Math.round(confidence * 100)}%) तेन्नान।`;
        } else if (isDemotion) {
          summary = `${patientName} अशांति मा, लेवल ${recommendedLevel}-लो लोंगो कम ले-का।`;
          reason = `ऑफलाइन AI अल्बो लेवल ${recommendedLevel} तेन्नान।`;
        } else {
          summary = `${patientName} ${strongestLabel}-लो अल्बो दो-का (${strongestScore}%)। ${practiceLabel} रोमर्रोम कम ले-का।`;
          reason = `इंटरनेट मा ऑफलाइन मॉडल लेवल ${recommendedLevel} (${Math.round(confidence * 100)}%) तेन्नान।`;
        }
        caregiverSuggestions = [
          `अगन पेन्नाम समय गो-का (समय: ${avgResponseTime}s)।`,
          'भूल मा, मोंगो शांति अल्बो ले-का।',
          'कम समय चा दो बेमिन सुर तात्का।',
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
