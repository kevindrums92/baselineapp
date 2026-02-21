import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronLeft } from "lucide-react";
import FullscreenLayout from "./FullscreenLayout";
import ProgressDots from "@/features/onboarding/components/ProgressDots";

const meta: Meta<typeof FullscreenLayout> = {
  title: "Layout/FullscreenLayout",
  component: FullscreenLayout,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof FullscreenLayout>;

export const WithHeaderAndCTA: Story = {
  args: {
    headerLeft: (
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800"
      >
        <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
      </button>
    ),
    headerCenter: <ProgressDots total={4} current={2} />,
    headerRight: (
      <button
        type="button"
        className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        Omitir
      </button>
    ),
    children: (
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold leading-tight text-gray-900 dark:text-gray-50">
          Bienvenido a BaselineApp
        </h1>
        <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
          La forma más inteligente de controlar tus finanzas personales.
        </p>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Contenido de ejemplo dentro de un card
          </p>
        </div>
      </div>
    ),
    ctaButton: (
      <button
        type="button"
        className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white"
      >
        Continuar
      </button>
    ),
  },
};

export const Minimal: Story = {
  args: {
    children: (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Contenido centrado</p>
      </div>
    ),
  },
};

export const ScrollableContent: Story = {
  args: {
    headerCenter: <ProgressDots total={5} current={3} variant="bar" />,
    children: (
      <div className="space-y-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <p className="font-medium text-gray-900 dark:text-gray-50">
              Card #{i + 1}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Este contenido se puede scrollear verticalmente.
            </p>
          </div>
        ))}
      </div>
    ),
    ctaButton: (
      <button
        type="button"
        className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white"
      >
        Finalizar
      </button>
    ),
  },
};
