import { Patient, FamilyMember, RoutineItem, FavoriteMusic, CaregiverGuidanceTip, Language } from '../types';

// Dementia-friendly SVG avatars for family members
export const createAvatarSvg = (name: string, role: string, bgColor: string, hairColor: string, detailColor: string) => {
  const initials = name.split(' ').map(n => n[0]).join('');
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${bgColor}" stop-opacity="1" />
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <rect width="300" height="300" rx="36" fill="url(#bg)" />
  
  <!-- Subtle decorative motif -->
  <circle cx="250" cy="50" r="40" fill="#ffffff" opacity="0.15" />
  <circle cx="50" cy="250" r="60" fill="#ffffff" opacity="0.1" />

  <!-- Body / Shoulders -->
  <path d="M 60 270 C 60 210, 100 190, 150 190 C 200 190, 240 210, 240 270 Z" fill="${detailColor}" />
  
  <!-- Collar / Traditional scarf accent -->
  <path d="M 120 190 L 150 220 L 180 190 Z" fill="#ffffff" opacity="0.9" />

  <!-- Head -->
  <circle cx="150" cy="135" r="55" fill="#FBD5B5" />
  
  <!-- Hair -->
  <path d="M 95 130 C 95 70, 205 70, 205 130 C 190 100, 110 100, 95 130 Z" fill="${hairColor}" />

  <!-- Smiling Eyes -->
  <path d="M 125 130 Q 133 124 141 130" stroke="#333333" stroke-width="3.5" fill="none" stroke-linecap="round" />
  <path d="M 159 130 Q 167 124 175 130" stroke="#333333" stroke-width="3.5" fill="none" stroke-linecap="round" />

  <!-- Gentle Smile -->
  <path d="M 134 154 Q 150 168 166 154" stroke="#A63A2B" stroke-width="4" fill="none" stroke-linecap="round" />

  <!-- Warm Rosy Cheeks -->
  <circle cx="120" cy="148" r="8" fill="#F472B6" opacity="0.35" />
  <circle cx="180" cy="148" r="8" fill="#F472B6" opacity="0.35" />

  <!-- Label Banner at bottom -->
  <rect x="25" y="240" width="250" height="42" rx="21" fill="#ffffff" opacity="0.95" />
  <text x="150" y="267" font-family="system-ui, sans-serif" font-size="17" font-weight="bold" fill="#1e293b" text-anchor="middle">
    ${name}
  </text>
</svg>
  `)}`;
};

// Generate realistic WAV Audio Data URL for speech tones / gentle spoken melody preview
export function generateVoiceAudioDataUrl(frequency: number = 320, durationSeconds: number = 2.5): string {
  // Generates an audio tone simulating a soothing greeting wave
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format
  view.setUint16(20, 1, true); // Mono
  view.setUint16(22, 1, true); // Channels = 1
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write samples with harmonic warmth
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Modulation envelope
    const envelope = Math.sin((Math.PI * i) / numSamples);
    // Warm soothing voice-like vocal tone
    const sample = (
      Math.sin(2 * Math.PI * frequency * t) * 0.6 +
      Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.25 +
      Math.sin(2 * Math.PI * (frequency * 2) * t) * 0.15
    ) * envelope * 0.45;

    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export const INITIAL_PATIENT: Patient = {
  id: 'patient-ramesh-1',
  name: 'Ramesh Chandra Baruah',
  age: 72,
  dementiaType: "Alzheimer's Disease (Early-to-Mild)",
  dementiaStage: 'mild',
  preferredLanguage: 'as',
  notes: 'Enjoys morning tea outdoors, traditional Assamese flute and Borgeet, and photos of his grandchildren.',
  createdAt: new Date().toISOString(),
};

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-sunita',
    patientId: 'patient-ramesh-1',
    name: 'Sunita Baruah',
    relationship: 'Daughter',
    relationshipAs: 'জীয়াৰী (কন্যা)',
    photoUrl: createAvatarSvg('Sunita (Daughter)', 'Daughter', '#7BA887', '#231B15', '#A23B2A'),
    voiceTranscriptEn: 'Hi Dad, it is Sunita! Did you take your morning tea? I will visit you soon!',
    voiceTranscriptAs: 'দেউতা, মই আপোনাৰ মৰমৰ সুনীতা। আপুনি পুৱাৰ চাহ খালে নে? মই সোনকালে আহিম দেই!',
    voiceAudioUrl: generateVoiceAudioDataUrl(380, 3.2),
  },
  {
    id: 'fam-priyam',
    patientId: 'patient-ramesh-1',
    name: 'Priyam Baruah',
    relationship: 'Grandson',
    relationshipAs: 'নাতি (মৰমৰ নাতি)',
    photoUrl: createAvatarSvg('Priyam (Grandson)', 'Grandson', '#E5A96A', '#3C2818', '#2563EB'),
    voiceTranscriptEn: 'Grandpa, it is Priyam! Today we both will go for a walk in the garden, okay?',
    voiceTranscriptAs: 'ককা, মই প্ৰিয়ম! আজি আমি দুয়ো ফুলনিত খোজ কাঢ়িবলৈ যাম দেই।',
    voiceAudioUrl: generateVoiceAudioDataUrl(480, 2.8),
  },
  {
    id: 'fam-dipankar',
    patientId: 'patient-ramesh-1',
    name: 'Dipankar Baruah',
    relationship: 'Son',
    relationshipAs: 'পুত্ৰ',
    photoUrl: createAvatarSvg('Dipankar (Son)', 'Son', '#5B86A4', '#1E293B', '#15803D'),
    voiceTranscriptEn: 'Dad, this is Dipankar. Take your medicines on time, everything is well at home.',
    voiceTranscriptAs: 'দেউতা, মই দীপংকৰ। চিন্তা নকৰিব, ঔষধখিনি মন দি খাব, সকলো ভালে আছে।',
    voiceAudioUrl: generateVoiceAudioDataUrl(290, 3.0),
  },
  {
    id: 'fam-manju',
    patientId: 'patient-ramesh-1',
    name: 'Manju Baruah',
    relationship: 'Wife',
    relationshipAs: 'পত্নী',
    photoUrl: createAvatarSvg('Manju (Wife)', 'Wife', '#9F7AEA', '#4A5568', '#C53030'),
    voiceTranscriptEn: 'Namaskar Ramesh, let us sit together and enjoy the evening breeze.',
    voiceTranscriptAs: 'নমস্কাৰ, মই মঞ্জু। চাহ খাই লওকচোন, চোতালৰ বতাহখিনি বৰ শান্ত।',
    voiceAudioUrl: generateVoiceAudioDataUrl(340, 3.1),
  },
];

export const INITIAL_ROUTINES: RoutineItem[] = [
  {
    id: 'routine-1',
    patientId: 'patient-ramesh-1',
    time: '07:30 AM',
    period: 'morning',
    titleEn: 'Morning Tea & Fresh Garden Air',
    titleAs: 'পুৱাৰ চাহ আৰু ফুলনিৰ বতাহ',
    icon: 'coffee',
    order: 1,
    completed: true,
  },
  {
    id: 'routine-2',
    patientId: 'patient-ramesh-1',
    time: '08:30 AM',
    period: 'morning',
    titleEn: 'Morning Bath & Fresh Clothes',
    titleAs: 'গা ধোৱা আৰু পৰিষ্কাৰ কাপোৰ',
    icon: 'shower',
    order: 2,
    completed: true,
  },
  {
    id: 'routine-3',
    patientId: 'patient-ramesh-1',
    time: '09:30 AM',
    period: 'morning',
    titleEn: 'Breakfast & Morning Medicine',
    titleAs: 'পুৱাৰ আহাৰ আৰু ঔষধ',
    icon: 'pill',
    order: 3,
    completed: false,
  },
  {
    id: 'routine-4',
    patientId: 'patient-ramesh-1',
    time: '01:30 PM',
    period: 'afternoon',
    titleEn: 'Lunch with Family',
    titleAs: 'পৰিয়ালৰ সৈতে দুপৰীয়াৰ আহাৰ',
    icon: 'utensils',
    order: 4,
    completed: false,
  },
  {
    id: 'routine-5',
    patientId: 'patient-ramesh-1',
    time: '04:30 PM',
    period: 'afternoon',
    titleEn: 'Afternoon Walk in Veranda',
    titleAs: 'আবেলি বাৰান্দাত খোজ কঢ়া',
    icon: 'footprints',
    order: 5,
    completed: false,
  },
  {
    id: 'routine-6',
    patientId: 'patient-ramesh-1',
    time: '06:30 PM',
    period: 'evening',
    titleEn: 'Evening Prayer & Calm Music',
    titleAs: 'সন্ধিয়াৰ প্ৰাৰ্থনা আৰু শান্ত সংগীত',
    icon: 'sparkles',
    order: 6,
    completed: false,
  },
];

export const ROUTINE_ITEM_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'routine-1': {
    en: 'Morning Tea & Fresh Garden Air',
    as: 'পুৱাৰ চাহ আৰু ফুলনিৰ বতাহ',
    bn: 'সকালের চা ও বাগানের তাজা বাতাস',
    ne: 'बिहानको चिया र बगैंचाको ताजा हावा',
    lus: 'ज़िंग Thingpui इन ले हुआन Boruak',
    kha: 'চা স্তেপ বদ কা ল্যর বা খিয়িদ',
    ny: 'रोमर्रोम चा दो अकम अले',
    trp: 'ফুংনি চা অং বাগানি বার',
  },
  'routine-2': {
    en: 'Morning Bath & Fresh Clothes',
    as: 'গা ধোৱা আৰু পৰিষ্কাৰ কাপোৰ',
    bn: 'স্নান করা ও পরিষ্কার পোশাক',
    ne: 'बिहानको स्नान र सफा लुगा',
    lus: 'ज़िंग bual in ले पुआन थार',
    kha: 'সুম স্তেপ বদ কা জেইন বা সাবা',
    ny: 'रोमर्रोम हु-नाम दो अले इजिंग',
    trp: 'ফুংনি মাইরম অং বৗসৗং কুথার',
  },
  'routine-3': {
    en: 'Breakfast & Morning Medicine',
    as: 'পুৱাৰ আহাৰ আৰু ঔষধ',
    bn: 'সকালের খাবার ও ওষুধ',
    ne: 'बिहानको खाजा र औषधि',
    lus: 'ज़िंग Tukṭhuan ले Damdawi',
    kha: 'বাম স্তেপ বদ কা দাওয়াই',
    ny: 'रोमर्रोम दो-नाम दो सि-नाम',
    trp: 'ফুংনি চামুং অং সমাই',
  },
  'routine-4': {
    en: 'Lunch with Family',
    as: 'পৰিয়ালৰ সৈতে দুপৰীয়াৰ আহাৰ',
    bn: 'পরিবারের সাথে দুপুরের খাবার',
    ne: 'परिवारसँग दिउँसोको खाना',
    lus: 'छुन Chaw Chhungkua nen',
    kha: 'বাম স্ঙী বদ কা কুর',
    ny: 'अन्यिंग दो लोंगो दो-नाम',
    trp: 'নখরম কৗথার দুপরনি চামুং',
  },
  'routine-5': {
    en: 'Afternoon Walk in Veranda',
    as: 'আবেলি বাৰান্দাত খোজ কঢ়া',
    bn: 'বিকেলে বারান্দায় হাঁটা',
    ne: 'दिउँसो बरण्डामा हिँड्ने',
    lus: 'त्लाई Veranda-ah kal kual',
    kha: 'য়াইদ শারু কা বারান্দা',
    ny: 'लोंगो दोलो चाक-नाम',
    trp: 'বারান্দাত লামচা হিমা',
  },
  'routine-6': {
    en: 'Evening Prayer & Calm Music',
    as: 'সন্ধিয়াৰ প্ৰাৰ্থনা আৰু শান্ত সংগীত',
    bn: 'সন্ধ্যার প্রার্থনা ও শান্ত সুর',
    ne: 'साँझको प्रार्थना र शान्त संगीत',
    lus: 'त्लाई ṭawngṭaina ले rimawi',
    kha: 'দোয়াই জানমিয়েত বদ সুর বা জারজর',
    ny: 'दोलो दो-नाम दो बेमिन',
    trp: 'সানজানি পুজা অং রিমাউই',
  },
};

export const getRoutineItemTitle = (item: RoutineItem, lang: Language): string => {
  if (item.id && ROUTINE_ITEM_TRANSLATIONS[item.id]?.[lang]) {
    return ROUTINE_ITEM_TRANSLATIONS[item.id][lang];
  }
  if (lang === 'en') return item.titleEn || item.titleAs;
  if (lang === 'as') return item.titleAs || item.titleEn;
  return item.titleAs || item.titleEn;
};

export interface FamilyMemberLanguageData {
  relationship: Record<Language, string>;
  transcript: Record<Language, string>;
}

export const FAMILY_MEMBER_TRANSLATIONS: Record<string, FamilyMemberLanguageData> = {
  'fam-sunita': {
    relationship: {
      en: 'Daughter',
      as: 'জীয়াৰী',
      bn: 'কন্যা',
      ne: 'छोरी',
      ny: 'अन्यी',
      lus: 'फापु',
      kha: 'খুন ক্যনথেই',
      trp: 'বৗচৗক',
    },
    transcript: {
      en: 'Hi Dad, it is Sunita! Did you take your morning tea? I will visit you soon!',
      as: 'দেউতা, মই আপোনাৰ মৰমৰ সুনীতা। আপুনি পুৱাৰ চাহ খালে নে? মই সোনকালে আহিম দেই!',
      bn: 'বাবা, আমি সুনীতা! সকালের চা খেয়েছো? আমি তাড়াতাড়ি দেখা করতে আসবো!',
      ne: 'बुबा, म सुनिता हुँ! बिहानको चिया खानुभयो? म छिट्टै भेट्न आउँछु!',
      ny: 'अबा, ङो सुनीती! रोमर्रोम चा दो-का? ङो एला आर।',
      lus: 'का पा, केइमा सुनिता! ज़िङ्ग थिंगपुई इन इन ताव एम्? क लो काल्लेंग ङ्गइ दोह्न।',
      kha: 'পা, ঙা সুব সুনীতা! লা দিয়িহ চা স্টেপ? ঙা ন সমি বানে।',
      trp: 'আপা, আং সুনীতা! ফুংনি চা নুংখা? আং খাসালোন ফাইদি।',
    },
  },
  'fam-priyam': {
    relationship: {
      en: 'Grandson',
      as: 'নাতি',
      bn: 'নাতি',
      ne: 'नाति',
      ny: 'अचु',
      lus: 'तु',
      kha: 'খুন খসিউ',
      trp: 'চুয়াই',
    },
    transcript: {
      en: 'Grandpa, it is Priyam! Today we both will go for a walk in the garden, okay?',
      as: 'ককা, মই প্ৰিয়ম! আজি আমি দুয়ো ফুলনিত খোজ কাঢ়িবলৈ যাম দেই।',
      bn: 'দাদু, আমি প্রিয়ম! আজ আমরা দুজনে বাগানে হাঁটতে যাবো, ঠিক আছে?',
      ne: 'हजुरबुबा, म प्रियम! आज हामी दुवै बगैंचामा घुम्न जानेछौं, हुन्छ?',
      ny: 'आतो, ङो प्रियम! लोंगो ङो-नो चाक-नाम ले-का।',
      lus: 'पुपु, केइमा प्रियम! वौइन चुआन हुआन-अह क इन्तीह्रुअन दोह्न।',
      kha: 'ক্নাও, ঙা প্রিয়ম! মিস্তা ঙী ন লাইদ শারু কা বারান্দা।',
      trp: 'আচু, আং প্রিয়ম! তিনী চুক বাগানো লামচা হিনো।',
    },
  },
  'fam-dipankar': {
    relationship: {
      en: 'Son',
      as: 'পুত্ৰ',
      bn: 'পুত্র',
      ne: 'छोरा',
      ny: 'अउ',
      lus: 'फपा',
      kha: 'খুন শিনরাং',
      trp: 'বৗচলা',
    },
    transcript: {
      en: 'Dad, this is Dipankar. Take your medicines on time, everything is well at home.',
      as: 'দেউতা, মই দীপংকৰ। চিন্তা নকৰিব, ঔষধখিনি মন দি খাব, সকলো ভালে আছে।',
      bn: 'বাবা, আমি দীপঙ্কর। সময়মতো ওষুধ খাবেন, বাড়ির সবাই ভালো আছে।',
      ne: 'बुबा, म दिपङ्कर हुँ। समयमा औषधि खानुहोला, घरमा सबै ठीक छ।',
      ny: 'अबा, ङो दीपंकर! सि-नाम दो-का, नम-लो अल्बो।',
      lus: 'का पा, दीपङ्कर क नी। दमदवी ईन थ्याप रौह, ईन लाम चुआन थिल ज़ोज़ैत अ ṭहा।',
      kha: 'পা, ঙা দীপঙ্কর। বাম কা দাওয়াই পর, হা ইং বরোহ বা লা য়িদ।',
      trp: 'আপা, আং দীপঙ্কর। সমাই চাদি, নখরো বরোক কাহাম।',
    },
  },
  'fam-manju': {
    relationship: {
      en: 'Wife',
      as: 'পত্নী',
      bn: 'স্ত্রী',
      ne: 'श्रीमती',
      ny: 'अन्यिंग',
      lus: 'नूपी',
      kha: 'ত্যঙ্গা',
      trp: 'বিহিক',
    },
    transcript: {
      en: 'Namaskar Ramesh, let us sit together and enjoy the evening breeze.',
      as: 'নমস্কাৰ, মই মঞ্জু। চাহ খাই লওকচোন, চোতালৰ বতাহখিনি বৰ শান্ত।',
      bn: 'নমস্কার রমেশ, এসো একসাথে বসি আর শান্ত বাতাস উপভোগ করি।',
      ne: 'नमस्ते रमेश, सँगै बसेर साँझको हावाको आनन्द लिऊँ।',
      ny: 'अल्बो रमेश, ङो मंजु! दोलो बेमिन तात्का।',
      lus: 'छिबाइ रमेश, केइमा मञ्जु! त्लाई हून-अह थु दुआंग अङ्ग।',
      kha: 'খুবলে রমেশ, ঙা মঞ্জু! শং হাদিয়েন হা কা স্ঙাপ।',
      trp: 'খুলুমখা রমেশ, আং মঞ্জু! সানজানি বারো বচাদি।',
    },
  },
  'fam-kavita': {
    relationship: {
      en: 'Sister',
      as: 'ভনী',
      bn: 'বোন',
      ne: 'बहिनी',
      ny: 'अमी',
      lus: 'फर्णु',
      kha: 'প্যনগো',
      trp: 'বৗবুক',
    },
    transcript: {
      en: 'Hello Ramesh, this is Kavita speaking!',
      as: 'নমস্কাৰ ৰমেশ, মই কবিতা বাইদেউ!',
      bn: 'নমস্কার রমেশ, আমি কবিতা বলছি!',
      ne: 'नमस्ते रमेश, म कविता बोल्दैछु!',
      ny: 'अल्बो रमेश, ङो कविता!',
      lus: 'छिबाइ रमेश, कविता क नी ए!',
      kha: 'খুবলে রমেশ, ঙা কবিতা বা kren!',
      trp: 'খুলুমখা রমেশ, আং কবিতা কক সাগো!',
    },
  },
  'fam-biren': {
    relationship: {
      en: 'Brother',
      as: 'ভাই',
      bn: 'ভাই',
      ne: 'भाइ',
      ny: 'अचिंग',
      lus: 'उनाउपा',
      kha: 'হিম্পারা',
      trp: 'তাকলায়',
    },
    transcript: {
      en: 'Ramesh brother, good to see you!',
      as: 'ৰমেশ ভাই, সকলো ভালে আছে নে!',
      bn: 'রমেশ ভাই, কেমন আছো, সবাই ভালো তো!',
      ne: 'रमेश भाइ, कस्तो छ तिमीलाई, सबै ठीक छ नि!',
      ny: 'अल्बो रमेश, ङो बीरेन!',
      lus: 'रमेश उनाउ, इन हमुह अ va ṭha वे!',
      kha: 'রমেশ পারা, সঙাপ বা য়িদ বরোহ!',
      trp: 'রমেশ বাই, নুকমানি কাহাম খালাংখা!',
    },
  },
  'fam-anita': {
    relationship: {
      en: 'Daughter-in-law',
      as: 'বোৱাৰী',
      bn: 'বৌমা',
      ne: 'बुहारी',
      ny: 'अंगु',
      lus: 'मओ',
      kha: 'খুন কোরুং',
      trp: 'বৗহুক',
    },
    transcript: {
      en: 'Namaskar Deuta, tea is ready.',
      as: 'নমস্কাৰ দেউতা, চাহ তৈয়াৰ হৈছে।',
      bn: 'নমস্কার বাবা, চা তৈরি হয়েছে।',
      ne: 'नमस्ते बुबा, चिया तयार भयो।',
      ny: 'अल्बो अबा, चा अल्बो।',
      lus: 'छिबाइ का पा, थिंगपुई अ पेइह ताव।',
      kha: 'খুবলে পা, কা চা লা দেপ।',
      trp: 'খুলুমখা আপা, চা মনখা।',
    },
  },
};

const DEFAULT_GREETINGS: Record<Language, (name: string) => string> = {
  en: (name) => `Hello, this is ${name}!`,
  as: (name) => `নমস্কাৰ, মই ${name}!`,
  bn: (name) => `নমস্কার, আমি ${name}!`,
  ne: (name) => `नमस्ते, म ${name}!`,
  lus: (name) => `चिबाई, ${name} क नी ए!`,
  kha: (name) => `খুবলৈ, ঙা ${name}!`,
  ny: (name) => `अल्बो, ङो ${name}!`,
  trp: (name) => `খুলুমখা, আং ${name}!`,
};

export const getFamilyMemberTranscript = (member: FamilyMember, lang: Language): string => {
  const baseId = member.id.replace(/-(ext|voice)$/, '');
  if (FAMILY_MEMBER_TRANSLATIONS[baseId]?.transcript?.[lang]) {
    return FAMILY_MEMBER_TRANSLATIONS[baseId].transcript[lang];
  }
  if (member.voiceTranscripts?.[lang]) {
    return member.voiceTranscripts[lang]!;
  }
  switch (lang) {
    case 'en':
      if (member.voiceTranscriptEn) return member.voiceTranscriptEn;
      break;
    case 'as':
      if (member.voiceTranscriptAs) return member.voiceTranscriptAs;
      break;
    case 'bn':
      if (member.voiceTranscriptBn) return member.voiceTranscriptBn;
      break;
    case 'ne':
      if (member.voiceTranscriptNe) return member.voiceTranscriptNe;
      break;
    case 'lus':
      if (member.voiceTranscriptLus) return member.voiceTranscriptLus;
      break;
    case 'kha':
      if (member.voiceTranscriptKha) return member.voiceTranscriptKha;
      break;
    case 'ny':
      if (member.voiceTranscriptNy) return member.voiceTranscriptNy;
      break;
    case 'trp':
      if (member.voiceTranscriptTrp) return member.voiceTranscriptTrp;
      break;
  }
  return DEFAULT_GREETINGS[lang]?.(member.name) || member.name;
};

export const getFamilyMemberRelation = (member: FamilyMember, lang: Language): string => {
  const baseId = member.id.replace(/-(ext|voice)$/, '');
  if (FAMILY_MEMBER_TRANSLATIONS[baseId]?.relationship?.[lang]) {
    return FAMILY_MEMBER_TRANSLATIONS[baseId].relationship[lang];
  }
  if (lang === 'as' && member.relationshipAs) return member.relationshipAs;
  if (lang === 'en' && member.relationship) return member.relationship;
  return member.relationshipAs || member.relationship;
};

export const INITIAL_MUSIC: FavoriteMusic[] = [
  {
    id: 'music-1',
    patientId: 'patient-ramesh-1',
    title: 'Peaceful Assamese Flute - Raag Bhupali',
    artist: 'Traditional Instrumental Folk',
    audioUrl: '', // Uses audioService.playSoothingFluteReward()
    duration: '2:15',
    isBuiltIn: true,
    isSynthesized: true,
  },
  {
    id: 'music-2',
    patientId: 'patient-ramesh-1',
    title: 'Serene Borgeet Meditation',
    artist: 'Spiritual Assamese Heritage',
    audioUrl: '',
    duration: '3:00',
    isBuiltIn: true,
    isSynthesized: true,
  },
];

export interface GuidanceTipLanguageData {
  category: Record<Language, string>;
  title: Record<Language, string>;
  summary: Record<Language, string>;
  bulletPoints: Record<Language, string[]>;
}

export const GUIDANCE_TIP_TRANSLATIONS: Record<string, GuidanceTipLanguageData> = {
  'tip-1': {
    category: {
      en: 'Communication',
      as: 'সংযোগ আৰু কথা-বতৰা',
      bn: 'যোগাযোগ ও কথোপকথন',
      ne: 'सञ्चार र कुराकानी',
      lus: 'बिअर्होना',
      kha: 'কা জিংইয়াক্রেন',
      ny: 'अगन-अकम',
      trp: 'কক লামা',
    },
    title: {
      en: 'Communicating with Calmness & Dignity',
      as: 'শান্ত আৰু মৰমেৰে কথা পতাৰ অভ্যাস',
      bn: 'শান্ত ও শ্রদ্ধার সাথে কথা বলার অভ্যাস',
      ne: 'शान्त र आदरपूर्वक कुरा गर्ने बानी',
      lus: 'थ्लामुअन थ्लाक ताक लेह ज़हावम ताका बिअक',
      kha: 'ক্রেন দা কা জিংসুক বাদ জিংনিয়েওকোর',
      ny: 'अल्बो मोंगो अगन',
      trp: 'খা কৗথাম তেই মান দিয়েই কক সুরমা',
    },
    summary: {
      en: 'Speak in short, gentle sentences with eye contact and a warm smile. Never argue or test their memory abruptly.',
      as: 'চমুকৈ, শান্ত কণ্ঠেৰে আৰু চকুলৈ চাই কথা পাতক। কেতিয়াও জোৰ কৰি মনত পেলাবলৈ হেঁচা নিদিব।',
      bn: 'ছোট, শান্ত বাক্যে চোখে চোখ রেখে হাসিমুখে কথা বলুন। জোর করে স্মৃতি পরীক্ষা করার চেষ্টা করবেন না।',
      ne: 'छोटो, शान्त वाक्यमा आँखामा हेरेर मुस्कुराउँदै कुरा गर्नुहोस्। कहिल्यै पनि जबरजस्ती सम्झाउने प्रयास नगर्नुहोस्।',
      lus: 'थुमल तौइ, नेम ताकिन सवि ला, एन चुंगिन नुइ ह्मेल पू रौह। अन ह्रिअत्ना फिअह तूम सुह।',
      kha: 'ক্রেন হা কি ক্যনতিয়েন কিবা ল্যংকত বাদ কিবা জেম, পেইত হা কি খ্মাত দা কা জিংফুহমুত। ওয়াত জু প্যরশাং বান ত্যনজুহ য়া কা জিংক্যনমাব।',
      ny: 'अकम अगन अल्बो मोंगो दो। आरेक पेन्नाम मा। ताग-नाम ताग-का।',
      trp: 'খাতুং কক তেনেই, খুকনি মিনাইয়েই কক সা। জোর খ্লাইয়ে উয়ানসুমানি চেষ্টা তা খ্লাই।',
    },
    bulletPoints: {
      en: [
        'Use a warm, unhurried tone of voice.',
        'Allow extra time for the senior to process questions and respond comfortably.',
        'Avoid saying "Don\'t you remember?" Instead, gently share the context: "Here is your daughter Sunita".',
        'Non-verbal cues like a comforting touch on the hand provide tremendous security.',
      ],
      as: [
        'ধীৰ আৰু মৰমিয়াল সুৰত কথা কওক, কোনো খৰখেদা নকৰিব।',
        'কথা বুজিবলৈ আৰু উত্তৰ দিবলৈ জ্যেষ্ঠজনক পৰ্যাপ্ত সময় দিয়ক।',
        '‘আপোনাৰ মনত নাইনে?’ বুলি নুসুধিব; বৰঞ্চ কওক ‘এয়া চাওক আপোনাৰ জীয়াৰী সুনীতা’।',
        'মৰমেৰে হাতত স্পৰ্শ কৰিলে তেওঁলোকে নিৰাপদ অনুভৱ কৰে।',
      ],
      bn: [
        'ধীর ও স্নেহময় স্বরে কথা বলুন, কোনো তাড়াহুড়ো করবেন না।',
        'কথা বুঝতে এবং উত্তর দিতে পর্যাপ্ত সময় দিন।',
        '‘মনে নেই তোমার?’ বলবেন না; বরং বলুন ‘এই যে দেখো তোমার মেয়ে সুনীতা এসেছে’।',
        'স্নেহের সাথে হাত স্পর্শ করলে তারা নিরাপদ বোধ করেন।',
      ],
      ne: [
        'शान्त र मायालु स्वरमा कुरा गर्नुहोस्, हतार नगर्नुहोस्।',
        'कुरा बुझ्न र जवाव दिन पर्याप्त समय दिनुहोस्।',
        '‘याद छैन र?’ नभन्नुहोस्; बरु भन्नुहोस् ‘हेर्नुहोस् तपाईंको छोरी सुनिता’।',
        'मायाले हात समात्दा उहाँहरूले सुरक्षित महसुस गर्नुहुन्छ।',
      ],
      lus: [
        'औ दम ताक लेह ह्मान्ह्मावह लो ताक ह्मांग रौह।',
        'च्छान्ना पे तूfacedrin हून पे तम रौह।',
        '\'ई ह्रे तौह लो एम नी?\' ती सुह ला, \'है ही ई फानू सुनीता अ नीह ही\' ती ज़ौक रौह।',
        'कुता चेल्ह ते हिअन थ्लामुअन्ना नासा ताक अ पे थीन।',
      ],
      kha: [
        'ক্রেন দা কা সুর বা জেম বাদ কা ব্যম দন জিংক্যরকিয়েহ।',
        'আই পোর বা পুরা বান প্যরখাত বাদ বান য়োহ জুবাব।',
        'ওয়াত অং \'ব্যম ক্যনমাব শুহ?\', প্যনক্যনমাব প্যনবান \'ইনে দেই ই খুন জং ফি ই সুনীতা\'।',
        'কাবা বাত য়া কি ক্তি দা কা জিংঈইত কা আই জিংইয়াদা কাবা খ্রও।',
      ],
      ny: [
        'अल्बो सुर अगन दो, लोंगो मा।',
        'अगन मित-नाम समय गो-का।',
        '\'मित-मेक मा?\' ता अगन, \'हिए सुनीती\' अगन दो।',
        'अल्बो आलग बेन्नाम गो-का।',
      ],
      trp: [
        'সুস্থির তেই হামজাকনাই সুরেই কক সা।',
        'কক সিমানি তেই সানমানি বাগৈ সময় রি।',
        '\'উয়ানসুকুইয়া দে?\' তা সা, \'অ নাইদি নিনি বৗচৗক সুনীতা\' সা।',
        'হামজাকমায়েই য়াক রিমখে বোরোক কাহাম খাপাঙ্গোয়।',
      ],
    },
  },
  'tip-2': {
    category: {
      en: 'Daily Habits',
      as: 'দৈনন্দিন অভ্যাস',
      bn: 'দৈনন্দিন অভ্যাস',
      ne: 'दैनिक बानीहरू',
      lus: 'नीतीन थिल तीह',
      kha: 'কি জিংম্লিয়েন বা মান কা স্ঙী',
      ny: 'रोमर्रोम कम',
      trp: 'সালব্রুমনি অভ্যাস',
    },
    title: {
      en: 'The Reassuring Power of Daily Routines',
      as: 'দৈনন্দিন নিয়মীয়া ৰুটিনৰ গুৰুত্ব',
      bn: 'নিয়মিত দৈনন্দিন রুটিনের গুরুত্ব',
      ne: 'नियमित दैनिक तालिकाको महत्त्व',
      lus: 'नीतीन कालफूंग फेल फाइ थात्ना',
      kha: 'কা বোর জং কা রুকম ইম বা মান কা স্ঙী',
      ny: 'रोमर्रोम लोंगो तेन्नान',
      trp: 'সালব্রুমনি নিয়মনি বল',
    },
    summary: {
      en: 'Predictable schedules decrease anxiety and confusion for people living with memory loss.',
      as: 'প্ৰতিদিনে একে সময়ত একে ধৰণৰ কাম কৰিলে মানসিক অস্থিৰতা আৰু বিভ্ৰান্তি বহু পৰিমাণে হ্ৰাস পায়।',
      bn: 'প্রতিদিন একই সময়ে কাজ করলে মানসিক অস্থিরতা ও দ্বিধাদ্বন্দ্ব অনেকটাই কমে যায়।',
      ne: 'हरेक दिन एउटै समयमा काम गर्दा मानसिक अन्योल र चिन्ता धेरै कम हुन्छ।',
      lus: 'नीतीन तीह तूर फेल ताक नैह हिअन रील्रु हाह्ना अ तीरेह थीन।',
      kha: 'কা রুকম ত্রেই কাম বা থিকনা কা প্যনদুনা য়া কা জিংকুলমার জিংমুত।',
      ny: 'रोमर्रोम लोंगो कम दो मोंगो अल्बो।',
      trp: 'সালব্রুম একে সময়ো সামুং খ্লাইখে খাপাং তেই বুদ্ধি সুস্থি তংগো।',
    },
    bulletPoints: {
      en: [
        'Keep waking, eating, and resting times consistent every day.',
        'Place visual routine cues and familiar family photos around the room.',
        'Encourage gentle outdoor walks or veranda sitting during morning sun.',
        'Involve them in small, dignity-affirming tasks like watering a plant or folding a towel.',
      ],
      as: [
        'শোৱাৰ পৰা উঠা, খোৱা-বোৱা আৰু জিৰণিৰ সময় সদায় একে ৰাখক।',
        'কোঠাটোত চিনাকি ফটো আৰু পৰিষ্কাৰ দৃশ্যমান সংকেত ৰাখক।',
        'ৰাতিপুৱা কোমল ৰ’দত খোজ কঢ়া বা চোতালত বহিবলৈ উৎসাহিত কৰক।',
        'ফুলত পানী দিয়াৰ দৰে সৰু সৰু কামত তেওঁলোকক মৰমেৰে জড়িত কৰক।',
      ],
      bn: [
        'ঘুম থেকে ওঠা, খাওয়া ও বিশ্রামের সময় প্রতিদিন একই রাখুন।',
        'ঘরে পরিচিত ছবি ও সহজে চোখে পড়ার মতো চিহ্ন রাখুন।',
        'সকালের নরম রোদে হাঁটা বা বারান্দায় বসার জন্য উৎসাহিত করুন।',
        'গাছে জল দেওয়া বা তোয়ালে ভাঁজ করার মতো সহজ কাজে যুক্ত রাখুন।',
      ],
      ne: [
        'उठ्ने, खाने र आराम गर्ने समय सधैं एउटै राख्नुहोस्।',
        'कोठामा चिनजानका फोटो र स्पष्ट देखिने संकेतहरू राख्नुहोस्।',
        'बिहानको घाममा हल्का हिँड्न वा बरण्डामा बस्न प्रोत्साहन दिनुहोस्।',
        'फूलमा पानी हाल्ने वा कपडा मिलाउने जस्ता साना काममा संलग्न गराउनुहोस्।',
      ],
      lus: [
        'थौह हून, चौह ऐ हून लेह चौल्ह हून ती दांगलाम सुह।',
        'रूम च्हुंगाह थ्लालाक लेह ह्रिअत्फिअह औलसम तूर थिल दाह रौह।',
        'ज़िंग नीसा ह्नुआइआह तैइ कुअल एमाव थुत हा्हदाम पुइ रौह।',
        'पांगपार तुई पेक आंग ची थिल हो ते ते तीह तीर रौह।',
      ],
      kha: [
        'প্যননেহ য়া কা পোর খিয়ে থিয়াহ, বাম জা বাদ শংথাইয়িত বা কান য়া র্যংকত।',
        'বুহ য়া কি দুর বা ইথুহ বাদ কি দাক কিবা শাই হা কা কামরা।',
        'প্যনশ্লুর বান য়াইয়িদ কাই হা কা স্ঙী স্তেপ লানে বান শং হা বারান্দা।',
        'ক্যনশেও য়া কি হা কি কাম রিত কুম বান থেহ উম য়া কি স্যনতিয়েও।',
      ],
      ny: [
        'हु-नाम, दो-नाम, बे-नाम समय तेन्नान गो-का।',
        'नम-लो फोटो दो संकेत अकम ले-का।',
        'रोमर्रोम लोंगो चाक-नाम दो अल्बो।',
        'अपुन-अले ति-नाम कम दो आरेक ले-का।',
      ],
      trp: [
        'ফুংনি তুংমা, চামুং তেই নুহুরানি সময় একে থনদি।',
        'নখো চিনাকি ফটো তেই চিহ্ন কৗথার তনদি।',
        'ফুংনি সালো বারান্দাত বচাফা তেই লামচা হিমা কাহাম।',
        'ম্বরংগো ত্যুই রিমা বাই খাকলাই সামুংগো রপফা।',
      ],
    },
  },
  'tip-3': {
    category: {
      en: 'Comfort & Validation',
      as: 'সঁহাৰি আৰু মানসিক শান্তি',
      bn: 'মানসিক সমর্থন ও সান্ত্বনা',
      ne: 'मानसिक शान्ति र भरोसा',
      lus: 'थ्लामुअन्ना लेह ह्रिअत्थिअमना',
      kha: 'কা জিংপ্যনসুক বাদ জিংপ্যনশঙাইন',
      ny: 'अल्बो मोंगो शांति',
      trp: 'খাপাংনি শান্তি',
    },
    title: {
      en: 'Handling Confusion & Repetitive Questions',
      as: 'বিভ্ৰান্তি আৰু একে কথা বাৰে বাৰে সোধাৰ সমাধান',
      bn: 'বিভ্রান্তি ও একই কথা বারবার জিজ্ঞাসার সমাধান',
      ne: 'अलमल र दोहोरिने प्रश्नहरू कसरी सम्हाल्ने',
      lus: 'रील्रु बुआई लेह ज़ौह्ना इनआंग ज़ौत नौन च्हींफेल दान',
      kha: 'বালেই কুলমার জিংমুত বাদ কা জিংক্যল্লী কাবা মান কা পোর',
      ny: 'अगन मित-मेक दो तेन्नान पेन्नाम',
      trp: 'খাপাং বিভ্রান্তি তেই বারে বারে সউংমানি প্রতিকার',
    },
    summary: {
      en: 'Validate the emotion behind the words rather than correcting factual errors.',
      as: 'ভুল আঙুলিয়াই নিদি তেওঁলোকৰ মনৰ আবেগক বুজিবলৈ চেষ্টা কৰক।',
      bn: 'ভুল না শুধরে তাদের মনের আবেগকে বুঝতে চেষ্টা করুন।',
      ne: 'गल्ती औंल्याउनुको सट्टा उहाँहरूको भावनालाई बुझ्ने प्रयास गर्नुहोस्।',
      lus: 'थिल दीक लो ह्रिल्ह फिअह तूम अइइन अन रील्रु पूतह्मंग ह्रिअत साक तूम रौह।',
      kha: 'স্ঙেওথুহ য়া কা জিংমুত হা কা জাকা বান প্যনবেইত য়া কি জিংবাকলা।',
      ny: 'अगन भूल मा, मोंगो भाव मित-का।',
      trp: 'ভুল না সাফারিখা খাপাংনি কষ্টনো বুজিদি।',
    },
    bulletPoints: {
      en: [
        'If they ask repeatedly to "go home", they are often seeking safety, not a physical location. Reassure them: "You are safe with me".',
        'Do not argue or correct mistaken dates or names directly.',
        'Gently redirect attention using a familiar family photograph or a soothing cup of tea.',
        'Play soft familiar music when restlessness or sundowning occurs in the late afternoon.',
      ],
      as: [
        'যদি তেওঁলোকে বাৰে বাৰে ‘ঘৰলৈ যাম’ বুলি কয়, তাৰ অৰ্থ হ’ল তেওঁলোকে নিৰাপত্তা বিচাৰিছে; কওক ‘মই আপোনাৰ লগত আছোঁ, কোনো চিন্তা নাই’।',
        'দিন-বাৰ বা ভুল তথ্যক লৈ যুক্তি-তৰ্ক নকৰিব।',
        'চিনাকি ফটো দেখুৱাই বা একাপ গৰম চাহ দি মনটো আনফালে নিয়ক।',
        'আবেলিৰ সময়ত মানসিক অস্থিৰতা বাঢ়িলে শান্ত সুৰৰ গান শুনাব পাৰে।',
      ],
      bn: [
        'বারবার ‘বাড়ি যাব’ বললে আসলে তারা নিরাপত্তা খুঁজছেন; বলুন ‘আমি তোমার কাছেই আছি, কোনো চিন্তা নেই’।',
        'তারিখ বা নাম নিয়ে তর্ক বা ভুল সংশোধন করবেন না।',
        'পরিচিত ছবি দেখিয়ে বা এক কাপ চা দিয়ে মন অন্যদিকে ঘুরিয়ে দিন।',
        'বিকেলের দিকে অস্থিরতা বাড়লে শান্ত সুরের পরিচিত গান বাজান।',
      ],
      ne: [
        'बारम्बार ‘घर जान्छु’ भन्नुको अर्थ सुरक्षा खोज्नु हो; भन्नुहोस् ‘म तपाईंसँगै छु, चिन्ता नगर्नुहोस्’।',
        'मिति, समय वा नामका विषयमा वादविवाद नगर्नुहोस्।',
        'चिनजानको तस्विर देखाएर वा चिया दिएर ध्यान अन्यत्र मोड्नुहोस्।',
        'साँझपख बेचैनी बढ्दा शान्त र परिचित संगीत बजाउनुहोस्।',
      ],
      lus: [
        '\'इनाह का हौह दुह\' अन तीह फो चुअन, \'का कीअंगाह ई हीम ए\' तीइन ह्रिल्ह रौह।',
        'नी लेह ह्मीन दीक लो चुंगचांगाह इनहिअल सुह।',
        'थ्लालाक एनपुइ एमाव थिंगपुई तुई ताक पैन अन रील्रु ला पेंग रौহ।',
        'त्लाईलाम-आह रील्रु बुआई अ औम चुअन रीमावी ज़ौइ ताक गैथ्लाक तीर रौহ।',
      ],
      kha: [
        'লাদা কি অং \'লেইত শা ঈয়িং\', কি ক্বাহ জিংশঙাইন; অং \'ফি দন র্যংকত বাদ ঙা, ওয়াত শেপতৈং\'।',
        'ওয়াত ইয়াতাই নিয়া হালোর কি তারিক লানে কি ক্যরতৈং বা বাকলা।',
        'প্যনফাই য়া কা জিংমুত দা কাবা প্যনি দুর ঈয়িং লানে আই শুরিয়েম চা।',
        'তেম য়া কি জিংর্বাই বা জেম হাবা দন কা জিংপিসা জিংমুত জানমিয়েত।',
      ],
      ny: [
        '\'नम-लो आर\' अगन-बो, \'ङो नो-लो दो, अल्बो\' अगन।',
        'दिन-तारीख भूल अगन-बो वाद-विवाद ता ले-का।',
        'अकम फोटो एने चा दो मोंगो घुमान-का।',
        'दोलो मोंगो अशांति बे-बो बेमिन सुर तात्का।',
      ],
      trp: [
        '\'নখো থাংনো\' সাকাপ বোরোক শান্তি মুচুংগো; সা \'আং নিনি লগে তংগো, খাপাং তা খরপ\'।',
        'সাল-তারিখ তেই নাম ভুল সাখে তর্ক তা খ্লাই।',
        'চিনাকি ফটো তিন্তিখে তেই চা তেনিয়ে মন অন্যফালে সানদি।',
        'সানজানি সমায়ো খাপাং ছটফট খ্লাইখে রিমাউই কাহাম খুনদি।',
      ],
    },
  },
  'tip-4': {
    category: {
      en: 'Reminiscence',
      as: 'স্মৃতি সজীৱ কৰা',
      bn: 'স্মৃতিচারণ',
      ne: 'स्मरण र स्मृति',
      lus: 'ह्मानलाई ह्रिअत्नौम',
      kha: 'ক্যনমাব য়া কি পোর বা লা লেইত',
      ny: 'अकम मित-नाम',
      trp: 'স্বকাংনি স্মৃতি',
    },
    title: {
      en: 'Reminiscence & Familiar North Eastern Memories',
      as: 'পুৰণি স্মৃতি আৰু চিনাকি পৰিৱেশ',
      bn: 'পুরোনো স্মৃতি ও পরিচিত সংস্কৃতি',
      ne: 'पुराना सम्झना र स्थानीय संस्कृति',
      lus: 'ह्मानलाई थिल लेह नूनह््लुइ ह्रिअत्छुअह',
      kha: 'কি জিংক্যনমাব শাফাং কা ঈয়িং বাদ কি পোর হ্যনদাই',
      ny: 'अकम लोंगो दो संस्कृति',
      trp: 'স্বকাংনি খাপাং তেই নখরোনি স্মৃতি',
    },
    summary: {
      en: 'Long-term memories often remain strong even as short-term memory fades. Tap into cherished childhood and cultural roots.',
      as: 'নিকট অতীত পাহৰিলেও পুৰণি দিনৰ মধুৰ স্মৃতি মনত থাকে; সেয়ে পুৰণি কথা আলোচনা কৰিলে আনন্দ লাভ কৰে।',
      bn: 'সাম্প্রতিক কথা ভুলে গেলেও পুরোনো স্মৃতি স্পষ্ট থাকে; তাই পুরোনো দিনের গল্প তাদের আনন্দ দেয়।',
      ne: 'हालका कुरा बिर्सिए पनि पुराना सम्झनाहरू जीवित रहन्छन्; पुराना सुखद पलहरू सम्झाउँदा उहाँहरू खुसी हुनुहुन्छ।',
      lus: 'तून ह्नाइ थिल थैहंग्हील मह से ह्मानलाई थिल एराव्ह अन ला ह्रे रेंग थीन। नूनह््लुइ सौइपुइ रौह।',
      kha: 'ওয়াত লা ক্লেত য়া কিবা শেন, কি ক্যনমাব য়া কিবা রিম। প্যনক্যনমাব য়া কি পোর খ্যননাহ বাদ কা রীতি দুস্তুর।',
      ny: 'दापो कम मित-बो, अकम कम मित-दो। अकम अगन अल्बो।',
      trp: 'তাবুকনি কক উয়ানসুকুইয়া তংখেবো স্বকাংনি কক খাপাঙ্গো তংগো; স্বকাংনি স্মৃতি সাখে বোরোক খুশি ওই।',
    },
    bulletPoints: {
      en: [
        'Look together at family albums, wedding photos, and holiday pictures.',
        'Play nostalgic Assamese folk songs, Borgeet, or traditional flute melodies.',
        'Aromas like fresh Assam tea, tulsi, or familiar cooking evoke comforting memories.',
        'Ask open-ended questions like "Tell me about your garden" rather than testing their memory.',
      ],
      as: [
        'পুৰণি ফটো এলবাম, পৰিয়ালৰ বিয়া-সবাহৰ ফটো একেলগে বহি চাওক।',
        'শান্ত লোকগীত, বৰগীত বা বাঁহীৰ সুৰ শুনাওক।',
        'তুলসী, অসমীয়া চাহৰ সুবাস আদিয়ে মনলৈ প্ৰশান্তি কঢ়িয়াই আনে।',
        'তেওঁলোকক পুৰণি দিনৰ আনন্দময় অভিজ্ঞতা ক’বলৈ অনুৰোধ কৰক।',
      ],
      bn: [
        'পুরোনো ছবির অ্যালবাম, বিয়ে ও উৎসবের ছবি একসাথে বসে দেখুন।',
        'শান্ত লোকগীতি বা ঐতিহ্যবাহী বাঁশির সুর শোনান।',
        'তাজা চা, তুলসী বা পরিচিত রান্নার গন্ধ মনে শান্তি ফিরিয়ে আনে।',
        'স্মৃতি পরীক্ষা না করে ‘তোমার বাগানের কথা বলো’ এমন আন্তরিক গল্প শুরু করুন।',
      ],
      ne: [
        'पुराना फोटो एल्बम, विवाह र चाडपर्वका तस्विरहरू सँगै बसेर हेर्नुहोस्।',
        'शान्त लोकगीत वा परम्परागत बाँसुरीको धुन सुनाउनुहोस्।',
        'ताजा चिया, तुलसी वा घरको परिकारको बास्नाले मनमा शान्ति ल्याउँछ।',
        'परीक्षा लिनुको सट्टा ‘तपाईंको बगैंचाको बारेमा सुनाउनुहोस्’ भनी खुल्ला कुराकानी गर्नुहोस्।',
      ],
      lus: [
        'च्छुंगकौ एल्बम लेह इन्नेइह थ्लालाक ते एन दून थीन उला।',
        'ह्मानलाई ह्ला नेम ताक लेह रीमावी ज़ौइ ते गैथ्ला दून रौহ ऊ।',
        'थिंगपुई रीमतुई लेह ऐतूर रीम ह्रिअत थान हिअन हा्हदामना अ पे थीन।',
        '\'ई हुअन चुंगचांग मीन ह्रिल्হ तेহ\' तीइन ज़ौह्ना ज़ौ ताक ज़ौत थीन रौহ।',
      ],
      kha: [
        'পেইত লাং য়া কি দুর বা রিম জং কা ঈয়িং বাদ কি দুর শংকুরিম।',
        'প্যনরখিং য়া কি জিংর্বাই ত্যনরাই কিবা জেম বাদ কা সুর বেসলী।',
        'কা জিংইয়িবীহ জং কা চা, তুলসী লানে কি জিংবাম ত্যনরাই কা প্যনক্যনমাব য়া কিবা বুন।',
        'ক্যল্লী দা কাবা অং \'ইয়াতুহ য়া ঙা শাফাং কা কপের\' হা কা জাকা বান ত্যনজুহ।',
      ],
      ny: [
        'अकम फोटो एल्बम दो विवाह फोटो एने-का।',
        'अकम लोकगीत दो बांसी सुर तात्का।',
        'अकम चा दो तुलसी गंध मोंगो अल्बो ले-का।',
        '\'अकम अगन पेत्ता\' अगन दो, परीक्षा मा।',
      ],
      trp: [
        'স্বকাংনি ফটো অ্যালবাম তেই বিয়ানি ফটো লগে নাইদি।',
        'শান্ত লোকগান তেই বাঁশিনি সুর খুনদি।',
        'তাজা চা তেই নখরোনি চামুংনি গন্ধ খাপাঙ্গো শান্তি রিয়ো।',
        'উয়ানসুমানি পরীক্ষা তা লাদি, \'নিনি বাগানি কক সা\' হানাই কক সা।',
      ],
    },
  },
};


export const CAREGIVER_GUIDANCE_TIPS: CaregiverGuidanceTip[] = [
  {
    id: 'tip-1',
    titleEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.en,
    titleAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.as,
    titleBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.bn,
    titleNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.ne,
    titleLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.lus,
    titleKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.kha,
    titleNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.ny,
    titleTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.trp,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.trp,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.trp,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.trp,
    titles: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title,
    categories: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category,
    summaries: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary,
    bulletPoints: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints,
    icon: 'heart-handshake',
  },
  {
    id: 'tip-2',
    titleEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.en,
    titleAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.as,
    titleBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.bn,
    titleNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.ne,
    titleLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.lus,
    titleKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.kha,
    titleNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.ny,
    titleTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.trp,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.trp,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.trp,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.trp,
    titles: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title,
    categories: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category,
    summaries: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary,
    bulletPoints: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints,
    icon: 'calendar-check',
  },
  {
    id: 'tip-3',
    titleEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.en,
    titleAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.as,
    titleBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.bn,
    titleNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.ne,
    titleLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.lus,
    titleKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.kha,
    titleNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.ny,
    titleTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.trp,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.trp,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.trp,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.trp,
    titles: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title,
    categories: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category,
    summaries: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary,
    bulletPoints: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints,
    icon: 'shield-check',
  },
  {
    id: 'tip-4',
    titleEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.en,
    titleAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.as,
    titleBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.bn,
    titleNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.ne,
    titleLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.lus,
    titleKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.kha,
    titleNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.ny,
    titleTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.trp,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.trp,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.trp,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.trp,
    titles: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title,
    categories: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category,
    summaries: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary,
    bulletPoints: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints,
    icon: 'sparkles',
  },
];

export const getGuidanceTipCategory = (tip: CaregiverGuidanceTip, lang: Language): string => {
  if (GUIDANCE_TIP_TRANSLATIONS[tip.id]?.category?.[lang]) {
    return GUIDANCE_TIP_TRANSLATIONS[tip.id].category[lang];
  }
  if (tip.categories?.[lang]) {
    return tip.categories[lang]!;
  }
  const prop = (`category${lang.charAt(0).toUpperCase() + lang.slice(1)}`) as keyof CaregiverGuidanceTip;
  if (tip[prop] && typeof tip[prop] === 'string') {
    return tip[prop] as string;
  }
  return lang === 'as' ? tip.categoryAs : tip.categoryEn;
};

export const getGuidanceTipTitle = (tip: CaregiverGuidanceTip, lang: Language): string => {
  if (GUIDANCE_TIP_TRANSLATIONS[tip.id]?.title?.[lang]) {
    return GUIDANCE_TIP_TRANSLATIONS[tip.id].title[lang];
  }
  if (tip.titles?.[lang]) {
    return tip.titles[lang]!;
  }
  const prop = (`title${lang.charAt(0).toUpperCase() + lang.slice(1)}`) as keyof CaregiverGuidanceTip;
  if (tip[prop] && typeof tip[prop] === 'string') {
    return tip[prop] as string;
  }
  return lang === 'as' ? tip.titleAs : tip.titleEn;
};

export const getGuidanceTipSummary = (tip: CaregiverGuidanceTip, lang: Language): string => {
  if (GUIDANCE_TIP_TRANSLATIONS[tip.id]?.summary?.[lang]) {
    return GUIDANCE_TIP_TRANSLATIONS[tip.id].summary[lang];
  }
  if (tip.summaries?.[lang]) {
    return tip.summaries[lang]!;
  }
  const prop = (`summary${lang.charAt(0).toUpperCase() + lang.slice(1)}`) as keyof CaregiverGuidanceTip;
  if (tip[prop] && typeof tip[prop] === 'string') {
    return tip[prop] as string;
  }
  return lang === 'as' ? tip.summaryAs : tip.summaryEn;
};

export const getGuidanceTipBullets = (tip: CaregiverGuidanceTip, lang: Language): string[] => {
  if (GUIDANCE_TIP_TRANSLATIONS[tip.id]?.bulletPoints?.[lang]) {
    return GUIDANCE_TIP_TRANSLATIONS[tip.id].bulletPoints[lang];
  }
  if (tip.bulletPoints?.[lang]) {
    return tip.bulletPoints[lang]!;
  }
  const prop = (`bulletPoints${lang.charAt(0).toUpperCase() + lang.slice(1)}`) as keyof CaregiverGuidanceTip;
  if (tip[prop] && Array.isArray(tip[prop])) {
    return tip[prop] as string[];
  }
  return lang === 'as' ? tip.bulletPointsAs : tip.bulletPointsEn;
};
