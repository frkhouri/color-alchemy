export type RGBColor = number[];

export type GameDetails = {
  userId: string;
  width: number;
  height: number;
  maxMoves: number;
  target: number[];
};

export const sides = ["top", "left", "right", "bottom"] as const;
export type Sources = {
  [key in (typeof sides)[number]]: RGBColor[];
};

export type Tiles = {
  color: RGBColor;
  diff: number;
}[][];

export type ClosestColor = {
  column: number;
  row: number;
  color: RGBColor;
  diff: number;
};
