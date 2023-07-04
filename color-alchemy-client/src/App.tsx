import { useEffect, useState } from "react";
import { Row, Source, Tile } from "./components";
import {
  ClosestColor,
  GameDetails,
  RGBColor,
  Sources,
  Tiles,
  sides,
} from "./types";
import {
  calculateColorBlend,
  calculateColorDiff,
  fetchGameDetails,
  showResetDialog,
} from "./utils";
import "./App.css";

function App() {
  const [gameDetails, setGameDetails] = useState<GameDetails>();
  const [moveNum, setMoveNum] = useState<number>(0);
  const [sources, setSources] = useState<Sources>();
  const [tiles, setTiles] = useState<Tiles>();
  const [closestColor, setClosestColor] = useState<ClosestColor>();

  /**
   * Colors the tiles in the row or column corresponding to the selected tile.
   *
   * @param param.side - The side on which the selected source is located
   * @param param.sourceIndex - The index of the selected source on its side
   * @param param.color - The color to paint the tiles
   * @returns Void
   */
  const paintTiles = ({
    side,
    sourceIndex,
    color,
  }: {
    side: (typeof sides)[number];
    sourceIndex: number;
    color: RGBColor;
  }): void => {
    // If this function is somehow called without the game information being ready,
    // exit the function
    if (!tiles || !sources || !gameDetails || !closestColor) return;

    let newClosestColor = structuredClone(closestColor);
    const newTiles = structuredClone(tiles);
    const newSources = structuredClone(sources);
    newSources[side][sourceIndex] = color;

    // If the source is on the top or bottom, iterate along a column of tiles.
    // Otherwise iterate along a row
    const indices = {
      row: 0,
      column: 0,
    };
    let iterator: keyof typeof indices;
    let maxLength = 0;
    if (side === "top" || side === "bottom") {
      indices.column = sourceIndex;
      iterator = "row";
      maxLength = newTiles.length;
    } else {
      indices.row = sourceIndex;
      iterator = "column";
      maxLength = newTiles[sourceIndex].length;
    }

    while (indices[iterator] < maxLength) {
      // Calculate the new, blended color for each tile
      const result = calculateColorBlend({
        sources: newSources,
        ...gameDetails,
        ...indices,
      });

      // Calculate the color difference between the tile and the target.
      // If it is less than the previous closest color in this row/column, overwrite it
      const colorDiff = calculateColorDiff(result, gameDetails.target);
      if (colorDiff < newClosestColor.diff) {
        newClosestColor = {
          ...indices,
          color: result,
          diff: colorDiff,
        };
      }

      newTiles[indices.row][indices.column] = {
        color: result,
        diff: colorDiff,
      };

      indices[iterator]++;
    }

    if (
      // Check if the closest color was overwritten with a color that is farther away from the target
      newClosestColor.diff === closestColor.diff &&
      (((side === "top" || side === "bottom") &&
        sourceIndex === closestColor.column) ||
        ((side === "left" || side === "right") &&
          sourceIndex === closestColor.row))
    ) {
      // In this case, need to find the closest color by checking the entire tiles array
      newClosestColor.diff = 1;
      for (let rowIndex = 0; rowIndex < newTiles.length; rowIndex++) {
        for (
          let columnIndex = 0;
          columnIndex < newTiles[rowIndex].length;
          columnIndex++
        ) {
          const colorDiff = newTiles[rowIndex][columnIndex].diff;
          if (colorDiff < newClosestColor.diff) {
            newClosestColor = {
              column: columnIndex,
              row: rowIndex,
              color: newTiles[rowIndex][columnIndex].color,
              diff: colorDiff,
            };
          }
        }
      }
    }

    // Update all the game information
    setMoveNum((prevMoveNum) => prevMoveNum + 1);
    setSources(newSources);
    setTiles(newTiles);
    setClosestColor(newClosestColor);
  };

  // When the number of moves updates, check if the game should end
  useEffect(() => {
    if (closestColor && gameDetails) {
      if (closestColor.diff < 0.1) {
        showResetDialog("Success. Do you want to play again?", initializeGame);
      } else if (gameDetails.maxMoves - moveNum === 0) {
        showResetDialog("Failed. Do you want to try again?", initializeGame);
      }
    }
  }, [moveNum]);

  // Initialize a new game
  const initializeGame = async () => {
    const { details, initialSources, initialTiles } = await fetchGameDetails(
      gameDetails?.userId
    );

    setGameDetails(details);
    setTiles(initialTiles);
    setSources(initialSources);
    setMoveNum(0);
    setClosestColor({
      column: 0,
      row: 0,
      color: [0, 0, 0],
      diff: initialTiles[0][0].diff,
    });
  };

  useEffect(() => {
    // Initialize the game on first render
    initializeGame();
  }, []);

  return (
    <>
      {gameDetails && sources && closestColor && tiles ? (
        <>
          <div style={{ textAlign: "left" }}>
            <h4>RGB Alchemy</h4>
            <p>User ID: {gameDetails.userId}</p>
            <p>Moves left: {gameDetails.maxMoves - moveNum}</p>
            <div className="infoRow">
              Target color
              <div
                title={`(${gameDetails.target.join(",")})`}
                style={{
                  backgroundColor: `rgb(${gameDetails.target.join(" ")})`,
                  border: "2px solid black",
                }}
                className="tile"
              />
            </div>
            <div className="infoRow">
              Closest color
              <div
                title={`(${closestColor.color.join(",")})`}
                style={{
                  backgroundColor: `rgb(${closestColor.color.join(" ")})`,
                  border: "2px solid black",
                }}
                className="tile"
              />
              Δ = {(closestColor.diff * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <Row>
              {sources.top.map((source, i) => (
                <Source
                  moveNum={moveNum}
                  colorTiles={(tileColor: RGBColor) =>
                    paintTiles({
                      side: "top",
                      sourceIndex: i,
                      color: tileColor,
                    })
                  }
                  sourceColor={source}
                  key={`top-${i}`}
                />
              ))}
            </Row>
            {tiles.map((rowTiles, rowIndex) => (
              <Row key={`row-${rowIndex}`}>
                <Source
                  moveNum={moveNum}
                  colorTiles={(tileColor: RGBColor) =>
                    paintTiles({
                      side: "left",
                      sourceIndex: rowIndex,
                      color: tileColor,
                    })
                  }
                  sourceColor={sources.left[rowIndex]}
                />
                {rowTiles.map((tile, columnIndex) => (
                  <Tile
                    color={tile.color}
                    isHighlighted={
                      columnIndex === closestColor.column &&
                      rowIndex === closestColor.row
                    }
                    isDraggable={
                      moveNum > 2 && gameDetails.maxMoves - moveNum > 0
                    }
                    key={`tile-${rowIndex}-${columnIndex}`}
                  />
                ))}
                <Source
                  moveNum={moveNum}
                  colorTiles={(tileColor: RGBColor) =>
                    paintTiles({
                      side: "right",
                      sourceIndex: rowIndex,
                      color: tileColor,
                    })
                  }
                  sourceColor={sources.right[rowIndex]}
                />
              </Row>
            ))}
            <Row>
              {sources.bottom.map((source, i) => (
                <Source
                  moveNum={moveNum}
                  colorTiles={(tileColor: RGBColor) =>
                    paintTiles({
                      side: "bottom",
                      sourceIndex: i,
                      color: tileColor,
                    })
                  }
                  sourceColor={source}
                  key={`bottom-${i}`}
                />
              ))}
            </Row>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
}

export default App;
