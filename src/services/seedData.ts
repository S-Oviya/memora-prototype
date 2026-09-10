import { Patient, FamilyMember, RoutineItem, FavoriteMusic, CaregiverGuidanceTip } from '../types';

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

export const CAREGIVER_GUIDANCE_TIPS: CaregiverGuidanceTip[] = [
  {
    id: 'tip-1',
    titleEn: 'Communicating with Calmness & Dignity',
    titleAs: 'শান্ত আৰু মৰমেৰে কথা পতাৰ অভ্যাস',
    categoryEn: 'Communication',
    categoryAs: 'সংযোগ আৰু কথা-বতৰা',
    summaryEn: 'Speak in short, gentle sentences with eye contact and a warm smile. Never argue or test their memory abruptly.',
    summaryAs: 'চমুকৈ, শান্ত কণ্ঠেৰে আৰু চকুলৈ চাই কথা পাতক। কেতিয়াও জোৰ কৰি মনত পেলাবলৈ হেঁচা নিদিব।',
    bulletPointsEn: [
      'Use a warm, unhurried tone of voice.',
      'Allow extra time for the senior to process questions and respond comfortably.',
      'Avoid saying "Don\'t you remember?" Instead, gently share the context: "Here is your daughter Sunita".',
      'Non-verbal cues like a comforting touch on the hand provide tremendous security.',
    ],
    bulletPointsAs: [
      'ধীৰ আৰু মৰমিয়াল সুৰত কথা কওক, কোনো খৰখেদা নকৰিব।',
      'কথা বুজিবলৈ আৰু উত্তৰ দিবলৈ জ্যেষ্ঠজনক পৰ্যাপ্ত সময় দিয়ক।',
      '‘আপোনাৰ মনত নাইনে?’ বুলি নুসুধিব; বৰঞ্চ কওক ‘এয়া চাওক আপোনাৰ জীয়াৰী সুনীতা’।',
      'মৰমেৰে হাতত স্পৰ্শ কৰিলে তেওঁলোকে নিৰাপদ অনুভৱ কৰে।',
    ],
    icon: 'heart-handshake',
  },
  {
    id: 'tip-2',
    titleEn: 'The Reassuring Power of Daily Routines',
    titleAs: 'দৈনন্দিন নিয়মীয়া ৰুটিনৰ গুৰুত্ব',
    categoryEn: 'Daily Habits',
    categoryAs: 'দৈনন্দিন অভ্যাস',
    summaryEn: 'Predictable schedules decrease anxiety and confusion for people living with memory loss.',
    summaryAs: 'প্ৰতিদিনে একে সময়ত একে ধৰণৰ কাম কৰিলে মানসিক অস্থিৰতা আৰু বিভ্ৰান্তি বহু পৰিমাণে হ্ৰাস পায়।',
    bulletPointsEn: [
      'Keep waking, eating, and resting times consistent every day.',
      'Place visual routine cues and familiar family photos around the room.',
      'Encourage gentle outdoor walks or veranda sitting during morning sun.',
      'Involve them in small, dignity-affirming tasks like watering a plant or folding a towel.',
    ],
    bulletPointsAs: [
      'শোৱাৰ পৰা উঠা, খোৱা-বোৱা আৰু জিৰণিৰ সময় সদায় একে ৰাখক।',
      'কোঠাটোত চিনাকি ফটো আৰু পৰিষ্কাৰ দৃশ্যমান সংকেত ৰাখক।',
      'ৰাতিপুৱা কোমল ৰ’দত খোজ কঢ়া বা চোতালত বহিবলৈ উৎসাহিত কৰক।',
      'ফুলত পানী দিয়াৰ দৰে সৰু সৰু কামত তেওঁলোকক মৰমেৰে জড়িত কৰক।',
    ],
    icon: 'calendar-check',
  },
  {
    id: 'tip-3',
    titleEn: 'Handling Confusion & Repetitive Questions',
    titleAs: 'বিভ্ৰান্তি আৰু একে কথা বাৰে বাৰে সোধাৰ সমাধান',
    categoryEn: 'Comfort & Validation',
    categoryAs: 'সঁহাৰি আৰু মানসিক শান্তি',
    summaryEn: 'Validate the emotion behind the words rather than correcting factual errors.',
    summaryAs: 'ভুল আঙুলিয়াই নিদি তেওঁলোকৰ মনৰ আবেগক বুজিবলৈ চেষ্টা কৰক।',
    bulletPointsEn: [
      'If they ask repeatedly to "go home", they are often seeking safety, not a physical location. Reassure them: "You are safe with me".',
      'Do not argue or correct mistaken dates or names directly.',
      'Gently redirect attention using a familiar family photograph or a soothing cup of tea.',
      'Play soft familiar music when restlessness or sundowning occurs in the late afternoon.',
    ],
    bulletPointsAs: [
      'যদি তেওঁলোকে বাৰে বাৰে ‘ঘৰলৈ যাম’ বুলি কয়, তাৰ অৰ্থ হ’ল তেওঁলোকে নিৰাপত্তা বিচাৰিছে; কওক ‘মই আপোনাৰ লগত আছোঁ, কোনো চিন্তা নাই’।',
      'দিন-বাৰ বা ভুল তথ্যক লৈ যুক্তি-তৰ্ক নকৰিব।',
      'চিনাকি ফটো দেখুৱাই বা একাপ গৰম চাহ দি মনটো আনফালে নিয়ক।',
      'আবেলিৰ সময়ত মানসিক অস্থিৰতা বাঢ়িলে শান্ত সুৰৰ গান শুনাব পাৰে।',
    ],
    icon: 'shield-check',
  },
  {
    id: 'tip-4',
    titleEn: 'Reminiscence & Familiar North Eastern Memories',
    titleAs: 'পুৰণি স্মৃতি আৰু চিনাকি পৰিৱেশ',
    categoryEn: 'Reminiscence',
    categoryAs: 'স্মৃতি সজীৱ কৰা',
    summaryEn: 'Long-term memories often remain strong even as short-term memory fades. Tap into cherished childhood and cultural roots.',
    summaryAs: 'নিকট অতীত পাহৰিলেও পুৰণি দিনৰ মধুৰ স্মৃতি মনত থাকে; সেয়ে পুৰণি কথা আলোচনা কৰিলে আনন্দ লাভ কৰে।',
    bulletPointsEn: [
      'Look together at family albums, wedding photos, and holiday pictures.',
      'Play nostalgic Assamese folk songs, Borgeet, or traditional flute melodies.',
      'Aromas like fresh Assam tea, tulsi, or familiar cooking evoke comforting memories.',
      'Ask open-ended questions like "Tell me about your garden" rather than testing their memory.',
    ],
    bulletPointsAs: [
      'পুৰণি ফটো এলবাম, পৰিয়ালৰ বিয়া-সবাহৰ ফটো একেলগে বহি চাওক।',
      'শান্ত লোকগীত, বৰগীত বা বাঁহীৰ সুৰ শুনাওক।',
      'তুলসী, অসমীয়া চাহৰ সুবাস আদিয়ে মনলৈ প্ৰশান্তি কঢ়িয়াই আনে।',
      'তেওঁলোকক পুৰণি দিনৰ আনন্দময় অভিজ্ঞতা ক’বলৈ অনুৰোধ কৰক।',
    ],
    icon: 'sparkles',
  },
];
