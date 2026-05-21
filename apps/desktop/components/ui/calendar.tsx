"use client";

/* eslint-disable react/prop-types */

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

const defaultClassNames = getDefaultClassNames();
const defaultFormatters = {
  formatMonthDropdown: (date: Date) =>
    date.toLocaleString("default", { month: "short" }),
};

function Calendar({
  className,
  classNames: classNamesProp,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const memoizedClassNames = React.useMemo(
    () => ({
      root: cn("w-fit", defaultClassNames.root),
      months: cn(
        "flex gap-4 flex-col md:flex-row relative",
        defaultClassNames.months,
      ),
      month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
      nav: cn(
        "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
        defaultClassNames.nav,
      ),
      button_previous: cn(
        buttonVariants({ variant: buttonVariant }),
        "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
        defaultClassNames.button_previous,
      ),
      button_next: cn(
        buttonVariants({ variant: buttonVariant }),
        "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
        defaultClassNames.button_next,
      ),
      month_caption: cn(
        "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
        defaultClassNames.month_caption,
      ),
      dropdowns: cn(
        "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
        defaultClassNames.dropdowns,
      ),
      dropdown_root: cn(
        "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
        defaultClassNames.dropdown_root,
      ),
      dropdown: cn(
        "absolute bg-popover inset-0 opacity-0",
        defaultClassNames.dropdown,
      ),
      caption_label: cn(
        "select-none font-medium",
        captionLayout === "label"
          ? "text-sm"
          : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
        defaultClassNames.caption_label,
      ),
      table: "w-full border-collapse",
      weekdays: cn("flex", defaultClassNames.weekdays),
      weekday: cn(
        "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
        defaultClassNames.weekday,
      ),
      week: cn("flex w-full mt-2", defaultClassNames.week),
      week_number: cn(
        "text-[0.8rem] select-none text-muted-foreground",
        defaultClassNames.week_number,
      ),
      day: cn(
        "relative w-full h-full p-0 text-center group/day aspect-square select-none",
        defaultClassNames.day,
      ),
      range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
      range_middle: cn("rounded-none", defaultClassNames.range_middle),
      range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
      today: cn(
        "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
        defaultClassNames.today,
      ),
      outside: cn(
        "text-muted-foreground aria-selected:text-muted-foreground",
        defaultClassNames.outside,
      ),
      disabled: cn(
        "text-muted-foreground opacity-50",
        defaultClassNames.disabled,
      ),
      hidden: cn("invisible", defaultClassNames.hidden),
      ...classNamesProp,
    }),
    [buttonVariant, captionLayout, classNamesProp],
  );

  const mergedFormatters = React.useMemo(
    () => ({ ...defaultFormatters, ...formatters }),
    [formatters],
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)]",
        className,
      )}
      captionLayout={captionLayout}
      formatters={mergedFormatters}
      classNames={memoizedClassNames}
      components={{
        Root: ({ className: rootClass, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(rootClass)}
            {...rootProps}
          />
        ),
        Chevron: ({ className: chevClass, orientation, ...chevProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4", chevClass)}
                {...chevProps}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", chevClass)}
                {...chevProps}
              />
            );
          }
          return (
            <ChevronDownIcon
              className={cn("size-4", chevClass)}
              {...chevProps}
            />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const dayDefaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers["focused"] && ref.current) ref.current.focus();
  }, [modifiers]);
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers["selected"] &&
        !modifiers["range_start"] &&
        !modifiers["range_end"] &&
        !modifiers["range_middle"]
      }
      data-range-start={modifiers["range_start"]}
      data-range-end={modifiers["range_end"]}
      data-range-middle={modifiers["range_middle"]}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal [&>span]:text-xs [&>span]:opacity-70",
        dayDefaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
