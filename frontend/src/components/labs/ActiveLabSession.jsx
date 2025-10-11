import { useState } from 'react';
import { 
  StopIcon, 
  ArrowTopRightOnSquareIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Modal from '../common/Modal';

const ActiveLabSession = ({ session, onStop }) => {
  const [showStopModal, setShowStopModal] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStop(session._id);
      setShowStopModal(false);
    } catch (error) {
      console.error('Failed to stop lab:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="card border-l-4 border-primary-500">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {session.labTemplate.name}
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {session.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
            Started {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
          </div>

          {session.autoShutdownTime && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
              Auto-shutdown {formatDistanceToNow(new Date(session.autoShutdownTime), { addSuffix: true })}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {session.status === 'running' && session.accessUrl && (
            <a
              href={session.accessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-primary flex items-center justify-center"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
              Open Lab
            </a>
          )}

          <button
            onClick={() => setShowStopModal(true)}
            disabled={session.status !== 'running'}
            className="flex-1 btn-danger flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StopIcon className="h-4 w-4 mr-2" />
            Stop Lab
          </button>
        </div>
      </div>

      {/* Stop confirmation modal */}
      <Modal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="Stop Lab Session"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to stop this lab session? Your work will be saved, but you'll need to start a new session to continue.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowStopModal(false)}
              className="flex-1 btn-secondary"
              disabled={isStopping}
            >
              Cancel
            </button>
            <button
              onClick={handleStop}
              className="flex-1 btn-danger"
              disabled={isStopping}
            >
              {isStopping ? 'Stopping...' : 'Stop Lab'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ActiveLabSession;