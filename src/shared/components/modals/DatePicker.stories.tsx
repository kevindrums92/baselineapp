import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import DatePicker from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "Modals/DatePicker",
  component: DatePicker,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Open: Story = {
  args: {
    open: true,
    value: "2026-02-10",
    onClose: () => console.log("[DatePicker] Closed"),
    onChange: (date: string) => console.log("[DatePicker] Selected:", date),
  },
};

export const Interactive: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [date, setDate] = useState("2026-02-10");

    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900"
        >
          Abrir DatePicker (seleccionado: {date})
        </button>
        <DatePicker
          open={open}
          onClose={() => setOpen(false)}
          value={date}
          onChange={(d) => {
            setDate(d);
            setOpen(false);
          }}
        />
      </div>
    );
  },
};

export const PreselectedDate: Story = {
  args: {
    open: true,
    value: "2025-12-25",
    onClose: () => {},
    onChange: (date: string) => console.log("[DatePicker] Selected:", date),
  },
};
