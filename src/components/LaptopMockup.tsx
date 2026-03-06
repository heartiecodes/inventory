import React from "react";

interface LaptopMockupProps {
  imageSrc: string;
  alt?: string;
  className?: string;
}

export const LaptopMockup: React.FC<LaptopMockupProps> = ({
  imageSrc,
  alt = "screenshot",
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="relative bg-gray-200 rounded-xl overflow-hidden"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.2)) drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.25))',
          boxShadow: '0 25px 20px -12px rgba(0, 0, 0, 0.4), 0 15px 30px -15px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div className="bg-[#48494e] p-4">
          <div className="bg-white overflow-hidden">
            <img
              src={imageSrc}
              alt={alt}
              className="w-full h-auto object-cover block"
            />
          </div>
        </div>
        <div className="h-4 bg-gray-300"></div>
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 top-2 h-2 w-2 rounded-full bg-gray-500" />
    </div>
  );
};
