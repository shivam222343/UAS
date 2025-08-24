import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Virtualized list component for handling large datasets efficiently
 */
const VirtualizedList = ({
  items = [],
  itemHeight = 80,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  emptyMessage = 'No items to display'
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleItems = useMemo(() => {
    if (!items.length) return [];

    const containerHeightNum = typeof containerHeight === 'string' 
      ? parseInt(containerHeight) 
      : containerHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeightNum) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        top: i * itemHeight
      });
    }

    return visibleItems;
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  if (!items.length) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;
