"use client";

import { uploadImagesApi } from "@/services/uploadService";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

// --- Các định nghĩa Type không đổi ---
interface CKEditorLoader {
  file: Promise<File>;
}
interface CKEditorInstance {
  plugins: {
    get: (pluginName: string) => {
      createUploadAdapter: (loader: CKEditorLoader) => MyUploadAdapter;
    };
  };
}
class MyUploadAdapter {
  private loader: CKEditorLoader;
  constructor(loader: CKEditorLoader) {
    this.loader = loader;
  }
  public upload(): Promise<{ default: string }> {
    return this.loader.file.then((file: File) => {
      return new Promise(async (resolve, reject) => {
        const toastId = toast.loading(`Đang tải lên ảnh: ${file.name}...`);
        try {
          const response = await uploadImagesApi([file], "editor_content");
          if (response?.imageUrls?.[0]) {
            toast.success(`Tải lên ảnh "${file.name}" thành công!`, {
              id: toastId,
            });
            resolve({ default: response.imageUrls[0] });
          } else {
            const errorMessage = "Phản hồi từ server không hợp lệ.";
            toast.error(errorMessage, { id: toastId });
            reject(errorMessage);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload ảnh thất bại.";
          toast.error(`Lỗi khi tải ảnh "${file.name}": ${errorMessage}`, {
            id: toastId,
          });
          reject(errorMessage);
        }
      });
    });
  }
  public abort(): void {
    // Logic hủy upload
  }
}
function MyCustomUploadAdapterPlugin(editor: CKEditorInstance) {
  editor.plugins.get("FileRepository").createUploadAdapter = (
    loader: CKEditorLoader,
  ) => {
    return new MyUploadAdapter(loader);
  };
}

// --- React Component (ĐÃ TỐI ƯU) ---

interface CustomEditorProps {
  initialData?: string;
  onChange: (data: string) => void;
  isEditorReady?: boolean;
}

const CustomEditor: React.FC<CustomEditorProps> = ({
  initialData = "",
  onChange,
  isEditorReady = true,
}) => {
  // State nội bộ để lưu trữ dữ liệu từ editor ngay lập tức
  const [localData, setLocalData] = useState<string>(initialData);
  // Ref để tránh gọi onChange lần đầu khi component mount
  const isFirstRender = useRef(true);

  // Đồng bộ state nội bộ nếu initialData từ props thay đổi
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  // DEBOUNCE LOGIC: Chỉ gọi hàm onChange của cha sau khi người dùng ngừng gõ
  useEffect(() => {
    // Không chạy trong lần render đầu tiên
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Đặt một bộ đếm thời gian
    const handler = setTimeout(() => {
      // Chỉ gọi onChange nếu dữ liệu đã thực sự thay đổi so với prop ban đầu
      if (localData !== initialData) {
        onChange(localData);
      }
    }, 500); // Đợi 500ms

    // Dọn dẹp: Hủy bộ đếm thời gian trước đó nếu người dùng tiếp tục gõ
    return () => {
      clearTimeout(handler);
    };
  }, [localData, onChange, initialData]); // Chạy lại effect này khi localData thay đổi

  const editorStyle = `
    .ck-editor__editable_inline {
        min-height: 300px; max-height: 600px;
        border: 1px solid var(--cui-input-border-color, #b1b7c1) !important;
        border-top: none !important;
        border-radius: 0 0 var(--cui-border-radius, 0.375rem) var(--cui-border-radius, 0.375rem) !important;
        padding: 0.5rem 1rem !important;
    }
    .ck-toolbar {
        border: 1px solid var(--cui-input-border-color, #b1b7c1) !important;
        border-bottom: none !important;
        border-radius: var(--cui-border-radius, 0.375rem) var(--cui-border-radius, 0.375rem) 0 0 !important;
    }
  `;

  if (!isEditorReady) {
    return (
      <div className="flex h-[382px] items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <>
      <style>{editorStyle}</style>
      <div className="prose prose-sm ck-content max-w-none">
        <CKEditor
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          editor={ClassicEditor as any}
          data={localData}
          config={{
            extraPlugins: [MyCustomUploadAdapterPlugin],
            toolbar: {
              items: [
                "heading",
                "|",
                "bold",
                "italic",
                "underline",
                "link",
                "|",
                "bulletedList",
                "numberedList",
                "blockQuote",
                "|",
                "imageUpload",
                "insertTable",
                "|",
                "undo",
                "redo",
              ],
            },
            image: {
              toolbar: [
                "imageTextAlternative",
                "imageStyle:inline",
                "imageStyle:block",
                "imageStyle:side",
              ],
              upload: {
                types: ["jpeg", "png", "gif", "bmp", "webp", "tiff", "svg+xml"],
              },
            },
            table: {
              contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
            },
          }}
          onChange={(event, editor) => {
            // Cập nhật state nội bộ ngay lập tức, không gọi prop onChange
            setLocalData(editor.getData());
          }}
        />
      </div>
    </>
  );
};

export default CustomEditor;
