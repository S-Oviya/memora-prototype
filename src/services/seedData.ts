import { Patient, FamilyMember, RoutineItem, ReminderItem, FavoriteMusic, CaregiverGuidanceTip, Language, CaregiverAlert } from '../types';

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
    lus: 'Zing Thingpui in leh huan Boruak',
    kha: 'Cha step bad ka lyer ba khieid',
    ny: 'Romrrom cha do akam ale',
    trp: 'ফুংনি চা অং বাগানি বার',
    mni: 'ꯑꯌꯨꯛꯀꯤ ꯆꯥ ꯑꯃꯁꯨꯡ ꯂꯩꯀꯣꯜꯒꯤ ꯅꯨꯡꯁꯤꯠ (য়ুমথক চা)',
  },
  'routine-2': {
    en: 'Morning Bath & Fresh Clothes',
    as: 'গা ধোৱা আৰু পৰিষ্কাৰ কাপোৰ',
    bn: 'স্নান করা ও পরিষ্কার পোশাক',
    ne: 'बिहानको स्नान र सफा लुगा',
    lus: 'Zing bual in leh puan thar',
    kha: 'Sum step bad ka jain ba sada',
    ny: 'Romrrom hu-nam do ale ijing',
    trp: 'ফুংনি মাইরম অং বৗসৗং কুথার',
    mni: 'ꯑꯌꯨꯛꯀꯤ ꯏꯔꯨꯖꯕ ꯑꯃꯁꯨꯡ ꯐꯤꯔꯣꯜ (ঈরুজবা)',
  },
  'routine-3': {
    en: 'Breakfast & Morning Medicine',
    as: 'পুৱাৰ আহাৰ আৰু ঔষধ',
    bn: 'সকালের খাবার ও ওষুধ',
    ne: 'बिहानको खाजा र औषधि',
    lus: 'Zing Tukṭhuan leh Damdawi',
    kha: 'Bam step bad ka dawai',
    ny: 'Romrrom do-nam do si-nam',
    trp: 'ফুংনি চামুং অং সমাই',
    mni: 'ꯑꯌꯨꯛꯀꯤ ꯆꯥꯛ ꯑꯃꯁꯨꯡ ꯍꯤꯗꯥꯛ (হীদাক)',
  },
  'routine-4': {
    en: 'Lunch with Family',
    as: 'পৰিয়ালৰ সৈতে দুপৰীয়াৰ আহাৰ',
    bn: 'পরিবারের সাথে দুপুরের খাবার',
    ne: 'परिवारसँग दिउँसोको खाना',
    lus: 'Chhun Chaw Chhungkua nen',
    kha: 'Bam sngi bad ka kur',
    ny: 'Anying do longo do-nam',
    trp: 'নখরম কৗথার দুপরনি চামুং',
    mni: 'ꯏꯃꯨꯡꯒ ꯂꯣꯏꯅꯅ ꯅꯨꯃꯤꯠꯊꯤꯡꯒꯤ ꯆꯥꯛ (চাক)',
  },
  'routine-5': {
    en: 'Afternoon Walk in Veranda',
    as: 'আবেলি বাৰান্দাত খোজ কঢ়া',
    bn: 'বিকেলে বারান্দায় হাঁটা',
    ne: 'दिउँसो बरण्डामा हिँड्ने',
    lus: 'Tlai Veranda-ah kal kual',
    kha: 'Iaid sharuh ka baranda',
    ny: 'Longo dolo chak-nam',
    trp: 'বারান্দাত লামচা হিমা',
    mni: 'ꯅꯨꯃꯤꯠꯊꯤꯡꯗ ꯕꯔꯥꯟꯗꯥꯗ ꯆꯠꯄ (বারান্দাদা চৎপা)',
  },
  'routine-6': {
    en: 'Evening Prayer & Calm Music',
    as: 'সন্ধিয়াৰ প্ৰাৰ্থনা আৰু শান্ত সংগীত',
    bn: 'সন্ধ্যার প্রার্থনা ও শান্ত সুর',
    ne: 'साँझको प्रार्थना र शान्त संगीत',
    lus: 'Tlai ṭawngṭaina leh rimawi',
    kha: 'Duwai janmiet bad sur ba jar-jor',
    ny: 'Dolo do-nam do bemin',
    trp: 'সানজানি পুজা অং রিমাউই',
    mni: 'ꯅꯨꯃꯤꯗꯥꯡꯒꯤ ꯊꯧꯅꯤꯕ ꯑꯃꯁꯨꯡ ꯏꯁꯩ (থৌনীবা)',
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

export const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-1-medicine',
    patientId: 'patient-ramesh-1',
    title: 'Morning Blood Pressure & Memory Medicine',
    titleEn: 'Morning Blood Pressure & Memory Medicine',
    titleAs: 'পুৱাৰ ৰক্তচাপ আৰু স্মৃতিবৰ্ধক ঔষধ',
    type: 'medicine',
    time: '09:00 AM',
    schedule: 'Daily after breakfast',
    notes: 'Take 1 tablet Donepezil 5mg and 1 tablet Telmisartan with warm water.',
    notesEn: 'Take 1 tablet Donepezil 5mg and 1 tablet Telmisartan with warm water.',
    notesAs: 'পুৱাৰ আহাৰৰ পাছত এগিলাচ কুহুমীয়া পানীৰ সৈতে টেবলেট খাব।',
    enabled: true,
    completedToday: false,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'rem-2-hydration',
    patientId: 'patient-ramesh-1',
    title: 'Drink a Glass of Fresh Water',
    titleEn: 'Drink a Glass of Fresh Water',
    titleAs: 'এগিলাচ বিশুদ্ধ পানী খাওক',
    type: 'hydration',
    time: '11:00 AM',
    schedule: 'Every 2 hours',
    notes: 'Offer water gently from the traditional brass jug.',
    notesEn: 'Offer water gently from the traditional brass jug.',
    notesAs: 'পিতলৰ জগৰ পৰা এগিলাচ পানী মৰমেৰে খাবলৈ দিয়ক।',
    enabled: true,
    completedToday: false,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'rem-3-activity',
    patientId: 'patient-ramesh-1',
    title: 'Veranda Walk & Garden Fresh Air',
    titleEn: 'Veranda Walk & Garden Fresh Air',
    titleAs: 'বাৰান্দাত খোজ কঢ়া আৰু ফুলনিৰ বতাহ',
    type: 'activity',
    time: '04:30 PM',
    schedule: 'Daily afternoon',
    notes: '15 minutes slow walk accompanied by daughter Sunita or grandson Priyam.',
    notesEn: '15 minutes slow walk accompanied by daughter Sunita or grandson Priyam.',
    notesAs: 'জীয়াৰী সুনীতা বা নাতি প্ৰিয়মৰ সৈতে ১৫ মিনিট বাৰান্দাত শান্তভাৱে খোজ কাঢ়ক।',
    enabled: true,
    completedToday: false,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'rem-4-appointment',
    patientId: 'patient-ramesh-1',
    title: 'Neurology Review with Dr. B. Sharma',
    titleEn: 'Neurology Review with Dr. B. Sharma',
    titleAs: 'ডাঃ বি. শৰ্মাৰ সৈতে স্নায়ু পৰীক্ষা',
    type: 'appointment',
    time: '11:30 AM',
    schedule: 'Thursday (Monthly Check-up)',
    notes: 'Apollo Clinic Guwahati. Carry previous MRI scans and Memora activity trends.',
    notesEn: 'Apollo Clinic Guwahati. Carry previous MRI scans and Memora activity trends.',
    notesAs: 'গৌহাটী এপোলো ক্লিনিক। পুৰণি এম.আৰ.আই ৰিপৰ্ট আৰু মেমোৰা ডায়ৰী লগত নিব।',
    enabled: true,
    completedToday: false,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

export const REMINDER_ITEM_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'rem-1-medicine': {
    en: 'Morning Blood Pressure & Memory Medicine',
    as: 'পুৱাৰ ৰক্তচাপ আৰু স্মৃতিবৰ্ধক ঔষধ',
    bn: 'সকালের রক্তচাপ ও স্মৃতিশক্তি বৃদ্ধির ওষুধ',
    ne: 'बिहानको रक्तचाप र स्मृतिवर्धक औषधि',
    lus: 'Zing Thisen sang leh Hriatrengna Damdawi',
    kha: 'Ka dawai snam khluit bad jingkynmaw step',
    ny: 'Romrrom si-nam do hriat-nam',
    trp: 'ফুংনি সমাই অং খাপারমা সমাই',
    mni: 'ꯑꯌꯨꯛꯀꯤ ꯏ-ꯊꯧ ꯑꯃꯁꯨꯡ ꯅꯤꯡꯁꯤꯡꯕꯒꯤ ꯍꯤꯗꯥꯛ (হীদাক)',
  },
  'rem-2-hydration': {
    en: 'Drink a Glass of Fresh Water',
    as: 'এগিলাচ বিশুদ্ধ পানী খাওক',
    bn: 'এক গ্লাস তাজা জল পান করুন',
    ne: 'एक गिलास ताजा पानी पिउनुहोस्',
    lus: 'Tui thianghlim no khat in rawh',
    kha: 'Dih shiklat ka um ba khuid',
    ny: 'Isi gilas aken chong-nam',
    trp: 'ত্বৈ গিলাস কৗথার নংদি',
    mni: 'ꯏꯁꯤꯡ ꯒꯤꯂꯥꯁ ꯑꯃꯥ ꯊꯛꯄꯤꯌꯨ (ঈশীং গ্লাস অমা থকপীয়ু)',
  },
  'rem-3-activity': {
    en: 'Veranda Walk & Garden Fresh Air',
    as: 'বাৰান্দাত খোজ কঢ়া আৰু ফুলনিৰ বতাহ',
    bn: 'বারান্দায় হাঁটা ও বাগানের তাজা বাতাস',
    ne: 'बरण्डामा हिँड्ने र बगैंचाको ताजा हावा',
    lus: 'Veranda-ah kal kual leh huan boruak',
    kha: 'Iaid ha baranda bad ka lyer kper',
    ny: 'Baranda dolo chak-nam',
    trp: 'বারান্দাত লামচা হিমা অং বাগানি বার',
    mni: 'ꯕꯔꯥꯟꯗꯥꯗ ꯆꯠꯄ ꯑꯃꯁꯨꯡ ꯂꯩꯀꯣꯜꯒꯤ ꯅꯨꯡꯁꯤꯠ (বারান্দাদা চৎপা)',
  },
  'rem-4-appointment': {
    en: 'Neurology Review with Dr. B. Sharma',
    as: 'ডাঃ বি. শৰ্মাৰ সৈতে স্নায়ু পৰীক্ষা',
    bn: 'ডাঃ বি. শর্মার সাথে নিউরোলজি পরামর্শ',
    ne: 'डा. बी. शर्मासँग न्युरोलोजी जाँच',
    lus: 'Dr. B. Sharma nen Neurology inentir',
    kha: 'Ka jingpeit bad u Dr. B. Sharma',
    ny: 'Dr. B. Sharma do kela-nam',
    trp: 'ডাঃ বি. শর্মা বাই নাইমা',
    mni: 'ꯗꯣꯛꯇꯔ ꯕꯤ. ꯁꯔꯃꯥꯒ ꯎꯅꯕ (ডাক্তর বি. শর্মা)',
  },
};

export const REMINDER_NOTES_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'rem-1-medicine': {
    en: 'Take 1 tablet Donepezil 5mg and 1 tablet Telmisartan with warm water.',
    as: 'পুৱাৰ আহাৰৰ পাছত এগিলাচ কুহুমীয়া পানীৰ সৈতে টেবলেট খাব।',
    bn: 'সকালের খাবারের পর কুসুম গরম জল দিয়ে ওষুধ খান।',
    ne: 'बिहानको खानापछि मनतातो पानीसँग औषधि खानुहोस्।',
    lus: 'Tukṭhuan zawhah tui lum nen damdawi ei rawh.',
    kha: 'Bam dawai bad ka um ba syaid hadien ba la bam.',
    ny: 'Do-nam kange isi le si-nam chong-nam.',
    trp: 'ফুংনি চামুং উলো সমাই নংদি।',
    mni: 'ꯆꯥꯛ ꯆꯥꯔꯕ ꯃꯇꯨꯡꯗ ꯏꯁꯤꯡ ꯑꯁꯥꯑꯣꯕꯒ ꯍꯤꯗꯥꯛ ꯊꯛꯄꯤꯌꯨ꯫',
  },
  'rem-2-hydration': {
    en: 'Offer water gently from the traditional brass jug.',
    as: 'পিতলৰ জগৰ পৰা এগিলাচ পানী মৰমেৰে খাবলৈ দিয়ক।',
    bn: 'পিতলের জগ থেকে এক গ্লাস জল স্নেহের সাথে দিন।',
    ne: 'पित्तलको जगबाट मायाले एक गिलास पानी दिनुहोस्।',
    lus: 'Tui no khat duat takin pe rawh.',
    kha: 'Ai um sngewbha na ka khiew kynthei.',
    ny: 'Isi chong-nam le ankam bil.',
    trp: 'ত্বৈ নংরৗক কৗথার।',
    mni: 'ꯄꯤꯇꯣꯜꯒꯤ ꯆꯐꯨꯗꯒꯤ ꯏꯁꯤꯡ ꯃꯔꯝ ꯇꯧꯅ ꯊꯛꯍꯜꯂꯨ꯫',
  },
  'rem-3-activity': {
    en: '15 minutes relaxed walk accompanied by daughter Sunita or grandson Priyam.',
    as: 'জীয়াৰী সুনীতা বা নাতি প্ৰিয়মৰ সৈতে ১৫ মিনিট বাৰান্দাত শান্তভাৱে খোজ কাঢ়ক।',
    bn: 'কন্যা সুনীতা বা নাতি প্রিয়মের সাথে ১৫ মিনিট শান্তভাবে হাঁটুন।',
    ne: 'छोरी सुनिता वा नाति प्रियमसँग १५ मिनेट हिँड्नुहोस्।',
    lus: 'Sunita emaw Priyam emaw nen minute 15 kal dun rawh u.',
    kha: 'Iaid 15 minit ryngkat bad ka khun ne u ksiew.',
    ny: 'Minute 15 chak-nam anyi do.',
    trp: 'মিনিট ১৫ লামচা হিমা বৗচৗক বাই।',
    mni: 'ꯃꯆꯥꯅꯨꯄꯤ ꯁꯨꯅꯤꯇꯥ ꯅꯠꯇ꯭ꯔꯒ ꯏꯅꯥꯎ ꯄ꯭ꯔꯤꯌꯃꯒ ꯃꯤꯅꯤꯠ ১৫ ꯆꯠꯄꯤꯌꯨ꯫',
  },
  'rem-4-appointment': {
    en: 'Apollo Clinic Guwahati. Carry previous MRI scans and Memora activity trends.',
    as: 'গৌহাটী এপোলো ক্লিনিক। পুৰণি এম.আৰ.আই ৰিপৰ্ট আৰু মেমোৰা ডায়ৰী লগত নিব।',
    bn: 'অ্যাপোলো ক্লিনিক গুয়াহাটি। পুরনো এমআরআই রিপোর্ট ও মেমোরা রেকর্ড সঙ্গে নিন।',
    ne: 'अपोलो क्लिनिक गुवाहाटी। पुराना एमआरआई रिपोर्ट र मेमोरा रेकर्ड साथमा लैजानुहोस्।',
    lus: 'Apollo Clinic Guwahati. MRI report leh Memora record ken tur.',
    kha: 'Apollo Clinic Guwahati. Rah ki report MRI bad Memora.',
    ny: 'Apollo Clinic Guwahati. MRI report do Memora le.',
    trp: 'অ্যাপোলো ক্লিনিক গুয়াহাটি। এমআরআই রিপোর্ট লগন তিব।',
    mni: 'ꯑꯦꯄꯣꯂꯣ ꯀ꯭ꯂꯤꯅꯤꯛ ꯒꯨꯋꯥꯍꯥꯇꯤ꯫ ꯑꯔꯤꯕ MRI ꯔꯤꯄꯣꯔ꯭ꯠ ꯑꯃꯁꯨꯡ ꯃꯦꯃꯣꯔꯥ ꯄꯨꯔꯨꯕꯥ꯫',
  },
};

export const getReminderTitle = (item: ReminderItem, lang: Language): string => {
  if (item.id && REMINDER_ITEM_TRANSLATIONS[item.id]?.[lang]) {
    return REMINDER_ITEM_TRANSLATIONS[item.id][lang];
  }
  if (item.titles?.[lang]) {
    return item.titles[lang]!;
  }
  if (lang === 'en') return item.titleEn || item.title;
  if (lang === 'as') return item.titleAs || item.titleEn || item.title;
  return item.titleEn || item.title || item.titleAs || '';
};

export const getReminderNotes = (item: ReminderItem, lang: Language): string => {
  if (item.id && REMINDER_NOTES_TRANSLATIONS[item.id]?.[lang]) {
    return REMINDER_NOTES_TRANSLATIONS[item.id][lang];
  }
  if (item.notesLang?.[lang]) {
    return item.notesLang[lang]!;
  }
  if (lang === 'en') return item.notesEn || item.notes || '';
  if (lang === 'as') return item.notesAs || item.notesEn || item.notes || '';
  return item.notes || item.notesEn || item.notesAs || '';
};

export const INITIAL_ALERTS: CaregiverAlert[] = [
  {
    id: 'alert-1-medicine',
    patientId: 'patient-ramesh-1',
    patientName: 'Ramesh Chandra Baruah',
    type: 'missed_medicine',
    severity: 'high',
    status: 'unread',
    title: 'Missed Morning Medicine: Donepezil (5mg)',
    titleEn: 'Missed Morning Medicine: Donepezil (5mg)',
    titleAs: 'পুৱাৰ ঔষধ খাবলৈ বাকী: ডনেপেজিল (৫ মি.গ্ৰা.)',
    description: 'Patient did not acknowledge the 09:00 AM medication prompt on the patient tablet.',
    descriptionEn: 'Patient did not acknowledge the 09:00 AM medication prompt on the patient tablet.',
    descriptionAs: 'ৰোগীয়ে টেবলেটত পুৱা ৯:০০ বজাৰ ঔষধৰ জাননী নিশ্চিত কৰা নাই।',
    relevantItemTitle: 'Morning Blood Pressure & Memory Medicine',
    relevantItemId: 'rem-1-medicine',
    dueTime: '09:00 AM',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'alert-2-hydration',
    patientId: 'patient-ramesh-1',
    patientName: 'Ramesh Chandra Baruah',
    type: 'missed_hydration',
    severity: 'medium',
    status: 'unread',
    title: 'Missed Hydration Reminder',
    titleEn: 'Missed Hydration Reminder',
    titleAs: 'পানী খোৱাৰ সময় পাৰ হ’ল',
    description: 'Scheduled 11:00 AM hydration reminder has not been confirmed. Please offer a fresh glass of water.',
    descriptionEn: 'Scheduled 11:00 AM hydration reminder has not been confirmed. Please offer a fresh glass of water.',
    descriptionAs: '১১:০০ বজাৰ পানী খোৱাৰ সোঁৱৰণি নিশ্চিত হোৱা নাই। অনুগ্ৰহ কৰি কুহুমীয়া পানী খাবলৈ দিয়ক।',
    relevantItemTitle: 'Drink a Glass of Fresh Water',
    relevantItemId: 'rem-2-hydration',
    dueTime: '11:00 AM',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-3-activity',
    patientId: 'patient-ramesh-1',
    patientName: 'Ramesh Chandra Baruah',
    type: 'missed_activity',
    severity: 'low',
    status: 'read',
    title: 'Scheduled Daily Activity Pending',
    titleEn: 'Scheduled Daily Activity Pending',
    titleAs: 'দৈনন্দিন কাৰ্যসূচী বাকী',
    description: 'Afternoon veranda walk scheduled for 04:30 PM yesterday was not recorded.',
    descriptionEn: 'Afternoon veranda walk scheduled for 04:30 PM yesterday was not recorded.',
    descriptionAs: 'আবেলি ৪:৩০ বজাৰ বাৰান্দাৰ খোজ কঢ়াৰ কাৰ্যসূচী সম্পূৰ্ণ কৰা বুলি পঞ্জীয়ন হোৱা নাই।',
    relevantItemTitle: 'Veranda Walk & Garden Fresh Air',
    relevantItemId: 'rem-3-activity',
    dueTime: '04:30 PM',
    timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    readAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: 'alert-4-appointment',
    patientId: 'patient-ramesh-1',
    patientName: 'Ramesh Chandra Baruah',
    type: 'missed_appointment',
    severity: 'high',
    status: 'unread',
    title: 'Medical Appointment Check-in Due',
    titleEn: 'Medical Appointment Check-in Due',
    titleAs: 'চিকিৎসকৰ পৰামৰ্শৰ সময় উপস্থিত',
    description: 'Upcoming monthly neurology follow-up check-in at Apollo Clinic requires caregiver attention.',
    descriptionEn: 'Upcoming monthly neurology follow-up check-in at Apollo Clinic requires caregiver attention.',
    descriptionAs: 'গৌহাটী এপোলো ক্লিনিকত ডাঃ বি. শৰ্মাৰ সৈতে মাহেকীয়া পৰামৰ্শৰ বাবে প্ৰস্তুতি চাব লাগে।',
    relevantItemTitle: 'Neurology Review with Dr. B. Sharma',
    relevantItemId: 'rem-4-appointment',
    dueTime: '11:30 AM',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-5-inactivity',
    patientId: 'patient-ramesh-1',
    patientName: 'Ramesh Chandra Baruah',
    type: 'inactivity',
    severity: 'medium',
    status: 'resolved',
    title: 'Inactivity Notice: No Engagement in 14 Hours',
    titleEn: 'Inactivity Notice: No Engagement in 14 Hours',
    titleAs: 'সক্ৰিয়তাহীনতাৰ জাননী: ১৪ ঘণ্টা ধৰি কোনো কাৰ্যসূচী হোৱা নাই',
    description: 'No cognitive games or routine actions were logged during the overnight-to-morning interval.',
    descriptionEn: 'No cognitive games or routine actions were logged during the overnight-to-morning interval.',
    descriptionAs: 'ৰাতিপুৱাৰ সময়ছোৱাত কোনো জ্ঞানমূলক খেল বা নিয়মীয়া কাৰ্যসূচী পঞ্জীয়ন হোৱা নাছিল।',
    relevantItemTitle: 'Cognitive Activity & Daily Engagement',
    dueTime: 'Continuous Monitoring',
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

export const ALERT_TITLE_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'alert-1-medicine': {
    en: 'Missed Morning Medicine: Donepezil (5mg)',
    as: 'পুৱাৰ ঔষধ খাবলৈ বাকী: ডনেপেজিল (৫ মি.গ্ৰা.)',
    bn: 'সকালের ওষুধ বাকি: ডনেপেজিল (৫ মিগ্রা)',
    ne: 'बिहानको औषधि बाँकी: डोनेपेजिल (५ मिग्रा)',
    lus: 'Zing Damdawi eih loh: Donepezil (5mg)',
    kha: 'Ka dawai step khlem bam: Donepezil (5mg)',
    ny: 'Romrrom si-nam khlem do: Donepezil (5mg)',
    trp: 'ফুংনি সমাই জাগ্ৰি: ডনেপেজিল (৫ মিগ্রা)',
    mni: 'ꯑꯌꯨꯛꯀꯤ ꯍꯤꯗꯥꯛ ꯆꯥꯗ꯭ꯔꯤ: ꯗꯣꯅꯦꯄꯦꯖꯤꯜ (৫mg)',
  },
  'alert-2-hydration': {
    en: 'Missed Hydration Reminder',
    as: 'পানী খোৱাৰ সময় পাৰ হ’ল',
    bn: 'পানি পানের সময় পার হয়েছে',
    ne: 'पानी पिउने समय छुटेको छ',
    lus: 'Tui in theihnghilh hriattirna',
    kha: 'Klet ban dih um',
    ny: 'Asi in-nam klet',
    trp: 'তৈ নুংমা জাগ্ৰি',
    mni: 'ꯏꯁꯤꯡ ꯊꯛꯄꯒꯤ ꯃꯇꯝ ꯂꯥꯟꯊꯣꯛꯈ꯭ꯔꯦ',
  },
  'alert-3-activity': {
    en: 'Scheduled Daily Activity Pending',
    as: 'দৈনন্দিন কাৰ্যসূচী বাকী',
    bn: 'দৈনন্দিন কাজ সম্পন্ন হয়নি',
    ne: 'दैनिक गतिविधि बाँकी छ',
    lus: 'Ni tin thiltih hun kian',
    kha: 'Ka kam sngi khlem leh',
    ny: 'Kari lang-nam do-nam',
    trp: 'সান সাননি সানজাং জাগ্ৰি',
    mni: 'ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯂꯣꯏꯗ꯭ꯔꯤ',
  },
  'alert-4-appointment': {
    en: 'Medical Appointment Check-in Due',
    as: 'চিকিৎসকৰ পৰামৰ্শৰ সময় উপস্থিত',
    bn: 'ডাক্তারের সাথে সাক্ষাতের সময় উপস্থিত',
    ne: 'चिकित्सक भेट्ने समय भयो',
    lus: 'Doctor hmuh hun a thleng',
    kha: 'Ka por iakynduh doktor',
    ny: 'Doctor klam-nam por',
    trp: 'ডাক্তারনি লগ অমুক সান',
    mni: 'ꯗꯣꯛꯇꯔ ꯎꯅꯕꯒꯤ ꯃꯇꯝ ꯌꯧꯔꯛꯂꯦ',
  },
  'alert-5-inactivity': {
    en: 'Inactivity Notice: No Engagement in 14 Hours',
    as: 'সক্ৰিয়তাহীনতাৰ জাননী: ১৪ ঘণ্টা ধৰি কোনো কাৰ্যসূচী হোৱা নাই',
    bn: 'নিষ্ক্রিয়তার বিজ্ঞপ্তি: ১৪ ঘণ্টা ধরে কোনো কাজ নেই',
    ne: 'निष्क्रियता सूचना: १४ घण्टादेखि कुनै गतिविधि छैन',
    lus: 'Thiltih awm loh hriattirna: Darkar 14 chhung',
    kha: 'Jingtip bym don kam: 14 kynta',
    ny: 'Kari lang-nam ho-ma: 14 hours',
    trp: 'কালাংমা খৗবৗর: ১৪ ঘণ্টা কাইচৗং জাগ্ৰি',
    mni: 'ꯊꯕꯛ ꯂꯩꯇꯕꯒꯤ ꯄꯥꯎ: ꯄꯨꯡ ১৪ ꯆꯠꯊꯣꯛ-ꯆꯠꯁꯤꯟ ꯂꯩꯇꯦ',
  },
};

export const ALERT_DESC_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'alert-1-medicine': {
    en: 'Patient did not acknowledge the 09:00 AM medication prompt on the patient tablet.',
    as: 'ৰোগীয়ে টেবলেটত পুৱা ৯:০০ বজাৰ ঔষধৰ জাননী নিশ্চিত কৰা নাই।',
    bn: 'রোগী ট্যাবলেটে সকাল ৯:০০ টার ওষুধের রিমাইন্ডার নিশ্চিত করেননি।',
    ne: 'बिरामीले बिहान ९:०० बजेको औषधिको सूचना पुष्टि गर्नुभएको छैन।',
    lus: 'Patient-in zing dar 9:00 damdawi hriattirna a la chhang lo.',
    kha: 'U nongpang um pat pynshisha ia ka dawai 9:00 step.',
    ny: 'Patient romrrom 9:00 si-nam confirm ho-ma.',
    trp: 'রোগী ৯:০০ ফুংনি সমাই খাপারানি সাক নিশ্চিত খলিয়াই।',
    mni: 'ꯄꯦꯁꯦꯟꯇꯅꯥ ꯑꯌꯨꯛ ꯄꯨꯡ ৯:০০ ꯒꯤ ꯍꯤꯗꯥꯛ ꯆꯥꯕꯒꯤ ꯄꯥꯎ ꯌꯥꯗ꯭ꯔꯤ꯫',
  },
  'alert-2-hydration': {
    en: 'Scheduled 11:00 AM hydration reminder has not been confirmed. Please offer a fresh glass of water.',
    as: '১১:০০ বজাৰ পানী খোৱাৰ সোঁৱৰণি নিশ্চিত হোৱা নাই। অনুগ্ৰহ কৰি কুহুমীয়া পানী খাবলৈ দিয়ক।',
    bn: 'বেলা ১১:০০ টার পানি পানের রিমাইন্ডার নিশ্চিত হয়নি। দয়া করে এক গ্লাস পানি দিন।',
    ne: 'बिहान ११:०० बजे पानी पिउने सूचना पुष्टि भएको छैन। कृपया पानी दिनुहोस्।',
    lus: 'Dar 11:00 tui in hriattirna la chhan a ni lo. Tui in tir rawh.',
    kha: 'Um pat pynshisha ban dih um 11:00. Ai um dih ia u.',
    ny: '11:00 asi in-nam confirm ho-ma. Asi binam le.',
    trp: '১১:০০ ফুংনি তৈ নুংমা নিশ্চিত খলিয়াই। তৈ নুংরদি।',
    mni: 'ꯅꯨꯃꯤꯗꯥꯡꯋꯥꯏ ꯄꯨꯡ ১১:০০ ꯒꯤ ꯏꯁꯤꯡ ꯊꯛꯄꯥ ꯂꯣꯏꯗ꯭ꯔꯤ꯫ ꯏꯁꯤꯡ ꯄꯤꯕꯤꯌꯨ꯫',
  },
  'alert-3-activity': {
    en: 'Afternoon veranda walk scheduled for 04:30 PM yesterday was not recorded.',
    as: 'আবেলি ৪:৩০ বজাৰ বাৰান্দাৰ খোজ কঢ়াৰ কাৰ্যসূচী সম্পূৰ্ণ কৰা বুলি পঞ্জীয়ন হোৱা নাই।',
    bn: 'গতকাল বিকেল ৪:৩০ টার বারান্দায় হাঁটার সময় রেকর্ড করা হয়নি।',
    ne: 'हिजो दिउँसो ४:३० बजेको हिंड्ने समय रेकर्ड भएको छैन।',
    lus: 'Nimah dar 4:30 chawhnu lenkual thiltih ziah a ni lo.',
    kha: 'Ka jingshang ha veranda 4:30 janmiet ym shym la thoh.',
    ny: 'Veranda walk 4:30 record ho-ma.',
    trp: 'বাৰান্দাত খোজ কঢ়া ৪:৩০ রেকর্ড খলিয়াই।',
    mni: 'ꯉꯔꯥꯡ ꯅꯨꯃꯤꯗꯥꯡ ꯄꯨꯡ ৪:৩০ ꯒꯤ ꯆꯠꯄꯥ ꯊꯕꯛ ꯔꯦꯀꯣꯔ꯭ꯗ ꯇꯧꯗꯦ꯫',
  },
  'alert-4-appointment': {
    en: 'Upcoming monthly neurology follow-up check-in at Apollo Clinic requires caregiver attention.',
    as: 'গৌহাটী এপোলো ক্লিনিকত ডাঃ বি. শৰ্মাৰ সৈতে মাহেকীয়া পৰামৰ্শৰ বাবে প্ৰস্তুতি চাব লাগে।',
    bn: 'অ্যাপোলো ক্লিনিকে মাসিক নিউরোলজি ফলো-আপের জন্য প্রস্তুতি প্রয়োজন।',
    ne: 'अपोलो क्लिनिकमा मासिक न्युरोलोजी जाँचका लागि तयारी आवश्यक छ।',
    lus: 'Apollo Clinic a neurology in check-up tura inbuatsaih a ngai.',
    kha: 'Donkam ban khreh ban leit sha Apollo Clinic ban iakynduh doktor.',
    ny: 'Apollo Clinic neurology check-up le preparation do.',
    trp: 'অ্যাপোলো ক্লিনিকত ডাক্তারনি সানজাং প্রস্তুতি নাংগো।',
    mni: 'ꯑꯦꯄꯣꯂꯣ ꯀ꯭ꯂꯤꯅꯤꯛꯇꯥ ꯗꯣꯛꯇꯔ ꯎꯅꯅꯕꯥ ꯀꯦꯌꯔꯒꯤꯚꯔꯅꯥ ꯁꯦꯝ-ꯁꯥꯕꯥ ꯃꯊꯧ ꯇꯥꯏ꯫',
  },
  'alert-5-inactivity': {
    en: 'No cognitive games or routine actions were logged during the overnight-to-morning interval.',
    as: 'ৰাতিপুৱাৰ সময়ছোৱাত কোনো জ্ঞানমূলক খেল বা নিয়মীয়া কাৰ্যসূচী পঞ্জীয়ন হোৱা নাছিল।',
    bn: 'রাত থেকে সকালের মধ্যে কোনো গেম বা রুটিন কাজ রেকর্ড করা হয়নি।',
    ne: 'रातदेखि बिहानसम्म कुनै खेल वा दैनिक काम रेकर्ड गरिएको छैन।',
    lus: 'Zan aṭanga zing thleng thiltih emaw infiamna engmah ziah a ni lo.',
    kha: 'Ym don ba ialehkai ne leh kam naduh miet haduh step.',
    ny: 'Game do routine activity lang-nam ho-ma.',
    trp: 'হরনি সিম ফুং পর্যন্ত কাইচৗং জাগ্ৰি।',
    mni: 'ꯑꯍꯤꯡꯗꯒꯤ ꯑꯌꯨꯛ ꯐꯥꯎꯕꯗꯥ ꯑꯃꯇꯥ ꯒꯦꯝ ꯁꯥꯅꯕꯥ ꯅꯠꯇ꯭ꯔꯒ ꯊꯕꯛ ꯂꯩꯇꯦ꯫',
  },
};

export const getAlertTitle = (alert: CaregiverAlert, lang: Language): string => {
  if (alert.id && ALERT_TITLE_TRANSLATIONS[alert.id]?.[lang]) {
    return ALERT_TITLE_TRANSLATIONS[alert.id][lang];
  }
  if (alert.titles?.[lang]) {
    return alert.titles[lang]!;
  }
  if (lang === 'en') return alert.titleEn || alert.title;
  if (lang === 'as') return alert.titleAs || alert.titleEn || alert.title;
  return alert.titleEn || alert.title || alert.titleAs || '';
};

export const getAlertDescription = (alert: CaregiverAlert, lang: Language): string => {
  if (alert.id && ALERT_DESC_TRANSLATIONS[alert.id]?.[lang]) {
    return ALERT_DESC_TRANSLATIONS[alert.id][lang];
  }
  if (alert.descriptions?.[lang]) {
    return alert.descriptions[lang]!;
  }
  if (lang === 'en') return alert.descriptionEn || alert.description || '';
  if (lang === 'as') return alert.descriptionAs || alert.descriptionEn || alert.description || '';
  return alert.description || alert.descriptionEn || alert.descriptionAs || '';
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
      ny: 'Anyi',
      lus: 'Fanu',
      kha: 'Khun kynthei',
      trp: 'বৗচৗক',
      mni: 'ꯃꯆꯥꯅꯨꯄꯤ (মচানুপী)',
    },
    transcript: {
      en: 'Hi Dad, it is Sunita! Did you take your morning tea? I will visit you soon!',
      as: 'দেউতা, মই আপোনাৰ মৰমৰ সুনীতা। আপুনি পুৱাৰ চাহ খালে নে? মই সোনকালে আহিম দেই!',
      bn: 'বাবা, আমি সুনীতা! সকালের চা খেয়েছো? আমি তাড়াতাড়ি দেখা করতে আসবো!',
      ne: 'बुबा, म सुनिता हुँ! बिहानको चिया खानुभयो? म छिट्टै भेट्न आउँछु!',
      ny: 'Aba, ngo Sunita! Romrrom cha do-ka? Ngo ela ar.',
      lus: 'Ka pa, keima Sunita! Zing thingpui i in tawh em? Ka lo kalleng ngai dawn.',
      kha: 'Pa, nga dei Sunita! La dih cha step? Nga sa wan shen!',
      trp: 'আপা, আং সুনীতা! ফুংনি চা নুংখা? আং খাসালোন ফাইদি।',
      mni: 'ꯏꯕꯥꯕꯥ, ꯑꯩꯍꯥꯛ ꯁꯨꯅꯤꯇꯥꯅꯤ! ꯑꯌꯨꯛꯀꯤ ꯆꯥ ꯊꯛꯈ꯭ꯔꯕ꯭ꯔꯥ? ꯑꯩꯍꯥꯛ ꯊꯨꯅ ꯎꯅꯕ ꯂꯥꯛꯀꯅꯤ! (ইবাবা, ঐহাক সুনীতানি! অয়ুক্কী চা থক্খ্রব্রা? ঐহাক থুন উনবা লাক্কনি!)',
    },
  },
  'fam-priyam': {
    relationship: {
      en: 'Grandson',
      as: 'নাতি',
      bn: 'নাতি',
      ne: 'नाति',
      ny: 'Achu',
      lus: 'Tu',
      kha: 'Khun ksiew',
      trp: 'চুয়াই',
      mni: 'ꯃꯁꯨ ꯅꯨꯄꯥ (মসু নুপা)',
    },
    transcript: {
      en: 'Grandpa, it is Priyam! Today we both will go for a walk in the garden, okay?',
      as: 'ককা, মই প্ৰিয়ম! আজি আমি দুয়ো ফুলনিত খোজ কাঢ়িবলৈ যাম দেই।',
      bn: 'দাদু, আমি প্রিয়ম! আজ আমরা দুজনে বাগানে হাঁটতে যাবো, ঠিক আছে?',
      ne: 'हजुरबुबा, म प्रियम! आज हामी दुवै बगैंचामा घुम्न जानेछौं, हुन्छ?',
      ny: 'Ato, ngo Priyam! Longo ngo-no chak-nam le-ka.',
      lus: 'Pupu, keima Priyam! Vawiin chu huan-ah ka inlentual dawn nia.',
      kha: 'Kpa-rad, nga dei Priyam! Mynnta ngi sa iaid kai ha kper, hooid?',
      trp: 'আচু, আং প্রিয়ম! তিনী চুক বাগানো লামচা হিনো।',
      mni: 'ꯏꯄꯨ, ꯑꯩꯍꯥꯛ ꯄ꯭ꯔꯤꯌꯃꯅꯤ! ꯉꯁꯤ ꯑꯩꯈꯣꯏ ꯑꯅꯤ ꯂꯩꯀꯣꯜꯗ ꯆꯠꯅꯁꯤ, ꯌꯥꯔꯕ꯭ꯔꯥ? (ইপু, ঐহাক প্রিয়মনি! ঙসি ঐখোই অনি লৈ কোল্দ চৎনসি, য়ারব্রা?)',
    },
  },
  'fam-dipankar': {
    relationship: {
      en: 'Son',
      as: 'পুত্ৰ',
      bn: 'পুত্র',
      ne: 'छोरा',
      ny: 'Au',
      lus: 'Fapa',
      kha: 'Khun shynrang',
      trp: 'বৗচলা',
      mni: 'ꯃꯆꯥꯅꯨꯄꯥ (মচানুপা)',
    },
    transcript: {
      en: 'Dad, this is Dipankar. Take your medicines on time, everything is well at home.',
      as: 'দেউতা, মই দীপংকৰ। চিন্তা নকৰিব, ঔষধখিনি মন দি খাব, সকলো ভালে আছে।',
      bn: 'বাবা, আমি দীপঙ্কর। সময়মতো ওষুধ খাবেন, বাড়ির সবাই ভালো আছে।',
      ne: 'बुबा, म दिपङ्कर हुँ। समयमा औषधि खानुहोला, घरमा सबै ठीक छ।',
      ny: 'Aba, ngo Dipankar. Si-nam do-ka, nam-lo albo.',
      lus: 'Ka pa, Dipankar ka ni e. Damdawi ei theihnghilh suh, in lam chu thil engkim a tha.',
      kha: 'Pa, nga dei Dipankar. Bam dawai ha ka por, ha iing baroh ka biang.',
      trp: 'আপা, আং দীপঙ্কর। সমাই চাদি, নখরো বরোক কাহাম।',
      mni: 'ꯏꯕꯥꯕꯥ, ꯑꯩꯍꯥꯛ ꯗꯤꯄꯪꯀꯔꯅꯤ꯫ ꯃꯇꯝ ꯆꯥꯅ ꯍꯤꯗꯥꯛ ꯆꯥꯕꯤꯌꯨ, ꯌꯨꯃꯗ ꯄꯨꯝꯅꯃꯛ ꯐꯔꯦ꯫ (ইবাবা, ঐহাক দীপংকরনি। মতম চানা হীদাক চাবীয়ু, য়ুমদা পুম্নমক ফরে।)',
    },
  },
  'fam-manju': {
    relationship: {
      en: 'Wife',
      as: 'পত্নী',
      bn: 'স্ত্রী',
      ne: 'श्रीमती',
      ny: 'Anying',
      lus: 'Nupi',
      kha: 'Tnga',
      trp: 'বিহিক',
      mni: 'ꯇꯂꯣꯏ / ꯅꯨꯄꯤ (নুপী)',
    },
    transcript: {
      en: 'Namaskar Ramesh, let us sit together and enjoy the evening breeze.',
      as: 'নমস্কাৰ, মই মঞ্জু। চাহ খাই লওকচোন, চোতালৰ বতাহখিনি বৰ শান্ত।',
      bn: 'নমস্কার রমেশ, এসো একসাথে বসি আর শান্ত বাতাস উপভোগ করি।',
      ne: 'नमस्ते रमेश, सँगै बसेर साँझको हावाको आनन्द लिऊँ।',
      ny: 'Albo Ramesh, ngo Manju! Dolo bemin tatka.',
      lus: 'Chibai Ramesh, keima Manju! Tlai boruak nuam tak hi i dawng dun ang hmiang.',
      kha: 'Khublei Ramesh, nga dei Manju! Shong ryngkat bad bam lyer janmiet ba suki.',
      trp: 'খুলুমখা রমেশ, আং মঞ্জু! সানজানি বারো বচাদি।',
      mni: 'ꯈꯨꯔꯨꯝꯖꯔꯤ ꯔꯃꯦꯁ, ꯑꯩꯈꯣꯏ ꯄꯨꯟꯅ ꯐꯃꯗꯨꯅ ꯅꯨꯃꯤꯗꯥꯡꯒꯤ ꯅꯨꯡꯁꯤꯠ ꯅꯨꯡꯉꯥꯏꯅ ꯐꯥꯎꯁꯤ꯫ (খুরুমজরি রমেশ, ঐখোই পুন্না ফমদুনা নুমিদাংগী নুংশিৎ নুংঙাইনা ফাওসি।)',
    },
  },
  'fam-kavita': {
    relationship: {
      en: 'Sister',
      as: 'ভনী',
      bn: 'বোন',
      ne: 'बहिनी',
      ny: 'Ami',
      lus: 'Farnu',
      kha: 'Para kynthei',
      trp: 'বৗবুক',
      mni: 'ꯏꯆꯦ / ꯏꯆꯜ (ইচে / ইচল)',
    },
    transcript: {
      en: 'Hello Ramesh, this is Kavita speaking!',
      as: 'নমস্কাৰ ৰমেশ, মই কবিতা বাইদেউ!',
      bn: 'নমস্কার রমেশ, আমি কবিতা বলছি!',
      ne: 'नमस्ते रमेश, म कविता बोल्दैछु!',
      ny: 'Albo Ramesh, ngo Kavita!',
      lus: 'Chibai Ramesh, keima Kavita ka ni e!',
      kha: 'Khublei Ramesh, nga dei Kavita ba kren!',
      trp: 'খুলুমখা রমেশ, আং কবিতা কক সাগো!',
      mni: 'ꯈꯨꯔꯨꯝꯖꯔꯤ ꯔꯃꯦꯁ, ꯑꯩꯍꯥꯛ ꯀꯕꯤꯇꯥꯅꯤ! (খুরুমজরি রমেশ, ঐহাক কবিতানি!)',
    },
  },
  'fam-biren': {
    relationship: {
      en: 'Brother',
      as: 'ভাই',
      bn: 'ভাই',
      ne: 'भाइ',
      ny: 'Aching',
      lus: 'Unaupa',
      kha: 'Para shynrang',
      trp: 'তাকলায়',
      mni: 'ꯏꯅꯥꯎ / ꯏꯌꯥꯝꯕ (ইনাও / ইয়াম্বা)',
    },
    transcript: {
      en: 'Ramesh brother, good to see you!',
      as: 'ৰমেশ ভাই, সকলো ভালে আছে নে!',
      bn: 'রমেশ ভাই, কেমন আছো, সবাই ভালো তো!',
      ne: 'रमेश भाइ, कस्तो छ तिमीलाई, सबै ठीक छ नि!',
      ny: 'Albo Ramesh, ngo Biren!',
      lus: 'Ramesh unaupa, i hmel hmuh a va tha em!',
      kha: 'Ramesh para, sngewbha ban iohi ia phi!',
      trp: 'রমেশ বাই, নুকমানি কাহাম খালাংখা!',
      mni: 'ꯔꯃꯦꯁ ꯏꯅꯥꯎ, ꯅꯉꯕꯨ ꯎꯕꯗ ꯅꯨꯡꯉꯥꯏ! (রমেশ ইনাও, নঙবু উবদা নুংঙাই!)',
    },
  },
  'fam-anita': {
    relationship: {
      en: 'Daughter-in-law',
      as: 'বোৱাৰী',
      bn: 'বৌমা',
      ne: 'बुहारी',
      ny: 'Angu',
      lus: 'Mo',
      kha: 'Khun kurim',
      trp: 'বৗহুক',
      mni: 'ꯃꯧ (মৌ)',
    },
    transcript: {
      en: 'Namaskar Deuta, tea is ready.',
      as: 'নমস্কাৰ দেউতা, চাহ তৈয়াৰ হৈছে।',
      bn: 'নমস্কার বাবা, চা তৈরি হয়েছে।',
      ne: 'नमस्ते बुबा, चिया तयार भयो।',
      ny: 'Albo Aba, cha albo.',
      lus: 'Chibai ka pa, thingpui a inpeih tawh e.',
      kha: 'Khublei pa, ka cha la pynkhreh.',
      trp: 'খুলুমখা আপা, চা মনখা।',
      mni: 'ꯈꯨꯔꯨꯝꯖꯔꯤ ꯏꯕꯥꯕꯥ, ꯆꯥ ꯁꯦꯝꯔꯦ꯫ (খুরুমজরি ইবাবা, চা শেমরে।)',
    },
  },
};

const DEFAULT_GREETINGS: Record<Language, (name: string) => string> = {
  en: (name) => `Hello, this is ${name}!`,
  as: (name) => `নমস্কাৰ, মই ${name}!`,
  bn: (name) => `নমস্কার, আমি ${name}!`,
  ne: (name) => `नमस्ते, म ${name}!`,
  lus: (name) => `Chibai, ${name} ka ni e!`,
  kha: (name) => `Khublei, nga dei ${name}!`,
  ny: (name) => `Albo, ngo ${name}!`,
  trp: (name) => `খুলুমখা, আং ${name}!`,
  mni: (name) => `ꯈꯨꯔꯨꯝꯖꯔꯤ, ꯑꯩꯍꯥꯛ ${name}ꯅꯤ! (খুরুমজরি, ঐহাক ${name}নি!)`,
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
    case 'mni':
      if (member.voiceTranscriptMni) return member.voiceTranscriptMni;
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
      lus: 'Inbiakpawhna',
      kha: 'Ka jingiakren',
      ny: 'Agan-akam',
      trp: 'কক লামা',
      mni: 'ꯋꯥꯇꯥꯟ-ꯄꯥꯎꯇꯥꯟ (ৱাতান-পাউতান)',
    },
    title: {
      en: 'Communicating with Calmness & Dignity',
      as: 'শান্ত আৰু মৰমেৰে কথা পতাৰ অভ্যাস',
      bn: 'শান্ত ও শ্রদ্ধার সাথে কথা বলার অভ্যাস',
      ne: 'शान्त र आदरपूर्वक कुरा गर्ने बानी',
      lus: 'Thlamuan thlak tak leh zahawm taka biakna',
      kha: 'Kren da ka jingsuk bad jingniewkor',
      ny: 'Albo mongo agan',
      trp: 'খা কৗথাম তেই মান দিয়েই কক সুরমা',
      mni: 'ꯇꯞꯅ ꯑꯃꯁꯨꯡ ꯏꯀꯥꯏ ꯈꯨꯝꯅꯕꯒ ꯂꯣꯏꯅꯅ ꯋꯥꯔꯤ ꯁꯥꯅꯕ (তপ্না ৱারী শানবা)',
    },
    summary: {
      en: 'Speak in short, gentle sentences with eye contact and a warm smile. Never argue or test their memory abruptly.',
      as: 'চমুকৈ, শান্ত কণ্ঠেৰে আৰু চকুলৈ চাই কথা পাতক। কেতিয়াও জোৰ কৰি মনত পেলাবলৈ হেঁচা নিদিব।',
      bn: 'ছোট, শান্ত বাক্যে চোখে চোখ রেখে হাসিমুখে কথা বলুন। জোর করে স্মৃতি পরীক্ষা করার চেষ্টা করবেন না।',
      ne: 'छोटो, शान्त वाक्यमा आँखामा हेरेर मुस्कुराउँदै कुरा गर्नुहोस्। कहिल्यै पनि जबरजस्ती सम्झाउने प्रयास नगर्नुहोस्।',
      lus: 'Thu tawi, nem takin sawi la, en chungin nui hmel pu rawh. An hriatna fiah tum suh.',
      kha: 'Kren ha ki kyntien kiba lyngkot bad kiba jem, peit ha ki khmat da ka jingphuhmut. Wat ju pyrshang ban tynjuh ia ka jingkynmaw.',
      ny: 'Akam agan albo mongo do. Arek pennam ma. Tag-nam tag-ka.',
      trp: 'খাতুং কক তেনেই, খুকনি মিনাইয়েই কক সা। জোর খ্লাইয়ে উয়ানসুমানি চেষ্টা তা খ্লাই।',
      mni: 'ꯇꯦꯟꯅ, ꯇꯞꯅ ꯑꯃꯁꯨꯡ ꯃꯤꯠ ꯎꯅꯗꯨꯅ ꯋꯥ ꯉꯥꯡꯕꯤꯌꯨ꯫ ꯃꯈꯣꯏꯒꯤ ꯅꯤꯡꯁꯤꯡꯕ ꯆꯥꯡꯌꯦꯡ ꯇꯧꯕꯤꯒꯅꯨ꯫ (তপ্না ৱা ঙাংবীয়ু)',
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
        'Aw dam tak leh hmanhmawh lo tak hmang rawh.',
        'Chhanna pe turin hun pe tam rawh.',
        '\'I hre tawh lo em ni?\' ti suh la, \'Hei hi i fanu Sunita a nih hi\' ti zawk rawh.',
        'Kuta chelh te hian thlamuanna nasa tak a pe thin.',
      ],
      kha: [
        'Kren da ka sur ba jem bad ka bym don jingkyrkieh.',
        'Ai por ba pura ban pyrkhat bad ban ioh jubab.',
        'Wat ong \'Bym kynmaw shuh?\', pynkynmaw pynban \'Ine dei i khun jong phi i Sunita\'.',
        'Kaba bat ia ki kti da ka jingieid ka ai jingiada kaba khraw.',
      ],
      ny: [
        'Albo sur agan do, longo ma.',
        'Agan mit-nam samay go-ka.',
        '\'Mit-mek ma?\' ta agan, \'Hie Suniti\' agan do.',
        'Albo alag bennam go-ka.',
      ],
      trp: [
        'সুস্থির তেই হামজাকনাই সুরেই কক সা।',
        'কক সিমানি তেই সানমানি বাগৈ সময় রি।',
        '\'উয়ানসুকুইয়া দে?\' তা সা, \'অ নাইদি নিনি বৗচৗক সুনীতা\' সা।',
        'হামজাকমায়েই য়াক রিমখে বোরোক কাহাম খাপাঙ্গোয়।',
      ],
      mni: [
        'ꯇꯞꯅ ꯑꯃꯁꯨꯡ ꯅꯨꯡꯁꯤꯕ ꯈꯣꯟꯊꯣꯛꯇ ꯋꯥ ꯉꯥꯡꯕꯤꯌꯨ꯫',
        'ꯋꯥ ꯈꯪꯕ ꯑꯃꯁꯨꯡ ꯄꯥꯎꯈꯨꯝ ꯄꯤꯕꯗ ꯃꯇꯝ ꯃꯄꯨꯡ ꯐꯥꯅ ꯄꯤꯕꯤꯌꯨ꯫',
        '\'ꯅꯤꯡꯁꯤꯡꯗꯦꯕ꯭ꯔꯥ?\' ꯍꯥꯏꯅ ꯍꯪꯕꯤꯒꯅꯨ, ꯃꯍꯨꯠꯇ \'ꯃꯁꯤ ꯅꯍꯥꯛꯀꯤ ꯃꯆꯥꯅꯨꯄꯤ ꯁꯨꯅꯤꯇꯥꯅꯤ\' ꯍꯥꯏꯕꯤꯌꯨ꯫',
        'ꯈꯨꯠ ꯄꯥꯏꯕꯤꯕꯅ ꯌꯥꯝꯅ ꯅꯨꯡꯉꯥꯏꯕ ꯑꯃꯁꯨꯡ ꯊꯧꯅꯥ ꯄꯤ꯫',
      ],
    },
  },
  'tip-2': {
    category: {
      en: 'Daily Habits',
      as: 'দৈনন্দিন অভ্যাস',
      bn: 'দৈনন্দিন অভ্যাস',
      ne: 'दैनिक बानीहरू',
      lus: 'Nitin thil tih',
      kha: 'Ki jingmlien ba man ka sngi',
      ny: 'Romrrom kam',
      trp: 'সালব্রুমনি অভ্যাস',
      mni: 'ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯆꯠꯅꯕꯤ (নুমিৎ খুদিংগী চৎনবী)',
    },
    title: {
      en: 'The Reassuring Power of Daily Routines',
      as: 'দৈনন্দিন নিয়মীয়া ৰুটিনৰ গুৰুত্ব',
      bn: 'নিয়মিত দৈনন্দিন রুটিনের গুরুত্ব',
      ne: 'नियमित दैनिक तालिकाको महत्त्व',
      lus: 'Nitin kalhmang felfai thatna',
      kha: 'Ka bor jong ka rukom im ba man ka sngi',
      ny: 'Romrrom longo tennan',
      trp: 'সালব্রুমনি নিয়মনি বল',
      mni: 'ꯆꯠꯅꯔꯤꯕ ꯔꯨꯇꯤꯟꯒꯤ ꯃꯍꯩ ꯑꯃꯁꯨꯡ ꯀꯥꯟꯅꯕ (রুটিনগী কান্নবা)',
    },
    summary: {
      en: 'Predictable schedules decrease anxiety and confusion for people living with memory loss.',
      as: 'প্ৰতিদিনে একে সময়ত একে ধৰণৰ কাম কৰিলে মানসিক অস্থিৰতা আৰু বিভ্ৰান্তি বহু পৰিমাণে হ্ৰাস পায়।',
      bn: 'প্রতিদিন একই সময়ে কাজ করলে মানসিক অস্থিরতা ও দ্বিধাদ্বন্দ্ব অনেকটাই কমে যায়।',
      ne: 'हरेक दिन एउटै समयमा काम गर्दा मानसिक अन्योल र चिन्ता धेरै कम हुन्छ।',
      lus: 'Nitin tih tur fel tak neih hian rilru hahna a tireh thin.',
      kha: 'Ka rukom trei kam ba thikna ka pynduna ia ka jingkulmar jingmut.',
      ny: 'Romrrom longo kam do mongo albo.',
      trp: 'সালব্রুম একে সময়ো সামুং খ্লাইখে খাপাং তেই বুদ্ধি সুস্থি তংগো।',
      mni: 'ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯆꯞ ꯃꯥꯟꯅꯕ ꯃꯇꯝꯗ ꯊꯕꯛ ꯇꯧꯕꯅ ꯋꯥꯈꯜ ꯋꯥꯕ ꯑꯃꯁꯨꯡ ꯂꯥꯡꯇꯛꯅꯕ ꯍꯟꯊꯍꯜꯂꯤ꯫',
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
        'Thawh hun, chaw ei hun leh chawlh hun ti danglam suh.',
        'Room chhungah thlalak leh hriatfiah awlsam tur thil dah rawh.',
        'Zing nisa hnuaiah tei kual emaw thut hahdam pui rawh.',
        'Pangpar tui pek ang chi thil ho te te tih tir rawh.',
      ],
      kha: [
        'Pynneh ia ka por khie thiah, bam ja bad shongthait ba kan ia ryngkat.',
        'Buh ia ki dur ba ithuh bad ki dak kiba shai ha ka kamra.',
        'Pynshlur ban iaid kai ha ka sngi step lane ban shong ha baranda.',
        'Kynshew ia ki ha ki kam rit kum ban theh um ia ki syntiew.',
      ],
      ny: [
        'Hu-nam, do-nam, be-nam samay tennan go-ka.',
        'Nam-lo photo do sanket akam le-ka.',
        'Romrrom longo chak-nam do albo.',
        'Apun-ale ti-nam kam do arek le-ka.',
      ],
      trp: [
        'ফুংনি তুংমা, চামুং তেই নুহুরানি সময় একে থনদি।',
        'নখো চিনাকি ফটো তেই চিহ্ন কৗথার তনদি।',
        'ফুংনি সালো বারান্দাত বচাফা তেই লামচা হিমা কাহাম।',
        'ম্বরংগো ত্যুই রিমা বাই খাকলাই সামুংগো রপফা।',
      ],
      mni: [
        'ꯍꯧꯒꯠꯄ, ꯆꯥꯕ-ꯊꯛꯄ ꯑꯃꯁꯨꯡ ꯄꯣꯊꯥꯕꯒꯤ ꯃꯇꯝ ꯂꯦꯡꯗꯅ ꯊꯝꯃꯨ꯫',
        'ꯀꯥ ꯃꯅꯨꯡꯗ ꯃꯁꯛ ꯈꯪꯕ ꯐꯣꯇꯣ ꯑꯃꯁꯨꯡ ꯃꯌꯦꯛ ꯁꯦꯡꯕ ꯈꯨꯗꯝꯁꯤꯡ ꯊꯝꯃꯨ꯫',
        'ꯑꯌꯨꯛꯀꯤ ꯅꯨꯃꯤꯠ ꯃꯉꯥꯜꯗ ꯆꯠꯆꯠ-ꯆꯠꯄ ꯅꯠꯇ꯭ꯔꯒ ꯕꯔꯥꯟꯗꯥꯗ ꯐꯝꯍꯜꯂꯨ꯫',
        'ꯂꯩ ꯏꯁꯤꯡ ꯆꯩꯕ ꯒꯨꯝꯕ ꯑꯄꯤꯛꯄ ꯊꯕꯛꯁꯤꯡꯗ ꯌꯥꯎꯍꯜꯂꯨ꯫',
      ],
    },
  },
  'tip-3': {
    category: {
      en: 'Comfort & Validation',
      as: 'সঁহাৰি আৰু মানসিক শান্তি',
      bn: 'মানসিক সমর্থন ও সান্ত্বনা',
      ne: 'मानसिक शान्ति र भरोसा',
      lus: 'Thlamuanna leh hriatthiamna',
      kha: 'Ka jingpynsuk bad jingpynshngain',
      ny: 'Albo mongo shanti',
      trp: 'খাপাংনি শান্তি',
      mni: 'ꯅꯨꯡꯉꯥꯏꯅ ꯊꯝꯕ ꯑꯃꯁꯨꯡ ꯊꯧꯅꯥ ꯄꯤꯕ (নুংঙাইনা থম্বা)',
    },
    title: {
      en: 'Handling Confusion & Repetitive Questions',
      as: 'বিভ্ৰান্তি আৰু একে কথা বাৰে বাৰে সোধাৰ সমাধান',
      bn: 'বিভ্রান্তি ও একই কথা বারবার জিজ্ঞাসার সমাধান',
      ne: 'अलमल र दोहोरिने प्रश्नहरू कसरी सम्हाल्ने',
      lus: 'Rilru buai leh zawhna in-ang zawt nawn chinfel dan',
      kha: 'Balei kulmar jingmut bad ka jingkylli kaba man ka por',
      ny: 'Agan mit-mek do tennan pennam',
      trp: 'খাপাং বিভ্রান্তি তেই বারে বারে সউংমানি প্রতিকার',
      mni: 'ꯋꯥꯈꯜ ꯂꯥꯡꯇꯛꯅꯕ ꯑꯃꯁꯨꯡ ꯍꯪꯖꯤꯟ-ꯍꯪꯖꯤꯟ ꯋꯥ ꯍꯪꯕ ꯀꯣꯛꯍꯟꯕ',
    },
    summary: {
      en: 'Validate the emotion behind the words rather than correcting factual errors.',
      as: 'ভুল আঙুলিয়াই নিদি তেওঁলোকৰ মনৰ আবেগক বুজিবলৈ চেষ্টা কৰক।',
      bn: 'ভুল না শুধরে তাদের মনের আবেগকে বুঝতে চেষ্টা করুন।',
      ne: 'गल्ती औंल्याउनुको सट्टा उहाँहरूको भावनालाई बुझ्ने प्रयास गर्नुहोस्।',
      lus: 'Thil dik lo hrilhfiah tum aiah an rilru puthmang hriatsak tum rawh.',
      kha: 'Sngewthuh ia ka jingmut ha ka jaka ban pynbeit ia ki jingbakla.',
      ny: 'Agan bhul ma, mongo bhav mit-ka.',
      trp: 'ভুল না সাফারিখা খাপাংনি কষ্টনো বুজিদি।',
      mni: 'ꯑꯁꯣꯏꯕ ꯇꯥꯛꯄꯗꯒꯤ ꯃꯈꯣꯏꯒꯤ ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯥꯎꯕ ꯑꯗꯨ ꯂꯧꯁꯤꯟꯕꯤꯌꯨ꯫',
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
        '\'Inah ka haw duh\' an tih fo chuan, \'Ka kiangah i him e\' tiin hrilh rawh.',
        'Ni leh hming dik lo chungchangah inhnial suh.',
        'Thlalak enpui emaw thingpui tui tak pein an rilru la peng rawh.',
        'Tlailam-ah rilru buai a awm chuan rimawi zawi tak ngaithlak tir rawh.',
      ],
      kha: [
        'Lada ki ong \'leit sha iing\', ki kwah jingshngain; ong \'phi don ryngkat bad nga, wat sheptieng\'.',
        'Wat iatai nia halor ki tarik lane ki kyrteng ba bakla.',
        'Pynphai ia ka jingmut da kaba pyni dur iing lane ai shi khuri cha.',
        'Tem ia ki jingrwai ba jem haba don ka jingpisa jingmut janmiet.',
      ],
      ny: [
        '\'Nam-lo ar\' agan-bo, \'Ngo no-lo do, albo\' agan.',
        'Din-tarikh bhul agan-bo vad-vivad ta le-ka.',
        'Akam photo ene cha do mongo ghuman-ka.',
        'Dolo mongo ashanti be-bo bemin sur tatka.',
      ],
      trp: [
        '\'নখো থাংনো\' সাকাপ বোরোক শান্তি মুচুংগো; সা \'আং নিনি লগে তংগো, খাপাং তা খরপ\'।',
        'সাল-তারিখ তেই নাম ভুল সাখে তর্ক তা খ্লাই।',
        'চিনাকি ফটো তিন্তিখে তেই চা তেনিয়ে মন অন্যফালে সানদি।',
        'সানজানি সমায়ো খাপাং ছটফট খ্লাইখে রিমাউই কাহাম খুনদি।',
      ],
      mni: [
        'ꯀꯔꯤꯒꯨꯝꯕ \'ꯌꯨꯃꯗ ꯍꯜꯂꯁꯤ\' ꯍꯥꯏꯅ ꯍꯪꯂꯛꯂꯕꯗꯤ, ꯃꯈꯣꯏꯅ ꯅꯤꯡꯇꯝꯕ ꯑꯃꯁꯨꯡ ꯅꯨꯡꯉꯥꯏꯕ ꯊꯤꯔꯤ; \'ꯑꯩꯈꯣꯏ ꯂꯣꯏꯅꯅ ꯂꯩꯔꯤ, ꯆꯤꯟꯇꯥ ꯇꯧꯕꯤꯒꯅꯨ\' ꯍꯥꯏꯕꯤꯌꯨ꯫',
        'ꯆꯩꯆꯠ ꯅꯠꯇ꯭ꯔꯒ ꯃꯃꯤꯡ ꯑꯁꯣꯏꯕꯗ ꯈꯠꯅꯕꯤꯒꯅꯨ꯫',
        'ꯃꯁꯛ ꯈꯪꯕ ꯐꯣꯇꯣ ꯎꯠꯇꯨꯅ ꯅꯠꯇ꯭ꯔꯒ ꯆꯥ ꯊꯛꯍꯟꯗꯨꯅ ꯋꯥꯈꯜ ꯑꯇꯣꯞꯄꯗ ꯂꯩꯍꯟꯂꯨ꯫',
        'ꯅꯨꯃꯤꯗꯥꯡꯋꯥꯏꯔꯝ ꯋꯥꯈꯜ ꯂꯥꯡꯇꯛꯅꯔꯛꯂꯕꯗꯤ ꯇꯞꯄ ꯏꯁꯩ ꯇꯥꯍꯟꯂꯨ꯫',
      ],
    },
  },
  'tip-4': {
    category: {
      en: 'Reminiscence',
      as: 'স্মৃতি সজীৱ কৰা',
      bn: 'স্মৃতিচারণ',
      ne: 'स्मरण र स्मृति',
      lus: 'Hmanlai hriatnawm',
      kha: 'Kynmaw ia ki por ba la leit',
      ny: 'Akam mit-nam',
      trp: 'স্বকাংনি স্মৃতি',
      mni: 'ꯅꯤꯡꯁꯤꯡ ꯋꯥꯔꯤ (নিংসিং ৱারী)',
    },
    title: {
      en: 'Reminiscence & Familiar North Eastern Memories',
      as: 'পুৰণি স্মৃতি আৰু চিনাকি পৰিৱেশ',
      bn: 'পুরোনো স্মৃতি ও পরিচিত সংস্কৃতি',
      ne: 'पुराना सम्झना र स्थानीय संस्कृति',
      lus: 'Hmanlai thil leh nunhlui hriatchhuah',
      kha: 'Ki jingkynmaw shaphang ka iing bad ki por hyndai',
      ny: 'Akam longo do sanskriti',
      trp: 'স্বকাংনি খাপাং তেই নখরোনি স্মৃতি',
      mni: 'ꯅꯤꯡꯁꯤꯡ ꯋꯥꯔꯤ ꯑꯃꯁꯨꯡ ꯂꯝꯗꯝꯁꯤꯒꯤ ꯄꯨꯋꯥꯔꯤ (নিংসিং ৱারী অমসুং পুৱারী)',
    },
    summary: {
      en: 'Long-term memories often remain strong even as short-term memory fades. Tap into cherished childhood and cultural roots.',
      as: 'নিকট অতীত পাহৰিলেও পুৰণি দিনৰ মধুৰ স্মৃতি মনত থাকে; সেয়ে পুৰণি কথা আলোচনা কৰিলে আনন্দ লাভ কৰে।',
      bn: 'সাম্প্রতিক কথা ভুলে গেলেও পুরোনো স্মৃতি স্পষ্ট থাকে; তাই পুরোনো দিনের গল্প তাদের আনন্দ দেয়।',
      ne: 'हालका कुरा बिर्सिए पनि पुराना सम्झनाहरू जीवित रहन्छन्; पुराना सुखद पलहरू सम्झाउँदा उहाँहरू खुसी हुनुहुन्छ।',
      lus: 'Tun hnai thil theihnghilh mah se hmanlai thil erawh an la hre reng thin. Nunhlui sawipui rawh.',
      kha: 'Wat la klet ia kiba shen, ki kynmaw ia kiba rim. Pynkynmaw ia ki por khynnah bad ka riti dustur.',
      ny: 'Dapo kam mit-bo, akam kam mit-do. Akam agan albo.',
      trp: 'তাবুকনি কক উয়ানসুকুইয়া তংখেবো স্বকাংনি কক খাপাঙ্গো তংগো; স্বকাংনি স্মৃতি সাখে বোরোক খুশি ওই।',
      mni: 'ꯍꯧꯖꯤꯛꯀꯤ ꯄꯣꯠꯁꯤꯡ ꯀꯥꯎꯔꯕꯁꯨ, ꯑꯔꯤꯕ ꯅꯤꯡꯁꯤꯡꯕꯁꯤꯡ ꯃꯄꯨꯡ ꯐꯥꯅ ꯂꯩ; ꯑꯉꯥꯡ ꯑꯣꯏꯔꯤꯉꯩꯒꯤ ꯋꯥꯔꯤꯁꯤꯡ ꯍꯧꯗꯣꯛꯄꯤꯌꯨ꯫',
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
        'Chhungkaw album leh inneih thlalak te en dun thin ula.',
        'Hmanlai hla nem tak leh rimawi zawi te ngaithla dun rawh u.',
        'Thingpui rimtui leh eitur rim hriat hian hahdanna a pe thin.',
        '\'I huan chungchang min hrilh teh\' tiin zawhna zau tak zawt thin rawh.',
      ],
      kha: [
        'Peit lang ia ki dur ba rim jong ka iing bad ki dur shongkurim.',
        'Pynrkhing ia ki jingrwai tynrai kiba jem bad ka sur besli.',
        'Ka jingiwbih jong ka cha, tulsi lane ki jingbam tynrai ka pynkynmaw ia kiba bun.',
        'Kylli da kaba ong \'Iathuh ia nga shaphang ka kper\' ha ka jaka ban tynjuh.',
      ],
      ny: [
        'Akam photo album do vivah photo ene-ka.',
        'Akam lokgit do bansi sur tatka.',
        'Akam cha do tulsi gandh mongo albo le-ka.',
        '\'Akam agan petta\' agan do, pariksha ma.',
      ],
      trp: [
        'স্বকাংনি ফটো অ্যালবাম তেই বিয়ানি ফটো লগে নাইদি।',
        'শান্ত লোকগান তেই বাঁশিনি সুর খুনদি।',
        'তাজা চা তেই নখরোনি চামুংনি গন্ধ খাপাঙ্গো শান্তি রিয়ো।',
        'উয়ানসুমানি পরীক্ষা তা লাদি, \'নিনি বাগানি কক সা\' হানাই কক সা।',
      ],
      mni: [
        'ꯏꯃꯨꯡꯒꯤ ꯑꯔꯤꯕ ꯐꯣꯇꯣ ꯑꯦꯜꯕꯝ ꯑꯃꯁꯨꯡ ꯂꯨꯍꯣꯡꯕꯒꯤ ꯐꯣꯇꯣꯁꯤꯡ ꯄꯨꯟꯅ ꯌꯦꯡꯃꯤꯟꯅꯧ꯫',
        'ꯑꯔꯤꯕ ꯏꯁꯩꯁꯤꯡ ꯅꯠꯇ꯭ꯔꯒ ꯕꯥꯖꯥꯒꯤ ꯈꯣꯟꯊꯣꯛ ꯇꯥꯍꯟꯕꯤꯌꯨ꯫',
        'ꯆꯥ ꯊꯛꯄ ꯑꯃꯁꯨꯡ ꯃꯅꯝ ꯅꯨꯡꯁꯤꯕ ꯆꯥꯛ-ꯊꯣꯡꯕꯒꯤ ꯃꯍꯥꯎꯅ ꯅꯤꯡꯁꯤꯡꯕ ꯍꯜꯂꯛꯍꯜꯂꯤ꯫',
        '\'ꯅꯍꯥꯛꯀꯤ ꯂꯩꯀꯣꯜꯒꯤ ꯋꯥꯔꯤ ꯍꯥꯏꯕꯤꯌꯨ\' ꯍꯥꯏꯅ ꯍꯪꯕꯤꯌꯨ, ꯆꯥꯡꯌꯦꯡ ꯇꯧꯕꯤꯒꯅꯨ꯫',
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
    titleMni: GUIDANCE_TIP_TRANSLATIONS['tip-1'].title.mni,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.trp,
    categoryMni: GUIDANCE_TIP_TRANSLATIONS['tip-1'].category.mni,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.trp,
    summaryMni: GUIDANCE_TIP_TRANSLATIONS['tip-1'].summary.mni,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.trp,
    bulletPointsMni: GUIDANCE_TIP_TRANSLATIONS['tip-1'].bulletPoints.mni,
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
    titleMni: GUIDANCE_TIP_TRANSLATIONS['tip-2'].title.mni,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.trp,
    categoryMni: GUIDANCE_TIP_TRANSLATIONS['tip-2'].category.mni,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.trp,
    summaryMni: GUIDANCE_TIP_TRANSLATIONS['tip-2'].summary.mni,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.trp,
    bulletPointsMni: GUIDANCE_TIP_TRANSLATIONS['tip-2'].bulletPoints.mni,
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
    titleMni: GUIDANCE_TIP_TRANSLATIONS['tip-3'].title.mni,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.trp,
    categoryMni: GUIDANCE_TIP_TRANSLATIONS['tip-3'].category.mni,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.trp,
    summaryMni: GUIDANCE_TIP_TRANSLATIONS['tip-3'].summary.mni,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.trp,
    bulletPointsMni: GUIDANCE_TIP_TRANSLATIONS['tip-3'].bulletPoints.mni,
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
    titleMni: GUIDANCE_TIP_TRANSLATIONS['tip-4'].title.mni,
    categoryEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.en,
    categoryAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.as,
    categoryBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.bn,
    categoryNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.ne,
    categoryLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.lus,
    categoryKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.kha,
    categoryNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.ny,
    categoryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.trp,
    categoryMni: GUIDANCE_TIP_TRANSLATIONS['tip-4'].category.mni,
    summaryEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.en,
    summaryAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.as,
    summaryBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.bn,
    summaryNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.ne,
    summaryLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.lus,
    summaryKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.kha,
    summaryNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.ny,
    summaryTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.trp,
    summaryMni: GUIDANCE_TIP_TRANSLATIONS['tip-4'].summary.mni,
    bulletPointsEn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.en,
    bulletPointsAs: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.as,
    bulletPointsBn: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.bn,
    bulletPointsNe: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.ne,
    bulletPointsLus: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.lus,
    bulletPointsKha: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.kha,
    bulletPointsNy: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.ny,
    bulletPointsTrp: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.trp,
    bulletPointsMni: GUIDANCE_TIP_TRANSLATIONS['tip-4'].bulletPoints.mni,
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
