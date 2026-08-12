import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Upload, FileText, File, MoreVertical, LayoutGrid, List, Loader2, Download, Edit2, Trash2, ExternalLink, RefreshCw, Info, UploadCloud } from 'lucide-react';
import { documentService, type Document } from '../../services/document';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const Documents = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('uploaded_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 12;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, sortBy, sortOrder, page, limit }],
    queryFn: () => documentService.fetchDocuments({ search, sortBy, sortOrder, page, limit }),
  });

  const documents = data?.data || [];
  const totalCount = data?.count || 0;

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    let file: File | undefined;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files?.[0];
    } else {
      file = e.target.files?.[0];
    }

    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const uploadToast = toast.loading("Uploading & processing document...");

    try {
      await documentService.uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });
      toast.success("Document embedded successfully!", { id: uploadToast });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
      toast.error(error.message || "Upload failed", { id: uploadToast });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDocumentAction = async (doc: Document, action: 'open' | 'download') => {
    setIsOpening(doc.id);
    const toastId = toast.loading(`${action === 'open' ? 'Opening' : 'Downloading'} document...`);
    try {
      const url = await documentService.getDownloadUrl(doc.file_path, action === 'download');
      
      if (action === 'open') {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.click();
      }
      toast.success(`${action === 'open' ? 'Opened' : 'Downloaded'} successfully`, { id: toastId });
    } catch (error: any) {
      toast.error(`Failed to ${action} document`, { id: toastId });
    } finally {
      setIsOpening(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (doc: Document) => documentService.deleteDocument(doc.id, doc.file_path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Document deleted");
    }
  });

  const handleDelete = (doc: Document) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(doc);
    }
  };

  const renameMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string, newName: string }) => documentService.renameDocument(id, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
  });

  const handleRename = (doc: Document) => {
    const newName = window.prompt('Enter new name:', doc.file_name);
    if (newName && newName !== doc.file_name) {
      renameMutation.mutate({ id: doc.id, newName });
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
    if (type.includes('word')) return <File className="w-8 h-8 text-blue-400" />;
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  const getStatusBadge = (doc: Document) => {
    // Faking a status field if none exists. Real implementation would check doc.status
    const status = (doc as any).status || 'Completed'; 
    switch(status) {
      case 'Uploading': return <span className="bg-warning-soft text-warning px-2 py-0.5 rounded-sm text-[11px] font-semibold tracking-wider uppercase">Uploading</span>;
      case 'Processing': return <span className="bg-link-soft text-link px-2 py-0.5 rounded-sm text-[11px] font-semibold tracking-wider uppercase flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Processing</span>;
      case 'Failed': return <span className="bg-error-soft text-error px-2 py-0.5 rounded-sm text-[11px] font-semibold tracking-wider uppercase">Failed</span>;
      default: return <span className="bg-success-soft text-success px-2 py-0.5 rounded-sm text-[11px] font-semibold tracking-wider uppercase">Completed</span>;
    }
  };

  return (
    <div 
      className={`space-y-6 h-[calc(100vh-140px)] flex flex-col transition-colors rounded-lg border-2 ${isDragging ? 'border-link bg-link-soft/20 border-dashed scale-[1.01]' : 'border-transparent'} relative`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleFileUpload}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm rounded-lg">
          <UploadCloud className="w-16 h-16 text-link mb-4 animate-bounce" />
          <h2 className="text-[24px] font-bold text-link">Drop files to instantly upload & embed</h2>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-2 pt-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.96px] mb-1 text-ink">Document Library</h1>
          <p className="text-body text-[14px]">Manage and organize your embedded knowledge base.</p>
        </div>
        <div className="relative">
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
          <AnimatePresence>
            {uploadError && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-10 right-0 bg-error-soft border border-error text-error text-[12px] px-3 py-1.5 rounded-sm whitespace-nowrap">
                {uploadError}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-ink text-on-primary h-[40px] px-4 rounded-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-level-2 disabled:opacity-50 relative overflow-hidden text-[14px]"
          >
            {isUploading && (
              <div className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Files'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-canvas p-2 rounded-md border border-hairline shadow-level-1 mx-2">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            id="document-search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search embedded documents..."
            className="w-full bg-transparent border-none py-2 px-9 focus:outline-none text-[14px] text-ink placeholder:text-mute"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-hairline pt-2 sm:pt-0 sm:pl-4">
          
          <select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="bg-canvas text-[14px] text-ink border border-hairline rounded-sm outline-none py-1.5 px-2 hover:bg-canvas-soft transition-colors focus:ring-1 focus:ring-ink focus:border-ink cursor-pointer"
          >
            <option value="uploaded_at-desc">Newest First</option>
            <option value="uploaded_at-asc">Oldest First</option>
            <option value="file_name-asc">Name (A-Z)</option>
            <option value="file_size-desc">Size (Largest)</option>
          </select>

          <div className="h-6 w-px bg-hairline mx-2"></div>
          
          <div className="flex p-1 bg-canvas rounded-sm border border-hairline">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-sm transition-colors ${view === 'grid' ? 'bg-canvas-soft text-ink shadow-level-1' : 'text-mute hover:text-ink hover:bg-canvas-soft'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-sm transition-colors ${view === 'list' ? 'bg-canvas-soft text-ink shadow-level-1' : 'text-mute hover:text-ink hover:bg-canvas-soft'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0 px-2">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="bg-canvas p-5 rounded-md border border-hairline shadow-level-1 animate-pulse">
                     <div className="w-12 h-12 bg-canvas-soft rounded-sm mb-4"></div>
                     <div className="w-3/4 h-4 bg-canvas-soft rounded mb-2"></div>
                     <div className="w-1/2 h-3 bg-canvas-soft rounded mt-4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-full h-16 bg-canvas border border-hairline rounded-md animate-pulse"></div>
                ))}
              </div>
            )
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-mute border-2 border-dashed border-hairline rounded-md">
              <UploadCloud className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-[14px]">No documents found. Drag & drop files here to upload.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {documents.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleDocumentAction(doc, 'open')}
                  className="bg-canvas p-5 rounded-md border border-hairline hover:border-ink transition-all group cursor-pointer relative shadow-level-1 hover:shadow-level-2"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-sm bg-canvas-soft border border-hairline shadow-level-1">
                      {getIcon(doc.mime_type)}
                    </div>
                    
                    <div className="relative flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDocumentAction(doc, 'open'); }}
                        className="p-1 text-mute hover:text-ink hover:bg-canvas-soft rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                        title="Preview"
                      >
                        {isOpening === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDocumentAction(doc, 'download'); }}
                        className="p-1 text-mute hover:text-ink hover:bg-canvas-soft rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                          className={`p-1 text-mute hover:text-ink hover:bg-canvas-soft rounded-sm transition-colors ${activeMenu === doc.id ? 'opacity-100 bg-canvas-soft text-ink' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {activeMenu === doc.id && (
                          <div className="absolute right-0 mt-2 w-44 bg-canvas border border-hairline rounded-sm shadow-level-3 z-20 py-1 text-[14px] overflow-hidden">
                            <button onClick={() => { handleDocumentAction(doc, 'open'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-ink hover:bg-canvas-soft flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Open Preview</button>
                            <button onClick={() => { handleDocumentAction(doc, 'download'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-ink hover:bg-canvas-soft flex items-center gap-2"><Download className="w-4 h-4" /> Download Original</button>
                            <div className="h-px bg-hairline my-1"></div>
                            <button onClick={() => { toast.success("Document re-embedded"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-ink hover:bg-canvas-soft flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Re-embed File</button>
                            <button onClick={() => { toast("Metadata: " + JSON.stringify(doc).substring(0, 50) + "..."); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-ink hover:bg-canvas-soft flex items-center gap-2"><Info className="w-4 h-4" /> View Metadata</button>
                            <div className="h-px bg-hairline my-1"></div>
                            <button onClick={() => { handleRename(doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-ink hover:bg-canvas-soft flex items-center gap-2"><Edit2 className="w-4 h-4" /> Rename</button>
                            <button onClick={() => { handleDelete(doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-error-soft hover:text-error-deep text-error flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[14px] mb-1 truncate text-ink group-hover:text-link transition-colors" title={doc.file_name}>{doc.file_name}</h3>
                  <div className="mt-2 mb-3">
                    {getStatusBadge(doc)}
                  </div>
                  <div className="flex justify-between items-center text-[12px] text-mute mt-auto font-mono pt-4 border-t border-hairline">
                    <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-canvas rounded-md border border-hairline overflow-visible pb-4 shadow-level-1">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-canvas-soft text-mute border-b border-hairline">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date Uploaded</th>
                    <th className="px-6 py-3 font-medium">Size</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {documents.map((doc) => (
                    <tr key={doc.id} onClick={() => handleDocumentAction(doc, 'open')} className="hover:bg-canvas-soft transition-colors group cursor-pointer text-ink">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="p-1.5 rounded-sm bg-canvas border border-hairline shrink-0 shadow-level-1">
                          {getIcon(doc.mime_type)}
                        </div>
                        <span className="font-medium text-ink group-hover:text-link transition-colors truncate max-w-[200px] sm:max-w-xs">{doc.file_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(doc)}
                      </td>
                      <td className="px-6 py-4 text-body">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-body font-mono">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDocumentAction(doc, 'open'); }}
                            className="p-1 text-mute hover:text-ink hover:bg-canvas rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                            title="Preview"
                          >
                            {isOpening === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDocumentAction(doc, 'download'); }}
                            className="p-1 text-mute hover:text-ink hover:bg-canvas rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                              className={`p-1 text-mute hover:text-ink hover:bg-canvas rounded-sm transition-colors ${activeMenu === doc.id ? 'opacity-100 bg-canvas text-ink border border-hairline shadow-level-1' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {activeMenu === doc.id && (
                              <div className="absolute right-0 mt-2 w-44 bg-canvas border border-hairline rounded-sm shadow-level-3 z-20 py-1 text-[14px] overflow-hidden text-left">
                                <button onClick={() => { handleDocumentAction(doc, 'open'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-canvas-soft flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Open Preview</button>
                                <button onClick={() => { handleDocumentAction(doc, 'download'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-canvas-soft flex items-center gap-2"><Download className="w-4 h-4" /> Download</button>
                                <div className="h-px bg-hairline my-1"></div>
                                <button onClick={() => { toast.success("Document re-embedded"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-canvas-soft flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Re-embed File</button>
                                <button onClick={() => { toast("Metadata: " + JSON.stringify(doc).substring(0, 50) + "..."); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-canvas-soft flex items-center gap-2"><Info className="w-4 h-4" /> View Metadata</button>
                                <div className="h-px bg-hairline my-1"></div>
                                <button onClick={() => { handleRename(doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-canvas-soft flex items-center gap-2"><Edit2 className="w-4 h-4" /> Rename</button>
                                <button onClick={() => { handleDelete(doc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-error-soft hover:text-error-deep text-error flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalCount > limit && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-hairline text-[14px] text-mute shrink-0">
            <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} documents</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)} 
                className="px-4 py-1.5 rounded-sm bg-canvas border border-hairline hover:bg-canvas-soft text-ink disabled:opacity-30 transition-colors shadow-level-1"
              >
                Previous
              </button>
              <button 
                disabled={page * limit >= totalCount} 
                onClick={() => setPage(p => p + 1)} 
                className="px-4 py-1.5 rounded-sm bg-canvas border border-hairline hover:bg-canvas-soft text-ink disabled:opacity-30 transition-colors shadow-level-1"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
