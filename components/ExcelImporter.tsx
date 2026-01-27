import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ExcelImporterProps {
    onImport: (data: any[]) => Promise<void>;
    templateName: string;
    requiredColumns: string[];
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImport, templateName, requiredColumns }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [stats, setStats] = useState<{ total: number; success: number; failed: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);
        setStats(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setError('The file appears to be empty.');
                    return;
                }

                // Basic validation of columns (check first row)
                const firstRow = data[0] as object;
                const missingCols = requiredColumns.filter(col => !Object.keys(firstRow).some(k => k.toLowerCase().trim() === col.toLowerCase().trim()));

                if (missingCols.length > 0) {
                    setError(`Missing required columns: ${missingCols.join(', ')}. Please check your file headers.`);
                    return;
                }

                setImporting(true);
                await onImport(data);
                setStats({ total: data.length, success: data.length, failed: 0 }); // Simplified stats for now
                setImporting(false);
                setTimeout(() => {
                    setIsOpen(false);
                    setFileName(null);
                    setStats(null);
                }, 3000);

            } catch (err) {
                console.error("Import Error:", err);
                setError('Failed to parse excel file. Please ensure it is a valid .xlsx or .csv file.');
                setImporting(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all active:scale-95"
            >
                <FileSpreadsheet size={16} /> Import {templateName}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-600" />
                        Import {templateName}
                    </h3>
                    {!importing && (
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {!importing && !stats ? (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-3 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
                            >
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <p className="text-sm font-bold text-slate-600 mb-2">Click to upload Excel/CSV</p>
                                <p className="text-xs text-slate-400">Supported formats: .xlsx, .xls, .csv</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-start gap-3 border border-red-100">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <div className="text-[10px] text-slate-400 font-medium">
                                <p className="uppercase tracking-widest font-black mb-2">Required Columns:</p>
                                <div className="flex flex-wrap gap-2">
                                    {requiredColumns.map(c => (
                                        <span key={c} className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">{c}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            {importing ? (
                                <div className="space-y-4">
                                    <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto" />
                                    <p className="text-sm font-bold text-slate-600">Processing records...</p>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800">Import Successful!</h4>
                                    <p className="text-sm text-slate-500 font-medium">Synced {stats?.total} records to database.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                />
            </div>
        </div>
    );
};
