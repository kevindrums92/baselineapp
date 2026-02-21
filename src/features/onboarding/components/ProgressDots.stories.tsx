import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgressDots from "./ProgressDots";

const meta: Meta<typeof ProgressDots> = {
  title: "Onboarding/ProgressDots",
  component: ProgressDots,
};

export default meta;
type Story = StoryObj<typeof ProgressDots>;

export const DotsStep1: Story = {
  args: { total: 4, current: 1, variant: "default" },
};

export const DotsStep2: Story = {
  args: { total: 4, current: 2, variant: "default" },
};

export const DotsStep3: Story = {
  args: { total: 4, current: 3, variant: "default" },
};

export const DotsStep4: Story = {
  args: { total: 4, current: 4, variant: "default" },
};

export const BarStart: Story = {
  args: { total: 5, current: 1, variant: "bar" },
};

export const BarMidway: Story = {
  args: { total: 5, current: 3, variant: "bar" },
};

export const BarComplete: Story = {
  args: { total: 5, current: 5, variant: "bar" },
};
