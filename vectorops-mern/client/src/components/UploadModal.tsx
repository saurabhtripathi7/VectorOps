"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, File, Trash2, FileText } from "lucide-react";
import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastProvider";
import { buildApiUrl } from "@/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KnowledgeFile {
  filePath: string;
  fileName: string;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const acceptedTypes = [".md", ".txt", ".pdf", ".docx"];

  const fetchKnowledgeFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch(buildApiUrl("/api/knowledge"));
      if (res.ok) {
        const data = await res.json();
        setKnowledgeFiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKnowledgeFiles();
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      showToast({
        type: "error",
        title: "Unsupported file type",
        message: `Please upload ${acceptedTypes.join(", ")} files only.`,
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(",")[1];

        if (!base64) {
          showToast({
            type: "error",
            title: "Failed to read file",
            message: "Unable to extract file content. Please try again.",
          });
          setUploading(false);
          return;
        }

        const res = await fetch(buildApiUrl("/api/injest"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: `knowledge/${selectedFile.name}`,
            contentBase64: base64,
          }),
        });

        if (res.ok) {
          showToast({
            type: "success",
            title: "File uploaded successfully",
            message: `${selectedFile.name} has been added to your knowledge base`,
          });
          setSelectedFile(null);
          fetchKnowledgeFiles();
        } else {
          const error = await res.json();
          showToast({
            type: "error",
            title: "Upload failed",
            message: error.message || "Failed to upload file. Please try again.",
          });
        }
        setUploading(false);
      };

      reader.onerror = () => {
        showToast({
          type: "error",
          title: "Failed to read file",
          message: "Unable to process the file. Please try a different file.",
        });
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      showToast({
        type: "error",
        title: "Upload failed",
        message: "An unexpected error occurred. Please try again.",
      });
      setUploading(false);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm(`Are you sure you want to delete ${filePath.split("/").pop()}? This will remove all associated context.`)) {
      return;
    }

    setDeletingFile(filePath);
    try {
      const res = await fetch(buildApiUrl("/api/knowledge"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (res.ok) {
        showToast({
          type: "success",
          title: "File deleted",
          message: `${filePath.split("/").pop()} has been removed from your knowledge base`,
        });
        fetchKnowledgeFiles();
      } else {
        const error = await res.json();
        showToast({
          type: "error",
          title: "Delete failed",
          message: error.error || "Failed to delete file. Please try again.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setDeletingFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Manage Knowledge</h2>
              <p className="text-sm text-zinc-500 mt-1">Upload or remove files from your knowledge base</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {knowledgeFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Current Knowledge Base ({knowledgeFiles.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {knowledgeFiles.map((file) => (
                  <motion.div
                    key={file.filePath}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-white/5 hover:border-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{file.fileName}</p>
                        <p className="text-xs text-zinc-500 truncate">{file.filePath}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(file.filePath)}
                      disabled={deletingFile === file.filePath}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {loadingFiles && (
            <div className="mb-6 text-center text-sm text-zinc-500">
              Loading knowledge base...
            </div>
          )}

          <h3 className="text-sm font-semibold text-white mb-3">Upload New File</h3>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-blue-400" : "text-zinc-500"}`} />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-2 text-white">
                <File className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-zinc-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <p className="text-white font-medium mb-1">
                  {isDragging ? "Drop file here" : "Click to browse or drag and drop"}
                </p>
                <p className="text-sm text-zinc-500">
                  Supports: {acceptedTypes.join(", ")}
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
