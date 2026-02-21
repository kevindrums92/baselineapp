import type { Meta, StoryObj } from "@storybook/react-vite";
import BottomBar from "./BottomBar";

const meta: Meta<typeof BottomBar> = {
  title: "Layout/BottomBar",
  component: BottomBar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-[300px] bg-gray-50 dark:bg-gray-950">
        <div className="px-4 pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            La barra de navegación se fija en la parte inferior.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomBar>;

export const Default: Story = {};
