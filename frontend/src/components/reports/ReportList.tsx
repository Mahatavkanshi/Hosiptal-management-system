import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Calendar, User, Stethoscope, Pill, Activity, Clipboard, Search, Filter, X } from 'lucide-react';
import reportService, { Report } from '../../services/reportService';
import toast from 'react-hot-toast';

interface ReportListProps {
  patientId: string;
  patientName?: string;
  onGenerateNew?: () => void;
}

const ReportList = ({ patientId, patientName, onGenerateNew }: ReportListProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'prescription' | 'medical' | 'discharge' | 'lab'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, [patientId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getPatientReports(patientId);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const success = await reportService.downloadAndSavePDF(
        report.id,
        `${report.type}-report-${patientName || 'patient'}.pdf`
      );
      if (success) {
        toast.success('Report downloaded!');
      } else {
        toast.error('Download failed');
      }
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await reportService.deleteReport(reportId);
      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'prescription': return Pill;
      case 'medical': return Clipboard;
      case 'discharge': return FileText;
      case 'lab': return Activity;
      default: return FileText;
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'prescription': 'Prescription',
      'medical': 'Medical Report',
      'discharge': 'Discharge Summary',
      'lab': 'Lab Report'
    };
    return labels[type] || type;
  };

  const getReportTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'prescription': 'bg-green-100 text-green-800',
      'medical': 'bg-blue-100 text-blue-800',
      'discharge': 'bg-purple-100 text-purple-800',
      'lab': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.diagnosis && report.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Total Reports</p>
          <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600">Prescriptions</p>
          <p className="text-2xl font-bold text-green-900">
            {reports.filter(r => r.type === 'prescription').length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600">Medical Reports</p>
          <p className="text-2xl font-bold text-purple-900">
            {reports.filter(r => r.type === 'medical').length}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-orange-600">This Month</p>
          <p className="text-2xl font-bold text-orange-900">
            {reports.filter(r => {
              const reportDate = new Date(r.created_at);
              const now = new Date();
              return reportDate.getMonth() === now.getMonth() && 
                     reportDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="prescription">Prescriptions</option>
            <option value="medical">Medical Reports</option>
            <option value="discharge">Discharge</option>
            <option value="lab">Lab Reports</option>
          </select>
          
          <button
            onClick={onGenerateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No reports found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Generate your first report by clicking "New Report"'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const Icon = getReportIcon(report.type);
            return (
              <div 
                key={report.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-4 ${getReportTypeColor(report.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getReportTypeColor(report.type)}`}>
                          {getReportTypeLabel(report.type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(report.created_at).toLocaleDateString('en-IN')}
                        </span>
                        
                        {report.doctor_first_name && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Dr. {report.doctor_first_name} {report.doctor_last_name}
                          </span>
                        )}
                      </div>
                      
                      {report.diagnosis && (
                        <div className="mt-2 flex items-center text-sm">
                          <Stethoscope className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-gray-700">{report.diagnosis}</span>
                        </div>
                      )}
                      
                      {report.prescriptions && report.prescriptions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Medicines:</p>
                          <div className="flex flex-wrap gap-2">
                            {report.prescriptions.slice(0, 3).map((med, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {med.name} ({med.dosage})
                              </span>
                            ))}
                            {report.prescriptions.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{report.prescriptions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Download PDF"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    
                    {!report.id.startsWith('demo-') && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedReport.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded ${getReportTypeColor(selectedReport.type)}`}>
                    {getReportTypeLabel(selectedReport.type)}
                  </span>
                  <span>{new Date(selectedReport.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                
                {selectedReport.diagnosis && (
                  <div>
                    <label className="font-medium text-gray-700">Diagnosis:</label>
                    <p className="text-gray-900">{selectedReport.diagnosis}</p>
                  </div>
                )}
                
                {selectedReport.chief_complaint && (
                  <div>
                    <label className="font-medium text-gray-700">Chief Complaint:</label>
                    <p className="text-gray-900">{selectedReport.chief_complaint}</p>
                  </div>
                )}
                
                {selectedReport.examination_notes && (
                  <div>
                    <label className="font-medium text-gray-700">Examination Notes:</label>
                    <p className="text-gray-900">{selectedReport.examination_notes}</p>
                  </div>
                )}
                
                {selectedReport.prescriptions && selectedReport.prescriptions.length > 0 && (
                  <div>
                    <label className="font-medium text-gray-700">Prescribed Medicines:</label>
                    <div className="mt-2 space-y-2">
                      {selectedReport.prescriptions.map((med, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">{med.name} - {med.dosage}</p>
                          <p className="text-sm text-gray-600">
                            {med.frequency} for {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-sm text-gray-500">Note: {med.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    handleDownload(selectedReport);
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;
