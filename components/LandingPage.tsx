
import React from 'react';
import { COLORS } from '../constants';

interface LandingPageProps {
  onLoginClick: () => void;
  onUploadClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onUploadClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: COLORS.PRIMARY }}
          >
            <i className="fas fa-microchip text-xl"></i>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-800">ADY Sadhana tracker</span>
        </div>
        <button 
          onClick={onLoginClick}
          className="px-6 py-2 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            AI-Powered <span style={{ color: COLORS.PRIMARY }}>Sadhana</span> Tracking
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Automate meeting participation records and fine management using Gemini Vision OCR technology. 
            Upload screenshots and get instant reports.
          </p>
          
          <button 
            onClick={onUploadClick}
            className="group relative inline-flex items-center justify-center px-10 py-6 font-bold text-white transition-all duration-200 bg-secondary font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary active:scale-95 shadow-xl hover:shadow-secondary/20"
            style={{ backgroundColor: COLORS.SECONDARY }}
          >
            <i className="fas fa-camera text-2xl mr-4 group-hover:scale-110 transition-transform"></i>
            <span className="text-2xl">Upload Meeting Screenshot</span>
          </button>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-4">
              <i className="fas fa-bolt text-secondary text-2xl mb-2"></i>
              <h3 className="font-bold">Fast OCR</h3>
              <p className="text-sm text-gray-500">Analyze gallery views in seconds</p>
            </div>
            <div className="p-4">
              <i className="fas fa-shield-halved text-primary text-2xl mb-2"></i>
              <h3 className="font-bold">Audit Secure</h3>
              <p className="text-sm text-gray-500">Immutable logs for every action</p>
            </div>
            <div className="p-4">
              <i className="fas fa-file-invoice-dollar text-accentRed text-2xl mb-2"></i>
              <h3 className="font-bold">Fine Tracker</h3>
              <p className="text-sm text-gray-500">Auto-generate leader reports</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-gray-400 text-sm">
        © 2025 ADY Community Management. All Rights Reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
