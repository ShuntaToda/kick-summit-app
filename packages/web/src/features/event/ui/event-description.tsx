"use client";

import MDEditor from "@uiw/react-md-editor";

export function EventDescription({ description }: { description: string }) {
  return (
    <div
      data-color-mode="light"
      className="[&_.wmde-markdown_ul]:list-disc [&_.wmde-markdown_ul]:pl-6 [&_.wmde-markdown_ol]:list-decimal [&_.wmde-markdown_ol]:pl-6 [&_.wmde-markdown_li]:my-1 [&_.wmde-markdown_ul_ul]:list-[circle] [&_.wmde-markdown_ul_ul_ul]:list-[square] [&_.wmde-markdown_table]:overflow-x-auto [&_.wmde-markdown_table]:block [&_.wmde-markdown_table_th]:whitespace-nowrap [&_.wmde-markdown_table_td]:whitespace-nowrap [&_.wmde-markdown_table_th]:px-4 [&_.wmde-markdown_table_th]:py-2 [&_.wmde-markdown_table_td]:px-4 [&_.wmde-markdown_table_td]:py-2 [&_.wmde-markdown_table_td]:text-sm [&_.wmde-markdown_table_th]:text-sm"
    >
      <MDEditor.Markdown source={description} />
    </div>
  );
}
