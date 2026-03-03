import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from './context/DataContext.jsx';
import { useSettings } from './context/SettingsContext.jsx';
import { getAllNovelMetadata } from '@/lib/indexedDb.js';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConceptCacheList from '@/components/concept/ConceptCacheList.jsx';
import NovelOverviewTab from '@/components/novel/NovelOverviewTab.jsx';
import PlanView from '@/components/plan/PlanView.jsx';
import SettingsView from '@/components/settings/SettingsView.jsx';
import WriteView from '@/components/write/WriteView.jsx';
import ChatView from '@/components/chat/ChatView.jsx';
import CodexView from '@/components/codex/CodexView.jsx';
import ReviewView from '@/components/review/ReviewView.jsx';
import { Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Rabbit, Home, Clipboard, Edit, Settings, BookOpen, Lightbulb, Sun, Moon, Text, Sparkles, Users, FileText, MessageCircle, BookMarked, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FontSettingsControl from '@/components/settings/FontSettingsControl';
import { BetaReaderModal } from '@/components/ai/BetaReaderModal';
import { OracleAnalysisModal } from '@/components/ai/OracleAnalysisModal';
import { DocumentImportExportModal } from '@/components/ai/DocumentImportExportModal';

function App({ novelId }) {
  const { t } = useTranslation();
  const { isDataLoaded, currentNovelId } = useData();
  const [activeMainTab, setActiveMainTab] = useState("plan");
  const [activeSidebarTab, setActiveSidebarTab] = useState("overview");
  const [currentNovelName, setCurrentNovelName] = useState(t('novel_editor_default_novel_name'));
  const [targetChapterId, setTargetChapterId] = useState(null);
  const [targetSceneId, setTargetSceneId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBetaReaderOpen, setIsBetaReaderOpen] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  const sidebarPanelRef = useRef(null);
  const { themeMode, activeOsTheme, setThemeMode } = useSettings();
  const toggleSidebar = () => {
    if (sidebarPanelRef.current) {
      if (isSidebarCollapsed) sidebarPanelRef.current.expand();
      else sidebarPanelRef.current.collapse();
    }
  };
  useEffect(() => {
    if (novelId) {
      const fetchNovelName = async () => {
        try {
          const allMeta = await getAllNovelMetadata();
          const currentMeta = allMeta.find(m => m.id === novelId);
          if (currentMeta) setCurrentNovelName(currentMeta.name);
          else setCurrentNovelName(t('novel_editor_novel_not_found'));
        } catch (error) {
          console.error("Failed to fetch novel name:", error);
          setCurrentNovelName(t('novel_editor_default_novel_name'));
        }
      };
      fetchNovelName();
    }
  }, [novelId, t]);
  const effectiveTheme = themeMode === 'system' ? activeOsTheme : themeMode;
  const handleThemeToggle = () => setThemeMode(effectiveTheme === 'light' ? 'dark' : 'light');
  const handleSwitchToWriteTab = (chapterId, sceneId = null) => {
    setActiveMainTab('write');
    setTargetChapterId(chapterId);
    setTargetSceneId(sceneId);
    setTimeout(() => {
      setTargetChapterId(null);
      setTargetSceneId(null);
    }, 100);
  };
  if (!isDataLoaded || currentNovelId !== novelId) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background">
        <Rabbit className="h-12 w-12 animate-pulse text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('novel_editor_loading_data')}</p>
      </div>
    );
  }
  const renderRightPaneContent = () => {
    switch (activeMainTab) {
      case "write": return <WriteView targetChapterId={targetChapterId} targetSceneId={targetSceneId} />;
      case "plan": return <PlanView onSwitchToWriteTab={handleSwitchToWriteTab} novelId={novelId} />;
      case "settings": return <SettingsView />;
      case "chat": return <ChatView novelId={novelId} />;
      case "codex": return <CodexView novelId={novelId} />;
      case "review": return <ReviewView novelId={novelId} />;
      default: return <PlanView onSwitchToWriteTab={handleSwitchToWriteTab} novelId={novelId} />;
    }
  };
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between p-3 border-b bg-background shadow-sm print:hidden">
        <div className="flex items-center min-w-0">
          <Link to="/" className="p-2 rounded-md hover:bg-muted mr-2 flex-shrink-0" title={t('back_to_novels')}>
            <Home className="h-5 w-5 text-foreground" />
          </Link>
          {isSidebarCollapsed && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex mr-2 flex-shrink-0">
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold truncate min-w-0 max-w-[300px] flex items-center">
            <span className="truncate">{"Manuscript Oracle"}</span>
            <Rabbit className="h-5 w-5 ml-2 flex-shrink-0" />
          </h1>
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-auto ml-4 flex-shrink-0">
            <TabsList>
              <TabsTrigger value="plan" className="px-4 py-2">
                <Clipboard className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('novel_editor_plan_tab')}</span>
              </TabsTrigger>
              <TabsTrigger value="write" className="px-4 py-2">
                <Edit className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('novel_editor_write_tab')}</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="px-4 py-2">
                <MessageCircle className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="codex" className="px-4 py-2">
                <BookMarked className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Codex</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="px-4 py-2">
                <CheckCircle className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Review</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-4 py-2">
                <Settings className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('novel_editor_settings_tab')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOracleOpen(true)} className="hidden md:flex gap-2">
            <Sparkles className="h-4 w-4" /> Oracle
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBetaReaderOpen(true)} className="hidden md:flex gap-2">
            <Users className="h-4 w-4" /> Beta Readers
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsDocumentModalOpen(true)} className="hidden md:flex gap-2" title="Import/Export manuscript as Word or PDF">
            <FileText className="h-4 w-4" /> Import/Export
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                <Text className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <FontSettingsControl />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={handleThemeToggle}>
            {effectiveTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      <div className="flex flex-grow border-t overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel 
            id="sidebar-panel" 
            ref={sidebarPanelRef} 
            defaultSize={25} 
            minSize={15} 
            maxSize={40} 
            collapsible 
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
          >
            {!isSidebarCollapsed && (
              <div className="flex flex-col h-full border-r">
                <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab} className="flex flex-col h-full">
                  <div className="flex items-center justify-between border-b px-2">
                    <TabsList className="bg-transparent">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-muted">{t('novel_editor_overview_tab')}</TabsTrigger>
                      <TabsTrigger value="concepts" className="data-[state=active]:bg-muted">{t('novel_editor_concept_cache_tab')}</TabsTrigger>
                    </TabsList>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 relative overflow-auto">
                    <TabsContent value="overview" className="absolute inset-0 m-0 p-0"><NovelOverviewTab /></TabsContent>
                    <TabsContent value="concepts" className="absolute inset-0 m-0 p-0"><ConceptCacheList /></TabsContent>
                  </div>
                </Tabs>
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            <ScrollArea className="h-full">
              {renderRightPaneContent()}
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <BetaReaderModal isOpen={isBetaReaderOpen} onOpenChange={setIsBetaReaderOpen} />
      <OracleAnalysisModal isOpen={isOracleOpen} onOpenChange={setIsOracleOpen} />
      <DocumentImportExportModal isOpen={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen} />
    </div>
  );
}
export default App;
