import { useState } from 'react';

const MAX_ROWS = 10;
const MAX_COLS = 10;

interface TableGridPickerProps {
  onSelect: (rows: number, cols: number) => void;
}

/**
 * Word/Google-Docs-style table insert grid: hovering highlights the
 * rows/cols up to the cursor, clicking inserts a table of that exact size.
 * Shared by every RichTextEditor instance via a single implementation.
 */
export function TableGridPicker({ onSelect }: TableGridPickerProps) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const rows = hovered ? hovered.row + 1 : 0;
  const cols = hovered ? hovered.col + 1 : 0;

  return (
    <div className="p-2 w-fit" data-testid="popover-table-grid-picker">
      <div className="text-xs text-gray-500 mb-2 text-center">
        {hovered ? `${rows} x ${cols} table` : 'Select table size'}
      </div>
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 18px)` }}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, idx) => {
          const row = Math.floor(idx / MAX_COLS);
          const col = idx % MAX_COLS;
          const isActive = hovered ? row <= hovered.row && col <= hovered.col : false;
          return (
            <div
              key={idx}
              data-testid={`cell-table-grid-${row}-${col}`}
              className={`w-[18px] h-[18px] border ${
                isActive ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
              } cursor-pointer`}
              onMouseEnter={() => setHovered({ row, col })}
              onClick={() => onSelect(row + 1, col + 1)}
            />
          );
        })}
      </div>
    </div>
  );
}
