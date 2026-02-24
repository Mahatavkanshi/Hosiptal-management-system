import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  User,
  ClipboardList,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const NurseCarePlans: React.FC = () => {
  const [carePlan, setCarePlan] = useState({
    patient_name: '',
    patient_id: '',
    diagnosis: '',
    goals: [''],
    interventions: [''],
    evaluations: ['']
  });

  const addItem = (field: 'goals' | 'interventions' | 'evaluations') => {
    setCarePlan({
      ...carePlan,
      [field]: [...carePlan[field], '']
    });
  };

  const removeItem = (field: 'goals' | 'interventions' | 'evaluations', index: number) => {
    const newItems = carePlan[field].filter((_, i) => i !== index);
    setCarePlan({ ...carePlan, [field]: newItems });
  };

  const updateItem = (field: 'goals' | 'interventions' | 'evaluations', index: number, value: string) => {
    const newItems = [...carePlan[field]];
    newItems[index] = value;
    setCarePlan({ ...carePlan, [field]: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Care plan saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link to="/nurse-dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">New Care Plan</h1>
          <p className="text-gray-600 mt-1">Create a comprehensive nursing care plan</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 absolute ml-3" />
                <input
                  type="text"
                  value={carePlan.patient_name}
                  onChange={(e) => setCarePlan({ ...carePlan, patient_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter patient name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <input
                type="text"
                value={carePlan.patient_id}
                onChange={(e) => setCarePlan({ ...carePlan, patient_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., P-12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <textarea
              value={carePlan.diagnosis}
              onChange={(e) => setCarePlan({ ...carePlan, diagnosis: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter diagnosis..."
            />
          </div>

          {/* Nursing Goals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Nursing Goals</label>
              <button
                type="button"
                onClick={() => addItem('goals')}
                className="flex items-center text-sm text-pink-600 hover:text-pink-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Goal
              </button>
            </div>
            {carePlan.goals.map((goal, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateItem('goals', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder={`Goal ${index + 1}`}
                />
                {carePlan.goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('goals', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Nursing Interventions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Nursing Interventions</label>
              <button
                type="button"
                onClick={() => addItem('interventions')}
                className="flex items-center text-sm text-pink-600 hover:text-pink-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Intervention
              </button>
            </div>
            {carePlan.interventions.map((intervention, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={intervention}
                  onChange={(e) => updateItem('interventions', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder={`Intervention ${index + 1}`}
                />
                {carePlan.interventions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('interventions', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Evaluation Criteria */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Evaluation Criteria</label>
              <button
                type="button"
                onClick={() => addItem('evaluations')}
                className="flex items-center text-sm text-pink-600 hover:text-pink-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Criteria
              </button>
            </div>
            {carePlan.evaluations.map((evaluation, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={evaluation}
                  onChange={(e) => updateItem('evaluations', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder={`Evaluation criteria ${index + 1}`}
                />
                {carePlan.evaluations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('evaluations', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
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
              className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Care Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NurseCarePlans;
