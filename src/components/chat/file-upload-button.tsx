"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "ui/dialog";

interface FileUploadButtonProps {
  onFileUpload: (file: {
    url: string;
    name: string;
    type: string;
    size: number;
  }) => void;
  disabled?: boolean;
}

export function FileUploadButton({
  onFileUpload,
  disabled = false,
}: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview({
        url: reader.result as string,
        name: file.name,
        type: file.type,
        size: file.size,
      });
      setShowDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;

      formData.append("file", file);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.remaining !== undefined) {
          toast.error(
            `Upload limit reached. ${error.remaining} uploads remaining today.`,
            { duration: 5000 },
          );
        } else {
          toast.error(error.error || "Upload failed");
        }
        return;
      }

      const result = await response.json();

      onFileUpload({
        url: result.url,
        name: preview.name,
        type: preview.type,
        size: preview.size,
      });

      toast.success("File uploaded successfully!");
      setShowDialog(false);
      setPreview(null);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImage = preview?.type.startsWith("image/");
  const isVideo = preview?.type.startsWith("video/");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="size-8"
        title="Upload file"
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Preview and confirm file upload
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                {isImage && (
                  <Image
                    src={preview.url}
                    alt={preview.name}
                    className="object-contain"
                    fill
                    unoptimized
                  />
                )}
                {isVideo && (
                  <video
                    src={preview.url}
                    className="w-full h-auto max-h-64 object-contain"
                    controls
                  />
                )}
                {!isImage && !isVideo && (
                  <div className="w-full h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-muted-foreground truncate">
                        {preview.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium truncate">{preview.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">
                    {(preview.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{preview.type}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
