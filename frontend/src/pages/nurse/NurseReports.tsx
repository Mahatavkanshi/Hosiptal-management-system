import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Save,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const NurseReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'performance' | 'incident'>('daily');
  const [dailyReport, setDailyReport] = useState({
    shift_type: 'day',
    patients_cared: 0,
    tasks_completed: 0,
    incidents: '',
    notes: ''
  });

  const [incidentReport, setIncidentReport] = useState({
    incident_type: '',
    patient_name: '',
    description: '',
    severity: 'low',
    actions_taken: ''
  });

  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Daily report submitted successfully!');
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Incident report submitted successfully!');
  };

  const performanceStats = {
    patients_cared: 45,
    tasks_completed: 128,
    quality_score: 94,
    attendance: 98,
    shift_coverage: 100
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link to="/nurse-dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View performance metrics and submit reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'daily', label: 'Daily Report', icon: Calendar },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'incident', label: 'Incident Report', icon: AlertTriangle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Report Tab */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Daily Shift Report</h2>
                <p className="text-gray-600">Submit your end-of-shift report</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleDailySubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                <select
                  value={dailyReport.shift_type}
                  onChange={(e) => setDailyReport({ ...dailyReport, shift_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="rotating">Rotating</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patients Cared</label>
                <input
                  type="number"
                  value={dailyReport.patients_cared}
                  onChange={(e) => setDailyReport({ ...dailyReport, patients_cared: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Completed</label>
                <input
                  type="number"
                  value={dailyReport.tasks_completed}
                  onChange={(e) => setDailyReport({ ...dailyReport, tasks_completed: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incidents (if any)</label>
              <textarea
                value={dailyReport.incidents}
                onChange={(e) => setDailyReport({ ...dailyReport, incidents: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Describe any incidents that occurred during the shift..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
              <textarea
                value={dailyReport.notes}
                onChange={(e) => setDailyReport({ ...dailyReport, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Add any additional notes or observations..."
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="flex items-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Draft
              </button>
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Send className="h-5 w-5 mr-2" />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients Cared (This Month)</p>
                <p className="text-3xl font-bold text-gray-900">{performanceStats.patients_cared}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks Completed</p>
                <p className="text-3xl font-bold text-gray-900">{performanceStats.tasks_completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-3xl font-bold text-green-600">{performanceStats.quality_score}%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{performanceStats.attendance}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shift Coverage</p>
                <p className="text-3xl font-bold text-gray-900">{performanceStats.shift_coverage}%</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <Calendar className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div>
              <p className="text-pink-100 text-sm">Overall Performance</p>
              <p className="text-4xl font-bold mt-2">Excellent</p>
              <p className="text-pink-100 mt-2">Top 10% of nursing staff</p>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report Tab */}
      {activeTab === 'incident' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Incident Report</h2>
                <p className="text-gray-600">Report any incidents or safety concerns</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleIncidentSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
                <select
                  value={incidentReport.incident_type}
                  onChange={(e) => setIncidentReport({ ...incidentReport, incident_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select type...</option>
                  <option value="patient_fall">Patient Fall</option>
                  <option value="medication_error">Medication Error</option>
                  <option value="equipment_failure">Equipment Failure</option>
                  <option value="safety_hazard">Safety Hazard</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity Level</label>
                <select
                  value={incidentReport.severity}
                  onChange={(e) => setIncidentReport({ ...incidentReport, severity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name (if applicable)</label>
              <input
                type="text"
                value={incidentReport.patient_name}
                onChange={(e) => setIncidentReport({ ...incidentReport, patient_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter patient name or leave blank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Description</label>
              <textarea
                value={incidentReport.description}
                onChange={(e) => setIncidentReport({ ...incidentReport, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe the incident in detail..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
              <textarea
                value={incidentReport.actions_taken}
                onChange={(e) => setIncidentReport({ ...incidentReport, actions_taken: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe actions taken in response..."
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Important</p>
                  <p className="text-sm text-red-700 mt-1">
                    Incident reports are confidential and will be reviewed by the nursing supervisor. 
                    Please ensure all details are accurate.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
              <Link
                to="/nurse-dashboard"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Send className="h-5 w-5 mr-2" />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NurseReports;
