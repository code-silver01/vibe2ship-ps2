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
    
    // Dashboard & Gamification
    my_dashboard: 'My Dashboard',
    welcome_back: 'Welcome back',
    new_report: '+ New Report',
    civic_credit_score: 'Civic Credit Score',
    credits: 'Credits',
    trust_rating: 'Trust Rating',
    gamification_desc: 'Earn credits by reporting accurate issues and voting on community reports. Higher scores unlock titles and prioritize your tickets.',
    total_reported: 'Total Reported',
    resolved: 'Resolved',
    active_pending: 'Active/Pending',
    my_reports: 'My Reports',
    no_reports: 'You haven\'t reported any issues yet.',
    title_unlocked: 'Title Unlocked:',
    
    // Report Page
    capture_issue: 'Capture the Issue',
    upload_photo: 'Upload Photo',
    upload_voice: 'Upload/Record Voice',
    language_select: 'Language',
    confirm_location: 'Confirm Location',
    address_landmark: 'Address/Landmark',
    additional_details: 'Additional Details',
    description_opt: 'Description (Optional)',
    summary: 'Summary',
    media: 'Media',
    location: 'Location',
    processing: 'Processing...',
    submit_report: 'Submit Report',
    next: 'Next',
    back: 'Back',

    // Community
    community_title: 'Community Pulse',
    civic_champions: 'Civic Champions Leaderboard',
    top_citizens: 'Top Citizens',
    rank: 'Rank',
    citizen: 'Citizen',
    recent_issues: 'Recent Community Issues',
    vote_verify: 'Vote to Verify',
    confirm: 'Confirm',
    dispute: 'Dispute',
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

    // Dashboard & Gamification
    my_dashboard: 'मेरा डैशबोर्ड',
    welcome_back: 'वापसी पर स्वागत है',
    new_report: '+ नई रिपोर्ट',
    civic_credit_score: 'नागरिक क्रेडिट स्कोर',
    credits: 'क्रेडिट्स',
    trust_rating: 'विश्वास रेटिंग',
    gamification_desc: 'सटीक समस्याओं की रिपोर्ट करके और सामुदायिक रिपोर्टों पर मतदान करके क्रेडिट अर्जित करें।',
    total_reported: 'कुल रिपोर्ट की गई',
    resolved: 'समाधान हो गया',
    active_pending: 'सक्रिय/लंबित',
    my_reports: 'मेरी रिपोर्ट',
    no_reports: 'आपने अभी तक किसी भी समस्या की रिपोर्ट नहीं की है।',
    title_unlocked: 'उपाधि प्राप्त:',

    // Report Page
    capture_issue: 'समस्या कैप्चर करें',
    upload_photo: 'फोटो अपलोड करें',
    upload_voice: 'आवाज़ अपलोड/रिकॉर्ड करें',
    language_select: 'भाषा',
    confirm_location: 'स्थान की पुष्टि करें',
    address_landmark: 'पता/लैंडमार्क',
    additional_details: 'अतिरिक्त जानकारी',
    description_opt: 'विवरण (वैकल्पिक)',
    summary: 'सारांश',
    media: 'मीडिया',
    location: 'स्थान',
    processing: 'प्रसंस्करण...',
    submit_report: 'रिपोर्ट जमा करें',
    next: 'अगला',
    back: 'पीछे',

    // Community
    community_title: 'सामुदायिक पल्स',
    civic_champions: 'नागरिक चैंपियन लीडरबोर्ड',
    top_citizens: 'शीर्ष नागरिक',
    rank: 'रैंक',
    citizen: 'नागरिक',
    recent_issues: 'हाल की सामुदायिक समस्याएँ',
    vote_verify: 'सत्यापित करने के लिए वोट करें',
    confirm: 'पुष्टि करें',
    dispute: 'विवाद करें',
  },
  kn: {
    app_name: 'ಸಿವಿಕ್-ಪಲ್ಸ್',
    home: 'ಮುಖಪುಟ / ನಕ್ಷೆ',
    report_issue: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    heatmap: 'ಶಾಖದ ನಕ್ಷೆ',
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

    // Dashboard & Gamification
    my_dashboard: 'ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    welcome_back: 'ಮತ್ತೆ ಸ್ವಾಗತ',
    new_report: '+ ಹೊಸ ವರದಿ',
    civic_credit_score: 'ನಾಗರಿಕ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್',
    credits: 'ಕ್ರೆಡಿಟ್‌ಗಳು',
    trust_rating: 'ಟ್ರಸ್ಟ್ ರೇಟಿಂಗ್',
    gamification_desc: 'ನಿಖರವಾದ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ಮತ್ತು ಸಮುದಾಯ ವರದಿಗಳಲ್ಲಿ ಮತ ಚಲಾಯಿಸುವ ಮೂಲಕ ಕ್ರೆಡಿಟ್‌ಗಳನ್ನು ಗಳಿಸಿ.',
    total_reported: 'ಒಟ್ಟು ವರದಿಯಾಗಿದೆ',
    resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    active_pending: 'ಸಕ್ರಿಯ/ಬಾಕಿ ಉಳಿದಿದೆ',
    my_reports: 'ನನ್ನ ವರದಿಗಳು',
    no_reports: 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿಲ್ಲ.',
    title_unlocked: 'ಶೀರ್ಷಿಕೆ ಅನ್‌ಲಾಕ್ ಮಾಡಲಾಗಿದೆ:',

    // Report Page
    capture_issue: 'ಸಮಸ್ಯೆಯನ್ನು ಸೆರೆಹಿಡಿಯಿರಿ',
    upload_photo: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    upload_voice: 'ಧ್ವನಿ ಅಪ್‌ಲೋಡ್/ರೆಕಾರ್ಡ್ ಮಾಡಿ',
    language_select: 'ಭಾಷೆ',
    confirm_location: 'ಸ್ಥಳವನ್ನು ದೃಢೀಕರಿಸಿ',
    address_landmark: 'ವಿಳಾಸ/ಗುರುತು',
    additional_details: 'ಹೆಚ್ಚುವರಿ ವಿವರಗಳು',
    description_opt: 'ವಿವರಣೆ (ಐಚ್ಛಿಕ)',
    summary: 'ಸಾರಾಂಶ',
    media: 'ಮಾಧ್ಯಮ',
    location: 'ಸ್ಥಳ',
    processing: 'ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...',
    submit_report: 'ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ',
    next: 'ಮುಂದೆ',
    back: 'ಹಿಂದೆ',

    // Community
    community_title: 'ಕಮ್ಯುನಿಟಿ ಪಲ್ಸ್',
    civic_champions: 'ಸಿವಿಕ್ ಚಾಂಪಿಯನ್ಸ್ ಲೀಡರ್‌ಬೋರ್ಡ್',
    top_citizens: 'ಉನ್ನತ ನಾಗರಿಕರು',
    rank: 'ಶ್ರೇಣಿ',
    citizen: 'ನಾಗರಿಕ',
    recent_issues: 'ಇತ್ತೀಚಿನ ಸಮುದಾಯ ಸಮಸ್ಯೆಗಳು',
    vote_verify: 'ಪರಿಶೀಲಿಸಲು ಮತ ಚಲಾಯಿಸಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    dispute: 'ವಿವಾದ',
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
