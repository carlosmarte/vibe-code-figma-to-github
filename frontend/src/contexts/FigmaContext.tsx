import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FigmaComponent {
  id: string;
  name: string;
  type: string;
  path: string;
  data?: any;
}

interface FigmaFile {
  fileKey: string;
  name: string;
  lastModified?: string;
  version?: string;
  thumbnailUrl?: string;
  document?: any;
  components?: Record<string, any>;
  styles?: Record<string, any>;
}

interface FigmaContextType {
  // File data
  fileId: string | null;
  setFileId: (id: string) => void;
  fileData: FigmaFile | null;
  setFileData: (data: FigmaFile) => void;
  
  // Component selection
  selectedComponent: FigmaComponent | null;
  setSelectedComponent: (component: FigmaComponent | null) => void;
  
  // Preview
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  
  // Available components
  availableComponents: FigmaComponent[];
  setAvailableComponents: (components: FigmaComponent[]) => void;
  
  // Clear all state
  clearState: () => void;
}

const FigmaContext = createContext<FigmaContextType | undefined>(undefined);

export function FigmaProvider({ children }: { children: ReactNode }) {
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FigmaFile | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<FigmaComponent | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [availableComponents, setAvailableComponents] = useState<FigmaComponent[]>([]);

  const clearState = () => {
    setFileId(null);
    setFileData(null);
    setSelectedComponent(null);
    setPreviewUrl(null);
    setAvailableComponents([]);
  };

  return (
    <FigmaContext.Provider
      value={{
        fileId,
        setFileId,
        fileData,
        setFileData,
        selectedComponent,
        setSelectedComponent,
        previewUrl,
        setPreviewUrl,
        availableComponents,
        setAvailableComponents,
        clearState
      }}
    >
      {children}
    </FigmaContext.Provider>
  );
}

export function useFigmaContext() {
  const context = useContext(FigmaContext);
  if (context === undefined) {
    throw new Error('useFigmaContext must be used within a FigmaProvider');
  }
  return context;
}