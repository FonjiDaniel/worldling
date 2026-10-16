import type { ReactNode } from "react";

import { Button, type ButtonProps } from "./button";

type IconButtonProps = Omit<ButtonProps, "size" | "children" | "aria-label"> & {
  /** Accessible name. Required because the button shows only an icon. */
  label: string;
  icon: ReactNode;
};

export function IconButton({ label, icon, variant = "ghost", ...props }: IconButtonProps) {
  return (
    <Button size="icon" variant={variant} aria-label={label} title={label} {...props}>
      <span aria-hidden className="contents">
        {icon}
      </span>
    </Button>
  );
}
