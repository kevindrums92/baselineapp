import type { Meta, StoryObj } from "@storybook/react-vite";
import ConfirmDialog from "./ConfirmDialog";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Modals/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onConfirm: () => console.log("[ConfirmDialog] Confirmed"),
    onClose: () => console.log("[ConfirmDialog] Closed"),
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  args: {
    message: "¿Estás seguro de que deseas continuar con esta acción?",
  },
};

export const Destructive: Story = {
  args: {
    title: "Eliminar movimiento",
    message:
      '¿Seguro que deseas eliminar "Almuerzo en restaurante" por $ 35.000?',
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    destructive: true,
  },
};

export const CustomText: Story = {
  args: {
    title: "Restaurar backup",
    message:
      "Se reemplazarán todos tus datos actuales con los del backup seleccionado. Esta acción no se puede deshacer.",
    confirmText: "Restaurar",
    cancelText: "Volver",
    destructive: false,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    message: "Este modal está cerrado (no se renderiza nada).",
  },
};
