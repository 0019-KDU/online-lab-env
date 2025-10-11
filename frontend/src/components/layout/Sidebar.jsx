import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BeakerIcon, 
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Lab Catalog', href: '/labs', icon: BeakerIcon },
  { name: 'Active Sessions', href: '/sessions', icon: ClockIcon },
  { name: 'Learning Resources', href: '/resources', icon: BookOpenIcon },
  { name: 'Progress', href: '/progress', icon: ChartBarIcon },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={clsx(
                    'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-700' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-primary-50 to-cyber-accent/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Need Help?
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Check out our documentation and tutorials
              </p>
              <button className="w-full bg-white text-primary-600 px-3 py-2 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors">
                View Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;