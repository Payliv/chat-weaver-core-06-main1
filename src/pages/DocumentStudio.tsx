import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentStudio } from '@/hooks/useDocumentStudio';
import { DocumentUploader } from '@/components/document-studio/DocumentUploader';
import { DocumentHistory } from '@/components/document-studio/DocumentHistory';
import { DocumentPreview } from '@/components/document-studio/DocumentPreview';
import { DocumentChat } from '@/components/document-studio/DocumentChat';
import { DocumentActions } from '@/components/document-studio/DocumentActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, MessageSquare, Wand2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added import

export default function DocumentStudio() {
  const {
    uploadedFiles,
    selectedFile,
    chatMessages,
    loading,
    isProcessing,
    chatLoading,
    rightPanelView,
    setRightPanelView,
    selectFile,
    handleFileUpload,
    sendChatMessage,
    handleSummarize,
    handleTranslate,
    handleConvert,
    deleteFile,
    downloadFile,
  } = useDocumentStudio();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Studio Documents</h1>
              <p className="text-sm text-muted-foreground">Analysez, traduisez et convertissez vos documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Left Sidebar: Uploader & History */}
        <div className="w-full md:w-80 border-r md:border-b-0 border-b bg-card flex flex-col">
          <DocumentUploader
            onFileUpload={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            isProcessing={isProcessing}
          />
          <DocumentHistory
            files={uploadedFiles}
            selectedFile={selectedFile}
            onSelectFile={selectFile}
            onDeleteFile={deleteFile}
            onDownloadFile={downloadFile}
            loading={loading}
          />
        </div>

        {/* Main Content: Document Preview */}
        <div className="flex-1 flex flex-col">
          <DocumentPreview
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            onDownloadFile={downloadFile}
          />
        </div>

        {/* Right Sidebar: Chat & Actions */}
        <div className="w-full md:w-96 border-l md:border-t-0 border-t bg-card flex flex-col">
          <Tabs value={rightPanelView} onValueChange={(value) => setRightPanelView(value as any)} className="flex-1 flex flex-col">
            <div className="px-4 pt-4 border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat" className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />Chat IA</TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-1"><Wand2 className="w-4 h-4" />Actions</TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1"><Eye className="w-4 h-4" />Aperçu</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 m-0 h-full">
              <DocumentChat
                messages={chatMessages}
                isLoading={chatLoading}
                onSendMessage={sendChatMessage}
              />
            </TabsContent>
            <TabsContent value="actions" className="flex-1 m-0 h-full">
              <DocumentActions
                selectedFile={selectedFile}
                isProcessing={isProcessing}
                onSummarize={handleSummarize}
                onTranslate={handleTranslate}
                onConvert={handleConvert}
              />
            </TabsContent>
            <TabsContent value="preview" className="flex-1 m-0 h-full">
              <div className="p-4">
                {selectedFile ? (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-lg font-semibold mb-2">{selectedFile.name}</h3>
                    <ScrollArea className="h-[calc(100vh-250px)] border rounded-md p-4 bg-secondary/10">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{selectedFile.full_text}</pre>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <Eye className="w-12 h-12 mx-auto mb-4" />
                    <p>Aucun document sélectionné pour l'aperçu.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}