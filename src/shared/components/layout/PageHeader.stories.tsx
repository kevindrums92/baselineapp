import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Trash2, Download } from "lucide-react";
import PageHeader from "./PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-[200px] bg-gray-50 dark:bg-gray-950">
        <Story />
        <div className="px-4 pt-6">
          <p className="text-sm text-gray-500">Contenido de la página...</p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: "Categorías",
    onBack: () => console.log("[PageHeader] Back pressed"),
  },
};

export const WithRightActions: Story = {
  args: {
    title: "Categorías",
    onBack: () => console.log("[PageHeader] Back pressed"),
    rightActions: (
      <div className="flex gap-1">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Download className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: "Historial de transacciones del mes",
    onBack: () => console.log("[PageHeader] Back pressed"),
  },
};

export const WithDeleteAction: Story = {
  args: {
    title: "Editar categoría",
    onBack: () => console.log("[PageHeader] Back pressed"),
    rightActions: (
      <button
        type="button"
        className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-950"
      >
        <Trash2 className="h-5 w-5 text-red-500" />
      </button>
    ),
  },
};
