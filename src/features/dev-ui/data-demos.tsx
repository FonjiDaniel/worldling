"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { DataTable, type dataTableFeatures } from "@/components/ui/data-table";

interface WorldRow {
  name: string;
  owner: string;
  level: number;
  comets: number;
}

const rows: WorldRow[] = [
  { name: "Pebble", owner: "ada", level: 3, comets: 12 },
  { name: "Mossheart", owner: "grace", level: 5, comets: 40 },
  { name: "Tidewhistle", owner: "katherine", level: 1, comets: 2 },
  { name: "Ember Hollow", owner: "mae", level: 4, comets: 27 },
];

const helper = createColumnHelper<typeof dataTableFeatures, WorldRow>();
const columns = helper.columns([
  helper.accessor("name", { header: "World" }),
  helper.accessor("owner", { header: "Owner", cell: (info) => `@${info.getValue()}` }),
  helper.accessor("level", { header: "Bloom level" }),
  helper.accessor("comets", { header: "Comets" }),
]);
const noRows: WorldRow[] = [];

const activity = [
  { day: "Mon", visits: 32, comets: 8 },
  { day: "Tue", visits: 41, comets: 12 },
  { day: "Wed", visits: 28, comets: 6 },
  { day: "Thu", visits: 52, comets: 15 },
  { day: "Fri", visits: 61, comets: 21 },
  { day: "Sat", visits: 74, comets: 25 },
  { day: "Sun", visits: 58, comets: 17 },
];

const chartConfig: ChartConfig = {
  visits: { label: "Visits", color: "var(--color-primary)" },
  comets: { label: "Comets", color: "var(--color-accent)" },
};

export function DataDemos() {
  return (
    <div className="flex flex-col gap-6">
      <DataTable caption="Newest worlds" columns={columns} data={rows} />
      <DataTable
        caption="Reported worlds"
        columns={columns}
        data={noRows}
        empty="Nothing to review. The universe is calm."
      />
      <ChartContainer
        config={chartConfig}
        title="Activity this week"
        summary="Visits peaked on Saturday at 74, with 25 comets."
      >
        <BarChart data={activity} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width="auto" />
          <ChartTooltip config={chartConfig} />
          <Bar dataKey="visits" fill="var(--chart-visits)" radius={4} />
          <Bar dataKey="comets" fill="var(--chart-comets)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
