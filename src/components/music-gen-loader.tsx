"use client";
import React from "react";

const MusicGenLoader = () => {
  return (
    <div className="music-gen-loader">
      <style>{`
        @keyframes loader-rotate {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 10px 20px 0 hsl(var(--primary)) inset,
              0 20px 30px 0 hsl(var(--primary) / 0.8) inset,
              0 60px 60px 0 hsl(var(--primary) / 0.6) inset;
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 10px 20px 0 hsl(var(--primary)) inset,
              0 20px 10px 0 hsl(var(--primary) / 0.7) inset,
              0 40px 60px 0 hsl(var(--primary) / 0.5) inset;
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 10px 20px 0 hsl(var(--primary)) inset,
              0 20px 30px 0 hsl(var(--primary) / 0.8) inset,
              0 60px 60px 0 hsl(var(--primary) / 0.6) inset;
          }
        }

        @keyframes loader-letter-anim {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }

        .music-gen-loader .loader-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px;
          height: 180px;
          font-family: "Inter", sans-serif;
          font-size: 1.2em;
          font-weight: 300;
          color: hsl(var(--primary));
          border-radius: 50%;
          background-color: transparent;
          user-select: none;
        }

        .music-gen-loader .loader {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background-color: transparent;
          animation: loader-rotate 2s linear infinite;
          z-index: 0;
        }

        .music-gen-loader .loader-letter {
          display: inline-block;
          opacity: 0.4;
          transform: translateY(0);
          animation: loader-letter-anim 2s infinite;
          z-index: 1;
          border-radius: 50ch;
          border: none;
        }

        .music-gen-loader .loader-letter:nth-child(1) { animation-delay: 0s; }
        .music-gen-loader .loader-letter:nth-child(2) { animation-delay: 0.1s; }
        .music-gen-loader .loader-letter:nth-child(3) { animation-delay: 0.2s; }
        .music-gen-loader .loader-letter:nth-child(4) { animation-delay: 0.3s; }
        .music-gen-loader .loader-letter:nth-child(5) { animation-delay: 0.4s; }
        .music-gen-loader .loader-letter:nth-child(6) { animation-delay: 0.5s; }
        .music-gen-loader .loader-letter:nth-child(7) { animation-delay: 0.6s; }
        .music-gen-loader .loader-letter:nth-child(8) { animation-delay: 0.7s; }
        .music-gen-loader .loader-letter:nth-child(9) { animation-delay: 0.8s; }
        .music-gen-loader .loader-letter:nth-child(10) { animation-delay: 0.9s; }
      `}</style>
      <div className="loader-wrapper">
        <span className="loader-letter">G</span>
        <span className="loader-letter">e</span>
        <span className="loader-letter">n</span>
        <span className="loader-letter">e</span>
        <span className="loader-letter">r</span>
        <span className="loader-letter">a</span>
        <span className="loader-letter">t</span>
        <span className="loader-letter">i</span>
        <span className="loader-letter">n</span>
        <span className="loader-letter">g</span>
        <div className="loader" />
      </div>
    </div>
  );
};

export default MusicGenLoader;
