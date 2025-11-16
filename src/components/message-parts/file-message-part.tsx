"use client";

import { FilePreview } from "../chat/file-preview";

interface FileMessagePartProps {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export function FileMessagePart({
  url,
  name,
  type,
  size = 0,
}: FileMessagePartProps) {
  return (
    <div className="my-2">
      <FilePreview
        url={url}
        name={name}
        type={type}
        size={size}
        className="max-w-md"
      />
    </div>
  );
}
