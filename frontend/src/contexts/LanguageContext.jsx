import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    app_name: 'CivicPulse',
    home: 'Home / Map',
    report_issue: 'Report an Issue',
    heatmap: 'Heatmap',
    track_status: 'Track Status',
    community: 'Community',
    dashboard: 'Dashboard',
    admin_hub: 'Admin Hub',
    official_hub: 'Official Hub',
    login: 'Login',
    logout: 'Logout',
    home_hero1: 'Your voice.',
    home_hero2: 'Real civic action.',
    home_subhero: 'AI-powered reporting that skips the red tape and goes straight to the right department.',
    report_now: 'Report an Issue Now',
    view_scorecard: 'View Scorecard',
    live_feed: 'Live Neighborhood Feed',
  },
  hi: {
    app_name: 'सिविक-पल्स',
    home: 'होम / मानचित्र',
    report_issue: 'समस्या की रिपोर्ट करें',
    heatmap: 'हीटमैप',
    track_status: 'स्थिति ट्रैक करें',
    community: 'समुदाय',
    dashboard: 'डैशबोर्ड',
    admin_hub: 'एडमिन हब',
    official_hub: 'अधिकारी हब',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',
    home_hero1: 'आपकी आवाज़।',
    home_hero2: 'वास्तविक नागरिक कार्रवाई।',
    home_subhero: 'एआई-संचालित रिपोर्टिंग जो लालफीताशाही को छोड़ती है और सीधे सही विभाग में जाती है।',
    report_now: 'अभी समस्या की रिपोर्ट करें',
    view_scorecard: 'स्कोरकार्ड देखें',
    live_feed: 'लाइव नेबरहुड फ़ीड',
  },
  kn: {
    app_name: 'ಸಿವಿಕ್-ಪಲ್ಸ್',
    home: 'ಮುಖಪುಟ / ನಕ್ಷೆ',
    report_issue: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    heatmap: 'ಶಾಖದ ನಕ್ಷೆ (ಹೀಟ್‌ಮ್ಯಾಪ್)',
    track_status: 'ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    community: 'ಸಮುದಾಯ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    admin_hub: 'ಆಡಳಿತ ಕೇಂದ್ರ',
    official_hub: 'ಅಧಿಕಾರಿ ಕೇಂದ್ರ',
    login: 'ಲಾಗಿನ್',
    logout: 'ಲಾಗ್ಔಟ್',
    home_hero1: 'ನಿಮ್ಮ ಧ್ವನಿ.',
    home_hero2: 'ನೈಜ ನಾಗರಿಕ ಕ್ರಿಯೆ.',
    home_subhero: 'ಕೆಂಪು ಪಟ್ಟಿಯನ್ನು ಬಿಟ್ಟು ನೇರವಾಗಿ ಸರಿಯಾದ ಇಲಾಖೆಗೆ ಹೋಗುವ AI-ಚಾಲಿತ ವರದಿ.',
    report_now: 'ಈಗ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    view_scorecard: 'ಸ್ಕೋರ್‌ಕಾರ್ಡ್ ವೀಕ್ಷಿಸಿ',
    live_feed: 'ಲೈವ್ ನೇಬರ್‌ಹುಡ್ ಫೀಡ್',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('civicpulse_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('civicpulse_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
