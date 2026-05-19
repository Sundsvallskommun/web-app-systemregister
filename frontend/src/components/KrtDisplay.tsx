"use client";

import {
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";

const LEVEL_COLORS: Record<number, string> = {
  0: "#9E9E9E",
  1: "#4CAF50",
  2: "#FF9800",
  3: "#F44336",
  4: "#B71C1C",
};

const LEVEL_LABELS: Record<number, string> = {
  0: "-",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
};

export function KrtChip({ value }: { value: number }) {
  const color = LEVEL_COLORS[value] ?? "#9E9E9E";
  return (
    <div
      className='krt-chip'
      style={{
        borderColor: color,
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "100%",
        width: "24px",
        height: "24px",
        alignItems: "center",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      <Typography sx={{ lineHeight: "normal" }} variant='caption'>
        {LEVEL_LABELS[value] ?? "-"}
      </Typography>
    </div>
  );
}

export function KrtSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size='small'
      onChange={(_, v) => {
        if (v !== null) onChange(v);
      }}
    >
      {[1, 2, 3, 4].map((n) => (
        <ToggleButton
          key={n}
          value={n}
          sx={{
            px: 1.5,
            fontWeight: 700,
            "&.Mui-selected": {
              bgcolor: LEVEL_COLORS[n],
              color: "white",
              "&:hover": { bgcolor: LEVEL_COLORS[n] },
            },
          }}
        >
          {n}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
