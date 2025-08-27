import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentManager } from '@/hooks/useDocumentManager';
import { DocumentSidebar } from '@/components/document-studio/DocumentSidebar.tsx';
import { DocumentViewer } from '@/components/document-studio/DocumentViewer.tsx';

export default function Documents() {
  const {
    uploadedFiles,
    selectedFile,
    chatMessages,
    loading,
    isProcessing,
    chatLoading,
    selectFile,
    handleFileUpload,
    sendChatMessage,
    handleSummarize,
    handleTranslate,
    handleConvert,
    deleteFile,
    downloadFile,
  } = useDocumentManager();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Studio Documents</h1>
              <p className="text-sm text-muted-foreground">Analysez, traduisez et convertissez vos documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        <DocumentSidebar
          files={uploadedFiles}
          selectedFile={selectedFile}
          onSelectFile={selectFile}
          onFileUpload={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          onDeleteFile={deleteFile}
          onDownloadFile={downloadFile}
          isProcessing={isProcessing}
        />
        <DocumentViewer
          selectedFile={selectedFile}
          chatMessages={chatMessages}
          chatLoading={chatLoading}
          onSendMessage={sendChatMessage}
          onSummarize={handleSummarize}
          onTranslate={handleTranslate}
          onConvert={handleConvert}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}