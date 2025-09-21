import React, { useEffect, useRef } from 'react';
interface ContextMenuOption {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}
interface CustomContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
}
const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  x,
  y,
  options,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  // Adjust position if menu would go off screen
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - 200),
    y: Math.min(y, window.innerHeight - options.length * 40)
  };
  return <div ref={menuRef} className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48" style={{
    left: adjustedPosition.x + 'px',
    top: adjustedPosition.y + 'px'
  }}>
      {options.map((option, index) => <div key={index} className={`px-4 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => {
      if (!option.disabled) {
        option.onClick();
        onClose();
      }
    }}>
          {option.icon && <span className="mr-2">{option.icon}</span>}
          <span className="text-gray-800 dark:text-gray-200">
            {option.label}
          </span>
        </div>)}
    </div>;
};
export default CustomContextMenu;