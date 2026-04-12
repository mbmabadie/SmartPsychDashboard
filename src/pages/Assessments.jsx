import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import Modal from '../components/Modal';

const displayTypes = [
  { value: 'radio_list', label: 'قائمة عمودية' },
  { value: 'card_select', label: 'بطاقات' },
  { value: 'emoji_scale', label: 'إيموجي' },
  { value: 'slider_select', label: 'شريط تمرير' },
  { value: 'image_cards', label: 'بطاقات مع أيقونات' },
];

const defaultOptions = [
  { option_text_ar: 'أبداً', option_value: 0, emoji: '😊' },
  { option_text_ar: 'أحياناً', option_value: 1, emoji: '😐' },
  { option_text_ar: 'كثيراً', option_value: 2, emoji: '😔' },
  { option_text_ar: 'دائماً', option_value: 3, emoji: '😢' },
];

export default function Assessments() {
  const { api } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showRotation, setShowRotation] = useState(false);
  const [creating, setCreating] = useState(false);

  // New assessment form
  const [form, setForm] = useState({ title_ar: '', title: '', description_ar: '', category: 'mental_health', questions: [] });

  // Rotation form
  const [rotAssessment, setRotAssessment] = useState(null);
  const [rotQuestions, setRotQuestions] = useState([]);
  const [rotDisplayTypes, setRotDisplayTypes] = useState({});
  const [rotForm, setRotForm] = useState({ title: '', start_date: '', end_date: '' });
  const [creatingRot, setCreatingRot] = useState(false);

  useEffect(() => { loadAssessments(); }, []);

  const loadAssessments = async () => {
    try {
      const res = await api('/assessments/all');
      if (res.success) setAssessments(res.data);
    } catch (e) { console.error(e); }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [...form.questions, {
        question_text_ar: '',
        options: defaultOptions.map((o) => ({ ...o })),
      }],
    });
  };

  const updateQuestion = (qi, key, value) => {
    const qs = [...form.questions];
    qs[qi] = { ...qs[qi], [key]: value };
    setForm({ ...form, questions: qs });
  };

  const removeQuestion = (qi) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== qi) });
  };

  const updateOption = (qi, oi, key, value) => {
    const qs = [...form.questions];
    qs[qi].options[oi] = { ...qs[qi].options[oi], [key]: value };
    setForm({ ...form, questions: qs });
  };

  const addOption = (qi) => {
    const qs = [...form.questions];
    qs[qi].options.push({ option_text_ar: '', option_value: qs[qi].options.length, emoji: '' });
    setForm({ ...form, questions: qs });
  };

  const removeOption = (qi, oi) => {
    const qs = [...form.questions];
    qs[qi].options = qs[qi].options.filter((_, i) => i !== oi);
    setForm({ ...form, questions: qs });
  };

  const createAssessment = async () => {
    setCreating(true);
    try {
      const res = await api('/assessments/create', { method: 'POST', body: JSON.stringify(form) });
      if (res.success) {
        setShowCreate(false);
        setForm({ title_ar: '', title: '', description_ar: '', category: 'mental_health', questions: [] });
        loadAssessments();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const openRotation = async (assessment) => {
    setRotAssessment(assessment);
    try {
      const res = await api(`/assessments/${assessment.id}`);
      if (res.success) {
        const qs = res.data.questions || [];
        setRotQuestions(qs);
        const dt = {};
        qs.forEach((q) => { dt[q.id] = 'radio_list'; });
        setRotDisplayTypes(dt);
        setShowRotation(true);
      }
    } catch (e) { console.error(e); }
  };

  const createRotation = async () => {
    setCreatingRot(true);
    try {
      const questions = rotQuestions.map((q) => ({ question_id: q.id, display_type: rotDisplayTypes[q.id] || 'radio_list' }));
      const res = await api('/assessments/rotations/create', {
        method: 'POST',
        body: JSON.stringify({ assessment_id: rotAssessment.id, ...rotForm, questions }),
      });
      if (res.success) {
        setShowRotation(false);
        setRotForm({ title: '', start_date: '', end_date: '' });
        loadAssessments();
      }
    } catch (e) { console.error(e); }
    setCreatingRot(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">الاختبارات</h1>
          <p className="text-gray-500">إدارة الاختبارات النفسية والدورات</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium">
          + اختبار جديد
        </button>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((a) => (
          <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{a.title_ar || a.title}</h3>
                <p className="text-xs text-gray-500">{a.category}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${a.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {a.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>
            {a.description_ar && <div className="text-sm text-gray-600 mb-3">{a.description_ar}</div>}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
              <span>{a.questions_count} سؤال · {a.rotations_count} دورة</span>
              <button onClick={() => openRotation(a)} className="text-primary-500 hover:underline">إدارة الدورات</button>
            </div>
          </div>
        ))}
      </div>
      {assessments.length === 0 && (
        <div className="text-center text-gray-400 py-12">لا يوجد اختبارات. اضغط "اختبار جديد" لإنشاء واحد.</div>
      )}

      {/* Create Assessment Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="إنشاء اختبار جديد">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
              placeholder="العنوان بالعربية" className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title in English" className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
            placeholder="الوصف" rows={2} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg outline-none">
            <option value="mental_health">صحة نفسية</option>
            <option value="anxiety">قلق</option>
            <option value="depression">اكتئاب</option>
            <option value="stress">ضغط نفسي</option>
            <option value="general">عام</option>
          </select>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">الأسئلة</label>
              <button onClick={addQuestion} className="text-primary-500 text-sm hover:underline">+ سؤال</button>
            </div>
            <div className="space-y-3">
              {form.questions.map((q, qi) => (
                <div key={qi} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={q.question_text_ar} onChange={(e) => updateQuestion(qi, 'question_text_ar', e.target.value)}
                      placeholder={`السؤال ${qi + 1}`} className="flex-1 px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-primary-500" />
                    <button onClick={() => removeQuestion(qi)} className="text-red-500 px-2 hover:bg-red-50 rounded">✕</button>
                  </div>
                  <div className="space-y-2 mr-4">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="text" value={o.option_text_ar} onChange={(e) => updateOption(qi, oi, 'option_text_ar', e.target.value)}
                          placeholder="نص الخيار" className="flex-1 px-2 py-1 border rounded text-sm outline-none" />
                        <input type="number" value={o.option_value} onChange={(e) => updateOption(qi, oi, 'option_value', parseInt(e.target.value) || 0)}
                          placeholder="القيمة" className="w-20 px-2 py-1 border rounded text-sm outline-none" />
                        <input type="text" value={o.emoji} onChange={(e) => updateOption(qi, oi, 'emoji', e.target.value)}
                          placeholder="😊" className="w-16 px-2 py-1 border rounded text-sm text-center outline-none" />
                        <button onClick={() => removeOption(qi, oi)} className="text-red-500 hover:bg-red-50 rounded px-1">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addOption(qi)} className="text-primary-500 text-xs hover:underline">+ خيار</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={createAssessment} disabled={creating || !form.title_ar || form.questions.length === 0}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
              {creating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* Create Rotation Modal */}
      <Modal open={showRotation} onClose={() => setShowRotation(false)} title="إنشاء دورة جديدة" maxWidth="max-w-xl">
        <div className="space-y-4">
          <input type="text" value={rotForm.title} onChange={(e) => setRotForm({ ...rotForm, title: e.target.value })}
            placeholder="عنوان الدورة (مثل: الأسبوع الأول)" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">من</label>
              <input type="date" value={rotForm.start_date} onChange={(e) => setRotForm({ ...rotForm, start_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500">إلى</label>
              <input type="date" value={rotForm.end_date} onChange={(e) => setRotForm({ ...rotForm, end_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg outline-none" />
            </div>
          </div>

          <div>
            <label className="font-medium mb-2 block">شكل عرض كل سؤال</label>
            <div className="space-y-2">
              {rotQuestions.map((q, qi) => (
                <div key={q.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{qi + 1}. {q.question_text_ar || q.question_text}</span>
                  <select value={rotDisplayTypes[q.id] || 'radio_list'}
                    onChange={(e) => setRotDisplayTypes({ ...rotDisplayTypes, [q.id]: e.target.value })}
                    className="px-2 py-1 border rounded text-sm outline-none">
                    {displayTypes.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={createRotation} disabled={creatingRot || !rotForm.start_date || !rotForm.end_date}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
              {creatingRot ? 'جاري الإنشاء...' : 'إنشاء الدورة'}
            </button>
            <button onClick={() => setShowRotation(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
