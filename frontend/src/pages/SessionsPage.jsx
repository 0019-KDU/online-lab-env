import { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import useLabStore from '../store/labStore';
import ActiveLabSession from '../components/labs/ActiveLabSession';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const SessionsPage = () => {
  const { activeSessions, fetchActiveSessions, stopLab, isLoading, error, clearError } = useLabStore();

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Lab Sessions</h1>
        <p className="text-gray-600">
          Manage your currently running lab environments
        </p>
      </div>

      <ErrorMessage message={error} onClose={clearError} />

      {isLoading ? (
        <LoadingSpinner message="Loading sessions..." />
      ) : activeSessions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Sessions
          </h3>
          <p className="text-gray-600">
            You don't have any running lab sessions at the moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeSessions.map((session) => (
            <ActiveLabSession
              key={session._id}
              session={session}
              onStop={stopLab}
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default SessionsPage;