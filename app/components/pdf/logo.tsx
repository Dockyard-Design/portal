import { Image, Svg, G, Circle, Path, Line, Text, Tspan } from "@react-pdf/renderer";

interface LogoProps {
  logoBase64?: string | null;
}

// Fallback logo drawn with SVG primitives
const FallbackLogo = () => (
  <Svg viewBox="0 0 500 100" style={{ width: 200, height: 40 }}>
    <Circle cx="45" cy="50" r="32" fill="none" stroke="#000000" strokeWidth={5} />
    <Line x1="13" y1="50" x2="77" y2="50" stroke="#000000" strokeWidth={7} />
    <Line x1="45" y1="18" x2="45" y2="82" stroke="#000000" strokeWidth={5} />
    <Path d="M45,82 Q30,95 18,88" stroke="#000000" strokeWidth={5} fill="none" strokeLinecap="round" />
    <Path d="M45,82 Q60,95 72,88" stroke="#000000" strokeWidth={5} fill="none" strokeLinecap="round" />
    <G>
      <Text x="100" y="42" style={{ fontSize: 28, fontWeight: "bold" }}>
        <Tspan>DOCKYARD</Tspan>
      </Text>
    </G>
    <G>
      <Text x="100" y="75" style={{ fontSize: 18 }}>
        <Tspan>DESIGN</Tspan>
      </Text>
    </G>
    <Line x1="100" y1="48" x2="300" y2="48" stroke="#000000" strokeWidth={3} />
  </Svg>
);

export const Logo = ({ logoBase64 }: LogoProps) => {
  if (logoBase64) {
    return <Image src={logoBase64} style={{ width: 200, height: 40 }} />;
  }
  return <FallbackLogo />;
};

export default Logo;
