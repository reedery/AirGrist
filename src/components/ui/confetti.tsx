import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  color: string;
  size: number;
  opacity: number;
}

interface ConfettiProps {
  duration?: number;
  intensity?: number;
}

// Grist color scheme based on the logo
const GRIST_COLORS = [
  '#4ECDC4', // Teal/turquoise (main)
  '#6BBFB8', // Lighter teal
  '#3BB5AD', // Darker teal
  '#F4A261', // Orange
  '#E76F51', // Reddish orange
  '#E9C46A', // Light orange/yellow
];

export const Confetti: React.FC<ConfettiProps> = ({ 
  duration = 3000, 
  intensity = 150 
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Initialize confetti pieces
    const initialPieces: ConfettiPiece[] = [];
    for (let i = 0; i < intensity; i++) {
      initialPieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10 - Math.random() * 100,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6,
        fallSpeed: Math.random() * 3 + 2,
        color: GRIST_COLORS[Math.floor(Math.random() * GRIST_COLORS.length)],
        size: Math.random() * 8 + 4,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }
    setPieces(initialPieces);

    // Stop animation after duration
    const timer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, intensity]);

  useEffect(() => {
    if (!isActive) return;

    const animationFrame = requestAnimationFrame(function animate() {
      setPieces(prevPieces => 
        prevPieces
          .map(piece => ({
            ...piece,
            y: piece.y + piece.fallSpeed,
            x: piece.x + Math.sin(piece.y / 30) * 0.5,
            rotation: piece.rotation + piece.rotationSpeed,
          }))
          .filter(piece => piece.y < window.innerHeight + 50)
      );

      if (isActive) {
        requestAnimationFrame(animate);
      }
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isActive]);

  if (!isActive && pieces.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: piece.x,
            top: piece.y,
            transform: `rotate(${piece.rotation}deg)`,
            transition: 'none',
          }}
        >
          <div
            className="rounded"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              opacity: piece.opacity,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default Confetti; 