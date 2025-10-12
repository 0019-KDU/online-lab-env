import { useState, useEffect } from 'react';
import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import useLabStore from '../store/labStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const DashboardPage = () => {
  const { activeSessions, fetchActiveSessions, startLab, stopLab, isLoading, error, clearError } = useLabStore();
  const [labSession, setLabSession] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  useEffect(() => {
    if (activeSessions && activeSessions.length > 0) {
      setLabSession(activeSessions[0]);
    }
  }, [activeSessions]);

  const handleStartLab = async () => {
    setIsStarting(true);
    try {
      const session = await startLab();
      setLabSession(session);
    } catch (error) {
      console.error('Failed to start lab:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopLab = async () => {
    try {
      await stopLab();
      setLabSession(null);
    } catch (error) {
      console.error('Failed to stop lab:', error);
    }
  };

  if (isLoading && !labSession) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your lab..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <ErrorMessage message={error} onClose={clearError} />

        {!labSession ? (
          // No active lab - show start button
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-gradient-to-br from-cyber-accent to-primary-500 rounded-full flex items-center justify-center mb-8">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to CyberLab
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                Click the button below to start your Ubuntu desktop environment
              </p>

              <button
                onClick={handleStartLab}
                disabled={isStarting}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                    Starting Lab...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-6 w-6 mr-3" />
                    Start Your Lab
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 mt-6">
                Your lab session will auto-shutdown after 2 hours
              </p>
            </div>
          </div>
        ) : (
          // Active lab - show embedded desktop
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse mr-2" />
                  <span className="text-sm font-medium text-gray-700">Lab Active</span>
                </div>
                <span className="text-sm text-gray-500">Session ID: {labSession._id.slice(-8)}</span>
              </div>
              
              <button
                onClick={handleStopLab}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Stop Lab
              </button>
            </div>

            {/* Desktop View */}
            <div className="flex-1 bg-gray-900">
              {labSession.accessUrl ? (
                <iframe
                  src={labSession.accessUrl}
                  className="w-full h-full border-0"
                  title="Ubuntu Desktop"
                  allow="clipboard-read; clipboard-write"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <LoadingSpinner message="Preparing your desktop..." />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;