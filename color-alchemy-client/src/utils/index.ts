import { GameDetails, RGBColor, Sources, Tiles } from "../types";

export const baseUrl = "http://localhost:9876";

/**
 * Fills an array of specified length with black RGB values.
 *
 * @param length - The desired length of the array
 * @returns An array where all elements are `[0, 0, 0]`
 */
export const fillColorArray = (length: number): RGBColor[] => {
  return Array(length)
    .fill(undefined)
    .map(() => [0, 0, 0]);
};

/**
 * Fetches the data required to start a new game.
 *
 * @param userId - An optional user id. If passed in, it is kept the same in the new game
 * @returns The details, initial sources, and initial tiles of a new game
 */
export const fetchGameDetails = async (
  userId?: string
): Promise<{
  details: GameDetails;
  initialSources: Sources;
  initialTiles: Tiles;
}> => {
  // Fetch the game details using the appropriate endpoint
  const fetchUrl = userId
    ? baseUrl + `/init/user/${userId}`
    : baseUrl + "/init";
  const details: GameDetails = await fetch(fetchUrl).then((res) => res.json());
  const { target, height, width } = details;

  // Calculate the color difference between black and the target color,
  // then fill up the initialTiles array with black tiles using the returned dimensions
  const initialDiff = calculateColorDiff([0, 0, 0], target);
  const initialTiles: Tiles = Array(height)
    .fill(undefined)
    .map(() =>
      Array(width)
        .fill(undefined)
        .map(() => ({
          color: [0, 0, 0],
          diff: initialDiff,
        }))
    );

  // Create the initialSources object using the returned dimensions
  const initialSources: Sources = {
    top: fillColorArray(width),
    left: fillColorArray(height),
    right: fillColorArray(height),
    bottom: fillColorArray(width),
  };

  return {
    details,
    initialSources,
    initialTiles,
  };
};

/**
 * Calculates the difference between two colors using a provided formula.
 *
 * @param color1 - The first color
 * @param color2 - The second color
 * @returns A number between 0 and 1 that indicates the difference between the two colors,
 * where 0 means they are the same color
 */
export const calculateColorDiff = (
  color1: RGBColor,
  color2: RGBColor
): number => {
  const rootValue = color1.reduce(
    (a, value, i) => a + (value - color2[i]) ** 2,
    0
  );
  const diff = (1 / 255) * (1 / Math.sqrt(3)) * Math.sqrt(rootValue);
  return diff;
};

/**
 * Calculates the color of a tile by combining the colors of the four corresponding sources.
 *
 * @param param.sources - The sources object
 * @param param.height - The height of the tiles array
 * @param param.width - The width of the tiles array
 * @param param.row - The row index of the tile to calculate the color of
 * @param param.column - The column index of the tile to calculate the color of
 * @returns The color of the tile
 */
export const calculateColorBlend = ({
  sources,
  height,
  width,
  row,
  column,
}: {
  sources: Sources;
  height: number;
  width: number;
  row: number;
  column: number;
}): RGBColor => {
  const relativeDistanceTop = (height - row) / (height + 1);
  const relativeDistanceLeft = (width - column) / (width + 1);
  const relativeDistanceRight = (1 + column) / (width + 1);
  const relativeDistanceBottom = (1 + row) / (height + 1);

  const calculateColorComponent = (colorComponent: number) =>
    sources.top[column][colorComponent] * relativeDistanceTop +
    sources.left[row][colorComponent] * relativeDistanceLeft +
    sources.right[row][colorComponent] * relativeDistanceRight +
    sources.bottom[column][colorComponent] * relativeDistanceBottom;

  const r = calculateColorComponent(0);
  const g = calculateColorComponent(1);
  const b = calculateColorComponent(2);

  const f = 255 / Math.max(r, g, b, 255);
  const result = [r * f, g * f, b * f].map(Math.round);

  return result;
};

/**
 * Shows a confirm dialog to start a new game.
 *
 * @param text - The text to show in the dialog
 * @param onConfirm - The function to call when confirm is clicked
 * @returns Void
 */
export const showResetDialog = (text: string, onConfirm: () => void): void => {
  // Add a timeout of 0 ms to allow the screen to update before showing the dialog
  const timer = setTimeout(() => {
    if (confirm(text)) onConfirm();
  }, 0);

  () => clearTimeout(timer);
};
