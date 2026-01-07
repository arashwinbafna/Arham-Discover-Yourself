
import React from 'react';
import { COLORS } from '../constants';

interface LandingPageProps {
  onLoginClick: (role?: 'ADMIN' | 'LEADER') => void;
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
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Community <span style={{ color: COLORS.PRIMARY }}>Sadhana</span> Management
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            A professional tracking system for attendance and fines. 
            Choose your portal below to get started.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl mx-auto">
            <button 
              onClick={() => onLoginClick('ADMIN')}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-deepRed rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-red-50 text-deepRed rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-shield text-3xl"></i>
              </div>
              <span className="text-xl font-bold text-gray-800">Login for Admin</span>
              <p className="text-xs text-gray-400 mt-2">Manage users, OCR & global data</p>
            </button>

            <button 
              onClick={() => onLoginClick('LEADER')}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-primary rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-tie text-3xl"></i>
              </div>
              <span className="text-xl font-bold text-gray-800">Login for Leaders</span>
              <p className="text-xs text-gray-400 mt-2">Track group fines & attendance</p>
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
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
