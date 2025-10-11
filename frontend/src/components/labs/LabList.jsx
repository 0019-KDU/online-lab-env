import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import useLabStore from '../../store/labStore';
import LabCard from './LabCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const LabList = () => {
  const { templates, fetchTemplates, startLab, isLoading, error, clearError } = useLabStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startingLabId, setStartingLabId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleStartLab = async (templateId) => {
    setStartingLabId(templateId);
    try {
      await startLab(templateId);
      alert('Lab started successfully! Check your active sessions.');
    } catch (error) {
      console.error('Failed to start lab:', error);
    } finally {
      setStartingLabId(null);
    }
  };

  const filteredLabs = templates.filter((lab) => {
    const matchesSearch = lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || lab.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Labs' },
    { value: 'network-security', label: 'Network Security' },
    { value: 'web-security', label: 'Web Security' },
    { value: 'forensics', label: 'Forensics' },
    { value: 'malware-analysis', label: 'Malware Analysis' },
    { value: 'general', label: 'General' },
  ];

  if (isLoading && templates.length === 0) {
    return <LoadingSpinner message="Loading lab catalog..." />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Catalog</h1>
        <p className="text-gray-600">
          Choose from our collection of hands-on cybersecurity labs
        </p>
      </div>

      <ErrorMessage message={error} onClose={clearError} />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search labs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field pl-10 pr-10 appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredLabs.length} of {templates.length} labs
      </div>

      {filteredLabs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No labs found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map((lab) => (
            <LabCard
              key={lab._id}
              lab={lab}
              onStart={handleStartLab}
              isStarting={startingLabId === lab._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LabList;  // ← ADD THIS LINE IF MISSING!