import type { Meta, StoryObj } from "@storybook/react-vite";
import SlideAnimation, { StaggeredAnimation } from "./SlideAnimation";

const meta: Meta<typeof SlideAnimation> = {
  title: "Onboarding/SlideAnimation",
  component: SlideAnimation,
};

export default meta;
type Story = StoryObj<typeof SlideAnimation>;

const SampleCard = ({ text }: { text: string }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
    <p className="font-medium text-gray-900 dark:text-gray-50">{text}</p>
  </div>
);

export const FromRight: Story = {
  args: {
    direction: "right",
    delay: 0,
    children: <SampleCard text="Slide desde la derecha" />,
  },
};

export const FromLeft: Story = {
  args: {
    direction: "left",
    delay: 0,
    children: <SampleCard text="Slide desde la izquierda" />,
  },
};

export const FromUp: Story = {
  args: {
    direction: "up",
    delay: 0,
    children: <SampleCard text="Slide desde arriba" />,
  },
};

export const FromDown: Story = {
  args: {
    direction: "down",
    delay: 0,
    children: <SampleCard text="Slide desde abajo" />,
  },
};

export const WithDelay: Story = {
  args: {
    direction: "up",
    delay: 500,
    children: <SampleCard text="Aparece con 500ms de delay" />,
  },
};

export const Staggered: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <StaggeredAnimation staggerDelay={100} direction="up">
        <SampleCard text="Elemento 1" />
        <SampleCard text="Elemento 2" />
        <SampleCard text="Elemento 3" />
        <SampleCard text="Elemento 4" />
      </StaggeredAnimation>
    </div>
  ),
};
