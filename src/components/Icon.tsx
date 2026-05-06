import { SymbolView } from "expo-symbols";

export type IconName =
  | "plus"
  | "chevron.left"
  | "xmark"
  | "person.2"
  | "person.2.fill"
  | "calendar"
  | "gift"
  | "gift.fill"
  | "gearshape";

export type IconWeight =
  | "ultraLight"
  | "thin"
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "heavy"
  | "black";

export type IconProps = {
  name: IconName;
  color: string;
  size: number;
  weight?: IconWeight;
};

export function Icon({ name, color, size, weight }: IconProps) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={size}
      weight={weight}
      resizeMode="scaleAspectFit"
    />
  );
}
