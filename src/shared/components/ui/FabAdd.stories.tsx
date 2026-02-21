import type { Meta, StoryObj } from "@storybook/react-vite";
import FabAdd from "./FabAdd";

const meta: Meta<typeof FabAdd> = {
  title: "UI/FabAdd",
  component: FabAdd,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-[400px] bg-gray-50 dark:bg-gray-950">
        <div className="px-4 pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El FAB se posiciona en la esquina inferior derecha.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FabAdd>;

export const Default: Story = {};
