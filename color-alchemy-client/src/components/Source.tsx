import { RGBColor } from "../types";
import "../App.css";

export const Source = ({
  moveNum,
  colorTiles,
  sourceColor,
}: {
  moveNum: number;
  colorTiles: (color: RGBColor) => void;
  sourceColor: RGBColor;
}) => {
  const handleClick = () => {
    if (moveNum === 0) colorTiles([255, 0, 0]);
    else if (moveNum === 1) colorTiles([0, 255, 0]);
    else if (moveNum === 2) colorTiles([0, 0, 255]);
  };

  const handleDropTile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const tileColor: RGBColor = JSON.parse(e.dataTransfer.getData("tileColor"));
    colorTiles(tileColor);
  };

  return (
    <div
      title={`(${sourceColor.join(",")})`}
      style={{
        backgroundColor: `rgb(${sourceColor.join(" ")}`,
        ...(moveNum < 3 && { cursor: "pointer" }),
      }}
      onClick={moveNum < 3 ? () => handleClick() : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropTile}
      className="source"
    />
  );
};
