import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentManager } from '@/hooks/useDocumentManager';
import { DocumentUploader } from '@/components/document-studio/DocumentUploader';
import { DocumentHistory } from '@/components/document-studio/DocumentHistory';
import { DocumentPreview } from '@/components/document-studio/DocumentPreview';
import { DocumentChat } from '@/components/document-studio/DocumentChat';
import { DocumentActions } from '@/components/document-studio/DocumentActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Wand2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DocumentStudio() {
  const {
    files,
    selectedFile,
    chatMessages,
    isLoading,
    isProcessing, // Pass isProcessing to DocumentPreview
    chatLoading,
    selectFile,
    uploadFile,
    sendChatMessage,
    deleteFile,
    downloadFile,
    summarizeDocument,
    translateDocument,
    convertDocument,
  } = useDocumentManager();

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
              <p className="text-sm text-muted-foreground">Analysez et discutez avec vos documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-full md:w-80 border-r md:border-b-0 border-b bg-card flex flex-col">
          <DocumentUploader
            onFileUpload={(e) => e.target.files && uploadFile(e.target.files[0])}
            isProcessing={isProcessing}
          />
          <DocumentHistory
            files={files}
            selectedFile={selectedFile}
            onSelectFile={selectFile}
            onDeleteFile={deleteFile}
            onDownloadFile={downloadFile}
            loading={isLoading}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <DocumentPreview
            selectedFile={selectedFile}
            isProcessing={isProcessing} // Pass isProcessing here
            onDownloadFile={downloadFile}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-full md:w-96 border-l md:border-t-0 border-t bg-card flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" /> Chat
              </TabsTrigger>
              <TabsTrigger value="actions">
                <Wand2 className="w-4 h-4 mr-2" /> Actions IA
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 flex flex-col">
              <DocumentChat
                messages={chatMessages}
                isLoading={chatLoading}
                onSendMessage={sendChatMessage}
              />
            </TabsContent>
            <TabsContent value="actions" className="flex-1 flex flex-col">
              <DocumentActions
                selectedFile={selectedFile}
                onSummarize={summarizeDocument}
                onTranslate={translateDocument}
                onConvert={convertDocument}
                onSendMessage={sendChatMessage}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}