import { RGBColor } from "../types";
import "../App.css";

export const Tile = ({
  color,
  isHighlighted,
  isDraggable,
}: {
  color: RGBColor;
  isHighlighted: boolean;
  isDraggable: boolean;
}) => {
  return (
    <div
      title={`(${color.join(",")})`}
      draggable={isDraggable}
      onDragStart={(e) =>
        isDraggable
          ? e.dataTransfer.setData("tileColor", JSON.stringify(color))
          : false
      }
      style={{
        backgroundColor: `rgb(${color.join(" ")}`,
        border: `2px solid ${isHighlighted ? "red" : "black"}`,
        ...(isDraggable && { cursor: "pointer" }),
      }}
      className="tile"
    />
  );
};
