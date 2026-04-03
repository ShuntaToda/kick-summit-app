"use client";

import MDEditor from "@uiw/react-md-editor";

export function EventDescription({ description }: { description: string }) {
  return (
    <div data-color-mode="light">
      <MDEditor.Markdown source={description} />
    </div>
  );
}
