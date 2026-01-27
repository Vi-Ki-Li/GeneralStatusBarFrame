
import React, { useState, useRef } from 'react';
import { StatusBarData } from '../../../types';
import { backupService, ExportOptions } from '../../../services/backupService';
import { useToast } from '../../Toast/ToastContext';
import { Download, Upload, Archive, RefreshCw, AlertTriangle, FileJson, CheckCircle } from 'lucide-react';
import './BackupManager.css';

interface BackupManagerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ data, onUpdate }) => {
  const [exportOpts, setExportOpts] = useState<ExportOptions>({
    includeDefinitions: true,
    includeStyles: true,
    includePresets: true,
    includeLayouts: true,
    includeGlobalState: false
  });

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [importLogs, setImportLogs] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleExport = () => {
    try {
      const json = backupService.createBackup(data, exportOpts);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `tavern_backup_${dateStr}${exportOpts.includeGlobalState ? '_FULL' : ''}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("导出成功");
    } catch (e) {
      toast.error("导出失败");
      console.error(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImportFile(e.target.files[0]);
      setImportLogs([]);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = backupService.importBackup(content, data, importStrategy);
        setImportLogs(result.logs);
        if (result.success) {
          if (result.newData) {
            onUpdate(result.newData);
            toast.success("数据已更新");
          } else {
            toast.info("导入完成，但当前视图无变化");
          }
          // Force reload to ensure localStorage changes are picked up by services if necessary
          // Ideally services update internal state, but for safety:
          setTimeout(() => {
             // Optional: window.location.reload(); 
          }, 1000);
        } else {
          toast.error("导入失败");
        }
      }
    };
    reader.readAsText(importFile);
  };

  const handleReset = () => {
      if (confirm("确定要恢复出厂设置吗？所有数据将丢失！")) {
          const empty = backupService.getFactoryResetData(data);
          onUpdate(empty);
          toast.warning("已重置系统");
      }
  };

  return (
    <div className="backup-manager">
      
      {/* EXPORT SECTION */}
      <section className="backup-section">
        <h4 className="backup-section__title">
          <Download size={20} /> 数据导出
        </h4>
        <div className="backup-card">
          <div className="backup-options-grid">
            <label className="backup-checkbox">
              <input type="checkbox" checked={exportOpts.includeDefinitions} onChange={e => setExportOpts({...exportOpts, includeDefinitions: e.target.checked})} />
              <span>定义与分类</span>
            </label>
            <label className="backup-checkbox">
              <input type="checkbox" checked={exportOpts.includeStyles} onChange={e => setExportOpts({...exportOpts, includeStyles: e.target.checked})} />
              <span>样式库</span>
            </label>
            <label className="backup-checkbox">
              <input type="checkbox" checked={exportOpts.includePresets} onChange={e => setExportOpts({...exportOpts, includePresets: e.target.checked})} />
              <span>配置预设</span>
            </label>
            <label className="backup-checkbox">
              <input type="checkbox" checked={exportOpts.includeLayouts} onChange={e => setExportOpts({...exportOpts, includeLayouts: e.target.checked})} />
              <span>布局快照</span>
            </label>
            <label className="backup-checkbox" style={{border: exportOpts.includeGlobalState ? '1px solid var(--color-warning)' : ''}}>
              <input type="checkbox" checked={exportOpts.includeGlobalState} onChange={e => setExportOpts({...exportOpts, includeGlobalState: e.target.checked})} />
              <span>全量存档 (含角色状态)</span>
            </label>
          </div>
          
          <div className="backup-actions">
            <button className="btn btn--primary" onClick={handleExport}>
              <Archive size={16} /> 生成备份文件
            </button>
          </div>
        </div>
      </section>

      {/* IMPORT SECTION */}
      <section className="backup-section">
        <h4 className="backup-section__title">
          <Upload size={20} /> 数据恢复 / 导入
        </h4>
        <div className="backup-card">
          <div className="import-zone" onClick={() => fileInputRef.current?.click()}>
            <FileJson size={48} className="import-zone__icon" />
            <div className="import-zone__text">
              {importFile ? `已选择: ${importFile.name}` : "点击选择或拖拽 .json 备份文件"}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display: 'none'}} 
              accept=".json" 
              onChange={handleFileSelect} 
            />
          </div>

          {importFile && (
            <div className="import-preview animate-fade-in">
              <div className="import-strategy">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="strategy" 
                    checked={importStrategy === 'merge'} 
                    onChange={() => setImportStrategy('merge')} 
                  />
                  <span>智能合并 (推荐: 仅更新同ID项，保留其他)</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="strategy" 
                    checked={importStrategy === 'overwrite'} 
                    onChange={() => setImportStrategy('overwrite')} 
                  />
                  <span>完全覆盖 (危险: 清空当前对应模块)</span>
                </label>
              </div>
              
              <button className="btn btn--primary" onClick={handleImport}>
                <CheckCircle size={16} /> 开始导入
              </button>
            </div>
          )}

          {importLogs.length > 0 && (
            <div className="import-logs animate-slide-up">
              {importLogs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          )}
        </div>
      </section>

      {/* DANGER ZONE */}
      <section className="backup-section">
        <h4 className="backup-section__title" style={{color: 'var(--color-danger)'}}>
          <AlertTriangle size={20} /> 危险区域
        </h4>
        <div className="backup-card backup-danger-zone">
          <p className="danger-text">此操作将清空所有数据，恢复到应用初始状态。</p>
          <button className="btn btn--danger" onClick={handleReset}>
            <RefreshCw size={16} /> 恢复出厂设置
          </button>
        </div>
      </section>

    </div>
  );
};

export default BackupManager;
