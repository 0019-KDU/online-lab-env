import { 
  ClockIcon, 
  CpuChipIcon, 
  ServerIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const LabCard = ({ lab, onStart, isStarting }) => {
  const categoryColors = {
    'network-security': 'bg-blue-100 text-blue-800',
    'web-security': 'bg-purple-100 text-purple-800',
    'forensics': 'bg-green-100 text-green-800',
    'malware-analysis': 'bg-red-100 text-red-800',
    'general': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lab.name}
          </h3>
          <span
            className={clsx(
              'inline-block px-3 py-1 rounded-full text-xs font-medium',
              categoryColors[lab.category] || categoryColors.general
            )}
          >
            {lab.category.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {lab.description}
      </p>

      {/* Lab specs */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center text-xs text-gray-600">
          <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
          {lab.duration} min
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <CpuChipIcon className="h-4 w-4 mr-1.5 text-gray-400" />
          {lab.resources.cpu} CPU
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <ServerIcon className="h-4 w-4 mr-1.5 text-gray-400" />
          {lab.resources.memory}
        </div>
      </div>

      {/* Pre-installed tools */}
      {lab.preInstalledTools && lab.preInstalledTools.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Pre-installed Tools:</p>
          <div className="flex flex-wrap gap-1">
            {lab.preInstalledTools.slice(0, 3).map((tool, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tool}
              </span>
            ))}
            {lab.preInstalledTools.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{lab.preInstalledTools.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={() => onStart(lab._id)}
        disabled={isStarting}
        className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isStarting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Preparing lab... (30-60s)
          </>
        ) : (
          <>
            <PlayIcon className="h-4 w-4 mr-2" />
            Start Lab
          </>
        )}
      </button>
    </div>
  );
};

export default LabCard;