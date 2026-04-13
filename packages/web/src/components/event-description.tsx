"use client";

import MDEditor from "@uiw/react-md-editor";

export function EventDescription({ description }: { description: string }) {
  return (
    <div
      data-color-mode="light"
      className="[&_.wmde-markdown_table]:overflow-x-auto [&_.wmde-markdown_table]:block [&_.wmde-markdown_table_th]:whitespace-nowrap [&_.wmde-markdown_table_td]:whitespace-nowrap [&_.wmde-markdown_table_th]:px-4 [&_.wmde-markdown_table_th]:py-2 [&_.wmde-markdown_table_td]:px-4 [&_.wmde-markdown_table_td]:py-2 [&_.wmde-markdown_table_td]:text-sm [&_.wmde-markdown_table_th]:text-sm"
    >
      <MDEditor.Markdown source={description} />
    </div>
  );
}
