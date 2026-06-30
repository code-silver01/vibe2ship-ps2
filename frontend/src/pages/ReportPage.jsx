import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function ReportPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946, address: 'Bangalore, KA' }); // Default to BLR center
  
  // Note: For a real app, these would be actual File objects from an <input type="file" />
  // We use mock buffers for the demo
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleLoadSample = async () => {
    try {
      const response = await fetch('/sample_pothole.png');
      const blob = await response.blob();
      const file = new File([blob], 'sample_pothole.png', { type: 'image/png' });
      setImageFile(file);
    } catch (err) {
      console.error('Failed to load sample image', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('textDescription', description);
      formData.append('language', language);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);
      formData.append('address', location.address);

      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (audioFile) {
        formData.append('audio', audioFile);
      }

      const res = await api.createTicket(formData);
      navigate(`/tracker/${res.ticket.id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">{t('report_issue')}</h1>
        <div className="flex items-center mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === i ? 'bg-civic-500 text-white ring-4 ring-civic-500/30 shadow-[0_0_15px_rgba(139,92,246,0.6)]' : 
                step > i ? 'bg-success-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-civic-800 text-civic-400'
              }`}>
                {step > i ? '✓' : i}
              </div>
              {i < 3 && (
                <div className={`w-16 h-1 mx-2 rounded ${step > i ? 'bg-success-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-civic-800'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 sm:p-8 border-civic-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-civic-900/60 backdrop-blur-xl">
        {error && (
          <div className="mb-6 bg-danger-500/10 border border-danger-500 text-danger-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {/* Step 1: Media Upload */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4 text-civic-100">{t('capture_issue')}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    imageFile ? 'border-success-500 bg-success-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]' : 'border-civic-700 hover:border-civic-500 hover:bg-civic-800/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  }`}>
                    <div className="text-4xl mb-2 drop-shadow-md">📸</div>
                    <div className="font-medium text-white line-clamp-1">{imageFile ? imageFile.name : t('upload_photo')}</div>
                    <p className="text-xs text-civic-400 mt-1">{imageFile ? 'Click to change' : 'Tap to select an image'}</p>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="file" 
                    accept="audio/*" 
                    capture="microphone"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    audioFile ? 'border-success-500 bg-success-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]' : 'border-civic-700 hover:border-civic-500 hover:bg-civic-800/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  }`}>
                    <div className="text-4xl mb-2 drop-shadow-md">🎤</div>
                    <div className="font-medium text-white line-clamp-1">{audioFile ? audioFile.name : t('upload_voice')}</div>
                    <p className="text-xs text-civic-400 mt-1">{audioFile ? 'Click to change' : 'Tap to record or select'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-2 mb-4">
                <button 
                  type="button" 
                  onClick={handleLoadSample}
                  className="text-civic-400 hover:text-civic-300 text-sm font-medium border border-civic-700 hover:border-civic-500 rounded-full px-4 py-1.5 transition-all flex items-center bg-civic-900/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                >
                  <span className="mr-2">🧪</span> Try with Sample Pothole Image
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-civic-300 mb-1">{t('language_select')}</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4 text-civic-100">{t('confirm_location')}</h2>
              
              <div 
                className="bg-civic-950 rounded-lg aspect-video flex items-center justify-center border border-civic-700 relative overflow-hidden group cursor-pointer shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                onClick={() => setLocation({...location, lat: location.lat + 0.001, lng: location.lng + 0.001})}
                title="Click to mock drag pin"
              >
                {/* Static Map Background */}
                <div className="absolute inset-0 bg-[url('/map_bg.png')] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-civic-950/20 backdrop-blur-[1px]"></div>
                
                <div className="z-10 text-center pointer-events-none">
                  <div className="text-6xl mb-2 animate-bounce drop-shadow-[0_0_20px_rgba(139,92,246,0.9)]">📍</div>
                  <div className="bg-civic-950/90 backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-semibold border border-civic-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-civic-300 mb-1">{t('address_landmark')}</label>
                <input 
                  type="text" 
                  className="input" 
                  value={location.address}
                  onChange={(e) => setLocation({...location, address: e.target.value})}
                  placeholder="e.g. Near Central Park gate"
                />
              </div>
            </div>
          )}

          {/* Step 3: Details & Submit */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4 text-civic-100">{t('additional_details')}</h2>
              
              <div>
                <label className="block text-sm font-medium text-civic-300 mb-1">{t('description_opt')}</label>
                <textarea 
                  className="input min-h-[120px]" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional details that might help officials?"
                />
              </div>

              <div className="bg-civic-800/30 rounded-lg p-5 border border-civic-700/50 shadow-inner">
                <h3 className="text-sm font-semibold mb-3 text-civic-200">{t('summary')}</h3>
                <ul className="text-sm text-civic-300 space-y-2">
                  <li className="flex items-center"><span className="w-4 h-4 bg-civic-600 rounded-full inline-block mr-2 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span> {t('media')}: {imageFile ? 'Photo' : ''} {imageFile && audioFile ? '&' : ''} {audioFile ? 'Voice' : ''} {!imageFile && !audioFile ? 'None' : ''}</li>
                  <li className="flex items-center"><span className="w-4 h-4 bg-civic-600 rounded-full inline-block mr-2 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span> {t('location')}: {location.address} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between pt-6 border-t border-civic-800">
            {step > 1 ? (
              <button type="button" onClick={handlePrev} className="btn btn-secondary">
                {t('back')}
              </button>
            ) : <div></div>}
            
            <button 
              type="submit" 
              className="btn btn-primary min-w-[120px]"
              disabled={loading || (step === 1 && !imageFile && !audioFile && !description)}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {t('processing')}
                </span>
              ) : step === 3 ? t('submit_report') : t('next')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
