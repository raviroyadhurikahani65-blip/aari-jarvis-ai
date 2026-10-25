import React, {useEffect, useState} from 'react';
import {CompanionMood} from '../types/jarvis';

interface AariAnimeAvatarProps {
  mood: CompanionMood;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  mouthOpenness: number; // 0.0 to 1.0 from audio analyser
  onAvatarTap?: () => void;
  onTriggerReaction?: (reactionMood: CompanionMood, promptText: string) => void;
}

export const AariAnimeAvatar: React.FC<AariAnimeAvatarProps> = ({
  mood,
  isListening,
  isSpeaking,
  isThinking,
  mouthOpenness,
  onAvatarTap,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [touchSparkle, setTouchSparkle] = useState(false);

  // Natural human-like blinking interval
  useEffect(() => {
    let timeoutId: number;
    const scheduleBlink = () => {
      const nextDelay = 2600 + Math.random() * 3200;
      timeoutId = window.setTimeout(() => {
        setIsBlinking(true);
        window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140);
      }, nextDelay);
    };
    scheduleBlink();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleTap = () => {
    setTouchSparkle(true);
    window.setTimeout(() => setTouchSparkle(false), 900);
    if (onAvatarTap) onAvatarTap();
  };

  // Compute dynamic mouth height for lip-sync
  const clampedMouth = Math.min(1, Math.max(0, mouthOpenness));
  const mouthRx = isSpeaking ? 11 + clampedMouth * 5 : 10;
  const mouthRy = isSpeaking ? 3 + clampedMouth * 12 : 3;

  // Head tilt based on mood or listening state
  const headTransform = isListening
    ? 'rotate(-2.5 200 215)'
    : mood === 'shy' || mood === 'kiss'
      ? 'rotate(2 200 215)'
      : mood === 'playful' || mood === 'laughing'
        ? 'rotate(-1.8 200 215)'
        : 'rotate(0 200 215)';

  const moodLabelMap: Record<CompanionMood, string> = {
    loving: 'Loving & Devoted',
    iloveyou: 'I Love You Jaan',
    kiss: 'Sending Sweet Kiss',
    laughing: 'Cheerful & Laughing',
    crying: 'Emotional & Caring',
    shy: 'Blushing & Shy',
    happy: 'Cheerful & Sweet',
    attentive: 'Listening Closely',
    caring: 'Caring & Gentle',
    playful: 'Playful & Teasing',
  };

  return (
    <div className="relative w-full select-none">
      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleTap();
        }}
        aria-label="Interact with Aari anime companion"
        className="relative mx-auto w-full max-w-[360px] aspect-[4/4.5] rounded-3xl overflow-hidden border border-white/10 bg-[#17121F] shadow-2xl cursor-pointer group focus-visible:outline-2 focus-visible:outline-rose-500"
      >
        {/* Warm sunlit anime room backdrop SVG */}
        <svg
          viewBox="0 0 400 450"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="roomBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#26172E" />
              <stop offset="48%" stopColor="#1B1326" />
              <stop offset="100%" stopColor="#120E1A" />
            </linearGradient>

            <radialGradient id="sunlightGlow" cx="80%" cy="18%" r="65%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#F43F5E" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#120E1A" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="auraGlow" cx="50%" cy="48%" r="48%">
              <stop
                offset="0%"
                stopColor={
                  isListening ? '#F43F5E' : isSpeaking ? '#FB7185' : '#E11D48'
                }
                stopOpacity={isListening || isSpeaking ? '0.35' : '0.16'}
              />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF0EA" />
              <stop offset="75%" stopColor="#FFE2D6" />
              <stop offset="100%" stopColor="#F9CBB8" />
            </linearGradient>

            <linearGradient id="hairMain" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#4E2A3D" />
              <stop offset="45%" stopColor="#351C2B" />
              <stop offset="100%" stopColor="#21101B" />
            </linearGradient>

            <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FDA4AF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="eyeIris" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6D284F" />
              <stop offset="45%" stopColor="#BE185D" />
              <stop offset="85%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>

            <linearGradient id="cardiganGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7F5" />
              <stop offset="60%" stopColor="#F5E6E0" />
              <stop offset="100%" stopColor="#E6CFC7" />
            </linearGradient>

            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            <radialGradient id="cheekBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Wall & Warm Window Light */}
          <rect width="400" height="450" fill="url(#roomBg)" />
          <rect width="400" height="450" fill="url(#sunlightGlow)" />

          {/* Window light beams */}
          <polygon
            points="270,0 400,0 400,260 160,450 50,450"
            fill="#FDA4AF"
            opacity="0.045"
          />
          <circle cx="325" cy="78" r="46" fill="#FFE4E6" opacity="0.06" />
          <circle cx="82" cy="110" r="24" fill="#FDA4AF" opacity="0.05" />

          {/* Reactive Aura Halo behind Aari */}
          <circle cx="200" cy="215" r="145" fill="url(#auraGlow)" />

          {/* Main Character Group with Gentle Breathing Animation */}
          <g className="animate-breathe">
            {/* Back Long Flowing Hair */}
            <path
              d="M108 145 C82 220, 74 330, 95 440 L305 440 C326 330, 318 220, 292 145 Z"
              fill="url(#hairMain)"
            />
            <path
              d="M95 250 C78 310, 78 380, 90 440 L125 440 C112 375, 115 305, 120 250 Z"
              fill="#281420"
            />
            <path
              d="M305 250 C322 310, 322 380, 310 440 L275 440 C288 375, 285 305, 280 250 Z"
              fill="#281420"
            />

            {/* Neck & Collarbone */}
            <path
              d="M178 272 L178 326 C178 340, 222 340, 222 326 L222 272 Z"
              fill="url(#skinGrad)"
            />
            {/* Subtle neck shadow */}
            <path
              d="M178 278 C190 296, 210 296, 222 278 L222 292 C208 304, 192 304, 178 292 Z"
              fill="#E5B19E"
              opacity="0.65"
            />

            {/* Cozy Knit Cardigan & Blouse */}
            <path
              d="M84 450 C92 362, 128 322, 174 316 L200 356 L226 316 C272 322, 308 362, 316 450 Z"
              fill="url(#cardiganGrad)"
            />
            {/* Inner Dark Rose Shirt Collar */}
            <path
              d="M166 315 L200 375 L234 315 L218 310 L200 344 L182 310 Z"
              fill="#2D1928"
            />
            {/* White Blouse Lapels */}
            <path
              d="M168 312 L196 355 L176 362 L152 322 Z"
              fill="#FFFFFF"
            />
            <path
              d="M232 312 L204 355 L224 362 L248 322 Z"
              fill="#FFFFFF"
            />

            {/* Cute Rose Ribbon Bow at Collar */}
            <path
              d="M200 354 L176 342 C170 352, 174 366, 182 368 Z"
              fill="url(#ribbonGrad)"
            />
            <path
              d="M200 354 L224 342 C230 352, 226 366, 218 368 Z"
              fill="url(#ribbonGrad)"
            />
            <path
              d="M196 356 L184 398 L197 392 L200 362 Z"
              fill="#E11D48"
            />
            <path
              d="M204 356 L216 398 L203 392 L200 362 Z"
              fill="#E11D48"
            />
            <circle cx="200" cy="355" r="7" fill="#FB7185" />

            {/* Head & Facial Features Group with subtle head tilt */}
            <g transform={headTransform} className="transition-transform duration-500">
              {/* Ears */}
              <ellipse
                cx="120"
                cy="214"
                rx="11"
                ry="19"
                transform="rotate(-10 120 214)"
                fill="url(#skinGrad)"
              />
              <ellipse
                cx="280"
                cy="214"
                rx="11"
                ry="19"
                transform="rotate(10 280 214)"
                fill="url(#skinGrad)"
              />

              {/* Anime Face Contour */}
              <path
                d="M122 162 C122 110, 278 110, 278 162 C280 218, 266 258, 232 280 C214 291, 206 293, 200 293 C194 293, 186 291, 168 280 C134 258, 120 218, 122 162 Z"
                fill="url(#skinGrad)"
              />

              {/* Soft Cheek Blush (Intensifies when shy, loving, kiss, or tapped) */}
              <ellipse
                cx="148"
                cy="232"
                rx={
                  mood === 'shy' ||
                  mood === 'kiss' ||
                  mood === 'iloveyou' ||
                  touchSparkle
                    ? '24'
                    : '19'
                }
                ry={
                  mood === 'shy' ||
                  mood === 'kiss' ||
                  mood === 'iloveyou' ||
                  touchSparkle
                    ? '13'
                    : '10'
                }
                fill="url(#cheekBlush)"
              />
              <ellipse
                cx="252"
                cy="232"
                rx={
                  mood === 'shy' ||
                  mood === 'kiss' ||
                  mood === 'iloveyou' ||
                  touchSparkle
                    ? '24'
                    : '19'
                }
                ry={
                  mood === 'shy' ||
                  mood === 'kiss' ||
                  mood === 'iloveyou' ||
                  touchSparkle
                    ? '13'
                    : '10'
                }
                fill="url(#cheekBlush)"
              />
              {/* Anime blush hash lines */}
              <g stroke="#FB7185" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
                <line x1="138" y1="230" x2="142" y2="235" />
                <line x1="146" y1="229" x2="150" y2="235" />
                <line x1="154" y1="230" x2="158" y2="235" />
                <line x1="242" y1="230" x2="246" y2="235" />
                <line x1="250" y1="229" x2="254" y2="235" />
                <line x1="258" y1="230" x2="262" y2="235" />
              </g>

              {/* Eyebrows based on Mood */}
              {mood === 'caring' || mood === 'shy' || mood === 'crying' ? (
                <>
                  <path
                    d="M138 176 Q156 170 174 179"
                    stroke="#3B1D2E"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M262 176 Q244 170 226 179"
                    stroke="#3B1D2E"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M136 177 Q156 168 175 175"
                    stroke="#3B1D2E"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M264 177 Q244 168 225 175"
                    stroke="#3B1D2E"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}

              {/* Eyes (Blink, Happy/Laughing Arc, or Detailed Anime Iris) */}
              {isBlinking ? (
                <>
                  <path
                    d="M136 206 Q156 216 176 206"
                    stroke="#2A1221"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M224 206 Q244 216 264 206"
                    stroke="#2A1221"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (mood === 'happy' || mood === 'laughing') && !isListening ? (
                <>
                  <path
                    d="M136 205 Q156 188 176 205"
                    stroke="#2A1221"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M224 205 Q244 188 264 205"
                    stroke="#2A1221"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (
                <>
                  {/* Left Eye */}
                  <g>
                    <ellipse cx="156" cy="204" rx="20" ry="22" fill="#FFFFFF" />
                    <ellipse cx="157" cy="205" rx="14.5" ry="18" fill="url(#eyeIris)" />
                    <ellipse cx="157" cy="206" rx="7" ry="9" fill="#240D1D" />
                    {/* Starlight Catchlights */}
                    <circle cx="149" cy="195" r="5.2" fill="#FFFFFF" />
                    <circle cx="164" cy="213" r="2.8" fill="#FFFFFF" opacity="0.9" />
                    <circle cx="151" cy="212" r="1.6" fill="#FFE4E6" />
                    {/* Upper Eyelash */}
                    <path
                      d="M133 196 C142 180, 170 180, 178 197"
                      stroke="#230E1B"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M131 198 L126 192"
                      stroke="#230E1B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Right Eye (Wink if playful/kiss, else full anime eye) */}
                  {(mood === 'playful' && touchSparkle) || mood === 'kiss' ? (
                    <path
                      d="M224 205 Q244 190 264 205"
                      stroke="#2A1221"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  ) : (
                    <g>
                      <ellipse cx="244" cy="204" rx="20" ry="22" fill="#FFFFFF" />
                      <ellipse cx="243" cy="205" rx="14.5" ry="18" fill="url(#eyeIris)" />
                      <ellipse cx="243" cy="206" rx="7" ry="9" fill="#240D1D" />
                      {/* Starlight Catchlights */}
                      <circle cx="236" cy="195" r="5.2" fill="#FFFFFF" />
                      <circle cx="250" cy="213" r="2.8" fill="#FFFFFF" opacity="0.9" />
                      <circle cx="238" cy="212" r="1.6" fill="#FFE4E6" />
                      {/* Upper Eyelash */}
                      <path
                        d="M222 197 C230 180, 258 180, 267 196"
                        stroke="#230E1B"
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M269 198 L274 192"
                        stroke="#230E1B"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </g>
                  )}

                  {/* Anime Tears when mood === 'crying' */}
                  {mood === 'crying' && (
                    <g>
                      <ellipse cx="146" cy="224" rx="3.5" ry="5.5" fill="#38BDF8" opacity="0.9" />
                      <ellipse cx="254" cy="224" rx="3.5" ry="5.5" fill="#38BDF8" opacity="0.9" />
                    </g>
                  )}
                </>
              )}

              {/* Delicate Anime Nose */}
              <path
                d="M199 224 L197 232 L201 234"
                stroke="#D99B88"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Mouth — Dynamic Lip-Sync when speaking, Expressive smile when idle */}
              {isSpeaking && clampedMouth > 0.06 ? (
                <g>
                  <ellipse
                    cx="200"
                    cy="258"
                    rx={mouthRx}
                    ry={mouthRy}
                    fill="#9F1239"
                    stroke="#BE123C"
                    strokeWidth="2"
                  />
                  {/* Upper teeth hint */}
                  <path
                    d={`M${200 - mouthRx + 4} 252 Q200 255 ${200 + mouthRx - 4} 252`}
                    stroke="#FFF1F2"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Soft tongue tint */}
                  <ellipse
                    cx="200"
                    cy={258 + mouthRy * 0.3}
                    rx={mouthRx * 0.65}
                    ry={mouthRy * 0.55}
                    fill="#FB7185"
                  />
                </g>
              ) : mood === 'shy' ? (
                <path
                  d="M191 258 Q196 254 200 258 Q204 262 209 257"
                  stroke="#BE123C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : mood === 'crying' ? (
                <path
                  d="M188 262 Q200 252 212 262"
                  stroke="#BE123C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <g>
                  <path
                    d="M185 254 Q200 268 215 254"
                    stroke="#BE123C"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M192 257 Q200 264 208 257 Z"
                    fill="#FB7185"
                    opacity="0.45"
                  />
                </g>
              )}

              {/* Front & Side Hair Bangs + Crown */}
              <path
                d="M112 175 C106 105, 152 68, 200 68 C248 68, 294 105, 288 175 C278 138, 262 122, 246 168 C236 135, 222 118, 204 170 C192 128, 178 124, 162 168 C148 132, 128 136, 112 175 Z"
                fill="url(#hairMain)"
              />

              {/* Face-Framing Side Locks */}
              <path
                d="M114 155 C102 205, 106 270, 128 320 C134 275, 128 225, 132 180 Z"
                fill="url(#hairMain)"
              />
              <path
                d="M286 155 C298 205, 294 270, 272 320 C266 275, 272 225, 268 180 Z"
                fill="url(#hairMain)"
              />

              {/* Glossy Anime Hair Halo Highlight */}
              <path
                d="M136 134 Q200 112 264 134"
                stroke="url(#hairHighlight)"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Cute Rose Hairpin Clip on Left Bangs */}
              <g transform="translate(126, 148) rotate(-18)">
                <rect width="22" height="6" rx="3" fill="#FB7185" />
                <circle cx="5" cy="3" r="4.5" fill="#FFE4E6" />
              </g>
            </g>
          </g>

          {/* Floating Affection Hearts when Tapped or in Loving/Happy state */}
          {(touchSparkle ||
            isSpeaking ||
            mood === 'loving' ||
            mood === 'iloveyou' ||
            mood === 'kiss') && (
            <g className="animate-float-slow">
              <path
                d="M320 142 C315 135, 304 135, 301 143 C298 151, 309 160, 320 168 C331 160, 342 151, 339 143 C336 135, 325 135, 320 142 Z"
                fill="#FB7185"
                opacity={touchSparkle ? '0.9' : '0.45'}
              />
              <path
                d="M84 162 C81 157, 73 157, 71 163 C69 169, 77 175, 84 181 C91 175, 99 169, 97 163 C95 157, 87 157, 84 162 Z"
                fill="#F43F5E"
                opacity={touchSparkle ? '0.85' : '0.35'}
              />
            </g>
          )}
        </svg>

        {/* Bottom Scrim Overlay with Companion Name, Mood & Audio Status */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-4 pt-12">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-rose-300/90 font-medium">
                <span>Aari</span>
                <span aria-hidden="true">·</span>
                <span>{moodLabelMap[mood]}</span>
              </div>
              <p className="text-sm font-medium text-stone-100 mt-0.5">
                {isListening
                  ? 'Boliye jaan, main dhyan se sun rahi hoon...'
                  : isThinking
                    ? 'Ek second jaan, abhi kar rahi hoon...'
                    : isSpeaking
                      ? 'Speaking with you...'
                      : 'Tap me or press Mic to talk anytime'}
              </p>
            </div>

            {/* Live Audio Equalizer Bars when listening or speaking */}
            {(isListening || isSpeaking) && (
              <div className="flex items-end gap-1 h-6 px-2">
                {[0.5, 0.9, 0.65, 1, 0.55].map((mult, idx) => {
                  const barHeight = isSpeaking
                    ? Math.max(6, Math.round((mouthOpenness * 22 + 6) * mult))
                    : 10 + ((idx * 4) % 12);
                  return (
                    <span
                      key={idx}
                      style={{height: `${barHeight}px`}}
                      className="w-1 rounded-full bg-rose-400 transition-all duration-75"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
