import * as React from "react";
import Svg, { Path } from "react-native-svg";

export default function BookIcon({ size = 24, color = "green" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <Path
        d="M12.5 7C12.5 5.93913 12.0786 4.92172 11.3284 4.17157C10.5783 3.42143 9.56087 3 8.5 3H2.5V18H9.5C10.2956 18 11.0587 18.3161 11.6213 18.8787C12.1839 19.4413 12.5 20.2044 12.5 21M12.5 7V21M12.5 7C12.5 5.93913 12.9214 4.92172 13.6716 4.17157C14.4217 3.42143 15.4391 3 16.5 3H22.5V18H15.5C14.7044 18 13.9413 18.3161 13.3787 18.8787C12.8161 19.4413 12.5 20.2044 12.5 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
