import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BeakerIcon, 
  ClockIcon, 
  AcademicCapIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import useAuthStore from '../store/authStore';
import useLabStore from '../store/labStore';
import ActiveLabSession from '../components/labs/ActiveLabSession';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { activeSessions, fetchActiveSessions, stopLab, isLoading } = useLabStore();

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const stats = [
    {
      name: 'Active Labs',
      value: activeSessions.length,
      icon: BeakerIcon,
      color: 'bg-blue-500',
      link: '/sessions',
    },
    {
      name: 'Total Sessions',
      value: '12',
      icon: ClockIcon,
      color: 'bg-green-500',
      link: '/progress',
    },
    {
      name: 'Completed Labs',
      value: '8',
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      link: '/progress',
    },
  ];

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600">
          Here's your cybersecurity lab overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.name}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Active Sessions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Active Lab Sessions</h2>
          <Link
            to="/labs"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            Start New Lab
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading active sessions..." />
        ) : activeSessions.length === 0 ? (
          <div className="card text-center py-12">
            <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Labs
            </h3>
            <p className="text-gray-600 mb-6">
              Start a new lab session to begin learning
            </p>
            <Link to="/labs" className="btn-primary inline-flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2" />
              Browse Lab Catalog
            </Link>
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
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-br from-primary-50 to-cyber-accent/10">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/labs"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <BeakerIcon className="h-6 w-6 text-primary-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Start Lab</p>
          </Link>
          <Link
            to="/resources"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <AcademicCapIcon className="h-6 w-6 text-primary-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Learning Resources</p>
          </Link>
          <Link
            to="/progress"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <ClockIcon className="h-6 w-6 text-primary-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">View Progress</p>
          </Link>
          <Link
            to="/sessions"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <BeakerIcon className="h-6 w-6 text-primary-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Lab History</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
