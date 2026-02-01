
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
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
        } else {
          toast.error("导入失败");
        }
      }
    };
    reader.readAsText(importFile);
  };

  const handleResetClick = () => {
      setShowResetConfirm(true);
  };

  const executeReset = () => {
      const empty = backupService.getFactoryResetData(data);
      onUpdate(empty);
      toast.warning("已重置系统");
      setShowResetConfirm(false);
  };

  return (
    <div className="th-manager__main-content">
          
          {/* Export Card */}
          <section className="th-card">
            <div className="th-card-header">
                <div className="th-card-header__icon"><Upload size={20} /></div>
                <div className="th-card-header__content">
                    <h3>数据导出</h3>
                    <p>创建当前配置的备份文件 (.json)</p>
                </div>
            </div>
            
            <div className="backup-options">
                <label className="th-grid-checkbox">
                    <input type="checkbox" checked={exportOpts.includeDefinitions} onChange={e => setExportOpts({...exportOpts, includeDefinitions: e.target.checked})} />
                    <span>定义与分类</span>
                </label>
                <label className="th-grid-checkbox">
                    <input type="checkbox" checked={exportOpts.includeStyles} onChange={e => setExportOpts({...exportOpts, includeStyles: e.target.checked})} />
                    <span>样式库</span>
                </label>
                <label className="th-grid-checkbox">
                    <input type="checkbox" checked={exportOpts.includePresets} onChange={e => setExportOpts({...exportOpts, includePresets: e.target.checked})} />
                    <span>配置预设</span>
                </label>
                <label className="th-grid-checkbox">
                    <input type="checkbox" checked={exportOpts.includeLayouts} onChange={e => setExportOpts({...exportOpts, includeLayouts: e.target.checked})} />
                    <span>布局快照</span>
                </label>
                <label className={`th-grid-checkbox ${exportOpts.includeGlobalState ? 'warning' : ''}`}>
                    <input type="checkbox" checked={exportOpts.includeGlobalState} onChange={e => setExportOpts({...exportOpts, includeGlobalState: e.target.checked})} />
                    <span>全量存档 (含角色状态)</span>
                </label>
            </div>
            
            <button className="btn btn--primary full-width" onClick={handleExport}>
                <Archive size={16} /> 生成备份文件
            </button>
          </section>

          {/* Import Card */}
          <section className="th-card">
            <div className="th-card-header">
                <div className="th-card-header__icon"><Download size={20} /></div>
                <div className="th-card-header__content">
                    <h3>数据导入</h3>
                    <p>从备份文件中恢复配置</p>
                </div>
            </div>

            <div className={`import-zone ${importFile ? 'active' : ''}`} onClick={() => fileInputRef.current?.click()}>
                <FileJson size={32} className="import-zone__icon" />
                <div className="import-zone__text">
                    {importFile ? importFile.name : "点击选择或拖拽 .json 备份文件"}
                </div>
                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".json" onChange={handleFileSelect} />
            </div>

            {importFile && (
                <div className="import-controls animate-slide-up">
                    <div className="import-strategies">
                        <label className={`radio-card ${importStrategy === 'merge' ? 'selected' : ''}`}>
                            <input type="radio" checked={importStrategy === 'merge'} onChange={() => setImportStrategy('merge')} />
                            <div>
                                <span className="title">智能合并</span>
                                <span className="desc">更新现有项，保留其他</span>
                            </div>
                        </label>
                        <label className={`radio-card ${importStrategy === 'overwrite' ? 'selected' : ''}`}>
                            <input type="radio" checked={importStrategy === 'overwrite'} onChange={() => setImportStrategy('overwrite')} />
                            <div>
                                <span className="title">完全覆盖</span>
                                <span className="desc">清空并替换对应模块</span>
                            </div>
                        </label>
                    </div>
                    <button className="btn btn--primary full-width" onClick={handleImport}>
                        <CheckCircle size={16} /> 执行导入
                    </button>
                </div>
            )}

            {importLogs.length > 0 && (
                <div className="import-logs animate-fade-in">
                    {importLogs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            )}
          </section>

          {/* Reset Card */}
          <section className="th-card danger-zone">
             <div className="th-card-header">
                <div className="th-card-header__icon"><AlertTriangle size={20} /></div>
                <div className="th-card-header__content">
                    <h3>恢复出厂设置</h3>
                    <p>重置所有数据到初始状态</p>
                </div>
                <button className="btn btn--danger" onClick={handleResetClick} style={{marginLeft: 'auto'}}>
                    <RefreshCw size={16} /> 重置
                </button>
            </div>
          </section>

      {showResetConfirm && (
          <div className="backup-reset-overlay animate-fade-in">
              <div className="backup-reset-modal glass-panel">
                  <h3><AlertTriangle size={24} style={{color: 'var(--color-danger)'}}/> 确认重置?</h3>
                  <p>您确定要将所有数据恢复到出厂状态吗？<br/>此操作不可撤销，建议先导出备份。</p>
                  <div className="backup-reset-actions">
                      <button className="btn btn--ghost" onClick={() => setShowResetConfirm(false)}>取消</button>
                      <button className="btn btn--danger" onClick={executeReset}>确认重置</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BackupManager;
