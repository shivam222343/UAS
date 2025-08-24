import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Optimized lazy loading image component with intersection observer
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  fallback = null,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (!currentImg) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  // Show placeholder while not in view
  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        {...props}
      >
        {placeholder}
      </div>
    );
  }

  // Show fallback on error
  if (hasError && fallback) {
    return (
      <div className={className} {...props}>
        {fallback}
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}>
          {placeholder}
        </div>
      )}
      
      <motion.img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      />
    </div>
  );
};

export default LazyImage;
