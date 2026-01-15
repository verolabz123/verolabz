/* Lightweight placeholder Silk component
   Replaced the three.js based implementation with a simple
   lightweight fallback to avoid build errors in environments
   where '@react-three/fiber' and 'three' are not available.
   This preserves the module API while ensuring the app builds.
*/

import React from "react";

interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}) => {
  // This placeholder renders a subtle colored block to occupy
  // the same layout space where the silk canvas would normally appear.
  // It intentionally avoids runtime dependencies on three.js.
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: color,
    opacity: 0.03,
    pointerEvents: "none",
  };

  return <div aria-hidden="true" style={style} data-placeholder="silk" />;
};

export default Silk;
