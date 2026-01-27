import React, { useState } from 'react';
import { MOCK_SERVICES } from '../constants';
import { BranchName, ServiceItem } from '../types';
import { Search, Tag, FileText, Plus, Info, X } from 'lucide-react';

interface ServiceCatalogueProps {
    selectedBranch: BranchName;
}

const ServiceCatalogue: React.FC<ServiceCatalogueProps> = ({ selectedBranch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddService = (newService: ServiceItem) => {
        setServices([...services, newService]);
        setIsAddModalOpen(false);
    };

    return (
        <div className="p-6 h-full flex flex-col relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Service Catalogue</h2>
                    <p className="text-slate-500 text-sm">Standardized services, fees, and requirements.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 shadow-sm"
                >
                    <Plus size={18} />
                    Add New Service
                </button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search services..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                                selectedCategory === cat 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                    <div key={service.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold uppercase tracking-wider">
                                {service.category}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{service.name}</h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{service.description}</p>
                        
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Documents Required</p>
                            <div className="flex flex-wrap gap-2">
                                {service.documentsRequired.slice(0, 3).map(doc => (
                                    <span key={doc} className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {doc}
                                    </span>
                                ))}
                                {service.documentsRequired.length > 3 && (
                                    <span className="text-xs text-slate-400 px-1 py-1">+ {service.documentsRequired.length - 3} more</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Standard Fee</p>
                                <p className="text-lg font-bold text-slate-800">₹{service.standardFee.toLocaleString()}</p>
                            </div>
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                                Details <Info size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredServices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500">No services found matching your criteria.</p>
                </div>
            )}

             {isAddModalOpen && (
                <AddServiceModal onClose={() => setIsAddModalOpen(false)} onAdd={handleAddService} />
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// MODAL COMPONENT: ADD SERVICE
// ----------------------------------------------------------------------

const AddServiceModal: React.FC<{ onClose: () => void, onAdd: (s: ServiceItem) => void }> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '', category: 'GST', standardFee: 0, description: '', documentsRequired: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newService: ServiceItem = {
            id: `SRV-${Math.floor(Math.random() * 1000)}`,
            name: formData.name,
            category: formData.category,
            standardFee: Number(formData.standardFee),
            description: formData.description,
            documentsRequired: formData.documentsRequired.split(',').map(s => s.trim())
        };
        onAdd(newService);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Add Service to Catalogue</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Service Name</label>
                        <input required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                             <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option value="GST">GST</option>
                                <option value="Income Tax">Income Tax</option>
                                <option value="TDS">TDS</option>
                                <option value="ROC">ROC</option>
                                <option value="Tax Audit">Tax Audit</option>
                                <option value="Accounting">Accounting</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Standard Fee (₹)</label>
                            <input required type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                                value={formData.standardFee} onChange={e => setFormData({...formData, standardFee: Number(e.target.value)})} />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                        <textarea required rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Required Documents (Comma separated)</label>
                        <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                            placeholder="e.g. PAN Card, Bank Statement"
                            value={formData.documentsRequired} onChange={e => setFormData({...formData, documentsRequired: e.target.value})} />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Service</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceCatalogue;