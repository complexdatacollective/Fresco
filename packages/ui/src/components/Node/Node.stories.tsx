import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Harness from "@/components/StorybookHelpers/Harness";
import Node from "./Node";

const nodeColors = [...Array(10).keys()].map((i) => `node-color-seq-${i + 1}`);

const meta: Meta<typeof Node> = {
  title: "Components/Node",
  component: Node,
  argTypes: {
    label: {
      control: {
        type: "text",
      },
    },
    color: {
      control: {
        type: "select",
      },
      options: nodeColors,
    },
    inactive: {
      control: {
        type: "boolean",
      },
    },
    selected: {
      control: {
        type: "boolean",
      },
    },
    selectedColor: {
      control: {
        type: "select",
      },
      options: nodeColors,
    },
    linking: {
      control: {
        type: "boolean",
      },
    },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof Node>;

export const Basic: Story = {
  args: {
    label: "Node",
    color: "node-color-seq-1",
    inactive: false,
    selected: false,
    selectedColor: undefined,
    linking: false,
  },
};
