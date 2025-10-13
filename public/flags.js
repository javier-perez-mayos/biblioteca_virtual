// SVG flags for language selector
const flags = {
  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30">
    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
    <g clip-path="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>
    </g>
  </svg>`,

  de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3">
    <rect width="5" height="3" fill="#000"/>
    <rect width="5" height="2" y="1" fill="#D00"/>
    <rect width="5" height="1" y="2" fill="#FFCE00"/>
  </svg>`,

  ca: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 810 540">
    <path fill="#fcdd09" d="M0 0h810v540H0z"/>
    <path stroke="#da121a" stroke-width="60" d="M0 90h810m0 120H0m0 120h810m0 120H0"/>
  </svg>`
};

function getFlagSVG(lang) {
  return flags[lang] || flags.en;
}
