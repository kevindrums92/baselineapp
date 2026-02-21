/**
 * SlideAnimation
 * Animación de transición tipo slide entre pantallas
 */

import React, { useEffect, useState } from 'react';

interface SlideAnimationProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  className?: string;
}

export default function SlideAnimation({
  children,
  direction = 'right',
  duration = 300,
  delay = 0,
  className = '',
}: SlideAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransformValue = () => {
    if (isVisible) return 'translate(0, 0)';

    switch (direction) {
      case 'left':
        return 'translate(-20px, 0)';
      case 'right':
        return 'translate(20px, 0)';
      case 'up':
        return 'translate(0, -20px)';
      case 'down':
        return 'translate(0, 20px)';
      default:
        return 'translate(20px, 0)';
    }
  };

  return (
    <div
      className={className}
      style={{
        transform: getTransformValue(),
        opacity: isVisible ? 1 : 0,
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
}

// Staggered children animation helper
interface StaggeredAnimationProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function StaggeredAnimation({
  children,
  staggerDelay = 50,
  direction = 'up',
}: StaggeredAnimationProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <SlideAnimation
          direction={direction}
          delay={index * staggerDelay}
          key={index}
        >
          {child}
        </SlideAnimation>
      ))}
    </>
  );
}
