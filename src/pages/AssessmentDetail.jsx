import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Modal from '../components/Modal';

const displayTypes = [
  { value: 'radio_list', label: 'قائمة عمودية' },
  { value: 'card_select', label: 'بطاقات' },
  { value: 'emoji_scale', label: 'إيموجي' },
  { value: 'slider_select', label: 'شريط تمرير' },
  { value: 'image_cards', label: 'بطاقات مع أيقونات' },
];

const defaultOptions = () => [
  { option_text_ar: 'أبداً', option_value: 0, emoji: '😊' },
  { option_text_ar: 'أحياناً', option_value: 1, emoji: '😐' },
  { option_text_ar: 'كثيراً', option_value: 2, emoji: '😔' },
  { option_text_ar: 'دائماً', option_value: 3, emoji: '😢' },
];

const statusBadges = {
  active: { label: 'نشطة الآن', cls: 'bg-green-100 text-green-700' },
  upcoming: { label: 'قادمة', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'منتهية', cls: 'bg-gray-100 text-gray-600' },
  disabled: { label: 'معطلة', cls: 'bg-red-50 text-red-600' },
};

export default function AssessmentDetail() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [rotations, setRotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  // Question modal
  const [qModal, setQModal] = useState({ open: false, editing: null });
  const [qForm, setQForm] = useState({ question_text_ar: '', is_required: true, options: defaultOptions() });
  const [qSaving, setQSaving] = useState(false);
  const [qError, setQError] = useState('');

  // Rotation modal
  const [rotModal, setRotModal] = useState({ open: false, editing: null });
  const [rotForm, setRotForm] = useState({ title: '', start_date: '', end_date: '', selectedQuestions: {} });
  const [rotSaving, setRotSaving] = useState(false);
  const [rotError, setRotError] = useState('');

  useEffect(() => {
    loadAssessment();
    loadRotations();
  }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const res = await api(`/assessments/${id}`);
      if (res.success) setAssessment(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadRotations = async () => {
    try {
      const res = await api(`/assessments/rotations/list/${id}`);
      if (res.success) setRotations(res.data);
    } catch (e) { console.error(e); }
  };

  // ═══════════════════════════════════════════════════════════
  // QUESTIONS
  // ═══════════════════════════════════════════════════════════
  const openNewQuestion = () => {
    setQForm({ question_text_ar: '', is_required: true, options: defaultOptions() });
    setQError('');
    setQModal({ open: true, editing: null });
  };

  const openEditQuestion = (q) => {
    setQForm({
      question_text_ar: q.question_text_ar || q.question_text,
      is_required: q.is_required === 1,
      options: q.options.map((o) => ({
        option_text_ar: o.option_text_ar || o.option_text,
        option_value: o.option_value,
        emoji: o.emoji || '',
      })),
    });
    setQError('');
    setQModal({ open: true, editing: q });
  };

  const saveQuestion = async () => {
    setQError('');
    if (!qForm.question_text_ar.trim()) {
      setQError('نص السؤال مطلوب');
      return;
    }
    if (qForm.options.length < 2) {
      setQError('يجب أن يكون هناك خياران على الأقل');
      return;
    }
    for (let i = 0; i < qForm.options.length; i++) {
      if (!qForm.options[i].option_text_ar.trim()) {
        setQError(`الخيار ${i + 1}: النص مطلوب`);
        return;
      }
    }

    setQSaving(true);
    try {
      const payload = {
        question_text_ar: qForm.question_text_ar.trim(),
        question_text: qForm.question_text_ar.trim(),
        is_required: qForm.is_required,
        options: qForm.options.map(o => ({
          option_text_ar: o.option_text_ar.trim(),
          option_text: o.option_text_ar.trim(),
          option_value: o.option_value,
          emoji: o.emoji || null,
        })),
      };

      const url = qModal.editing
        ? `/assessments/questions/${qModal.editing.id}`
        : `/assessments/${id}/questions`;
      const method = qModal.editing ? 'PUT' : 'POST';

      const res = await api(url, { method, body: JSON.stringify(payload) });
      if (res.success) {
        setQModal({ open: false, editing: null });
        await loadAssessment();
      } else {
        setQError(res.message || 'فشل الحفظ');
      }
    } catch (e) {
      setQError('خطأ: ' + e.message);
    } finally {
      setQSaving(false);
    }
  };

  const deleteQuestion = async (qid) => {
    if (!confirm('حذف هذا السؤال؟')) return;
    try {
      const res = await api(`/assessments/questions/${qid}`, { method: 'DELETE' });
      if (res.success) loadAssessment();
    } catch (e) { console.error(e); }
  };

  // ═══════════════════════════════════════════════════════════
  // ROTATIONS
  // ═══════════════════════════════════════════════════════════
  const openNewRotation = () => {
    if (!assessment?.questions?.length) {
      alert('أضف أسئلة أولاً قبل إنشاء دورة');
      return;
    }
    const selected = {};
    assessment.questions.forEach((q) => { selected[q.id] = 'radio_list'; });
    setRotForm({ title: '', start_date: '', end_date: '', selectedQuestions: selected });
    setRotError('');
    setRotModal({ open: true, editing: null });
  };

  const openEditRotation = async (rotation) => {
    try {
      const res = await api(`/assessments/rotations/${rotation.id}`);
      if (res.success) {
        const selected = {};
        res.data.questions.forEach((q) => { selected[q.question_id] = q.display_type; });
        setRotForm({
          title: rotation.title || '',
          start_date: (rotation.start_date || '').split('T')[0],
          end_date: (rotation.end_date || '').split('T')[0],
          selectedQuestions: selected,
        });
        setRotError('');
        setRotModal({ open: true, editing: rotation });
      }
    } catch (e) { console.error(e); }
  };

  const saveRotation = async () => {
    setRotError('');
    if (!rotForm.start_date || !rotForm.end_date) {
      setRotError('تاريخا البداية والنهاية مطلوبان');
      return;
    }
    if (new Date(rotForm.end_date) < new Date(rotForm.start_date)) {
      setRotError('تاريخ النهاية يجب أن يكون بعد البداية');
      return;
    }
    const questionIds = Object.keys(rotForm.selectedQuestions);
    if (questionIds.length === 0) {
      setRotError('اختر سؤال واحد على الأقل');
      return;
    }

    setRotSaving(true);
    try {
      const questions = questionIds.map((qid) => ({
        question_id: parseInt(qid),
        display_type: rotForm.selectedQuestions[qid],
      }));

      const payload = {
        title: rotForm.title.trim() || null,
        start_date: rotForm.start_date,
        end_date: rotForm.end_date,
        questions,
      };

      let res;
      if (rotModal.editing) {
        res = await api(`/assessments/rotations/${rotModal.editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await api('/assessments/rotations/create', {
          method: 'POST',
          body: JSON.stringify({ assessment_id: parseInt(id), ...payload }),
        });
      }

      if (res.success) {
        setRotModal({ open: false, editing: null });
        await loadRotations();
      } else {
        setRotError(res.message || 'فشل الحفظ');
      }
    } catch (e) {
      setRotError('خطأ: ' + e.message);
    } finally {
      setRotSaving(false);
    }
  };

  const toggleRotation = async (rid) => {
    try {
      const res = await api(`/assessments/rotations/${rid}/toggle`, { method: 'PATCH' });
      if (res.success) loadRotations();
    } catch (e) { console.error(e); }
  };

  const deleteRotation = async (rid) => {
    if (!confirm('حذف هذه الدورة؟')) return;
    try {
      const res = await api(`/assessments/rotations/${rid}`, { method: 'DELETE' });
      if (res.success) loadRotations();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center text-gray-400 py-12">جاري التحميل...</div>;
  if (!assessment) return <div className="text-center text-gray-400 py-12">الاختبار غير موجود</div>;

  const categoryLabels = {
    mental_health: 'صحة نفسية',
    anxiety: 'قلق',
    depression: 'اكتئاب',
    stress: 'ضغط نفسي',
    general: 'عام',
  };

  return (
    <div>
      {/* Header */}
      <button onClick={() => navigate('/assessments')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        → كل الاختبارات
      </button>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{assessment.title_ar}</h1>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              {categoryLabels[assessment.category] || assessment.category}
            </span>
          </div>
          <span className={`text-xs px-3 py-1 rounded self-start ${assessment.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {assessment.is_active ? 'نشط' : 'معطل'}
          </span>
        </div>
        {assessment.description_ar && (
          <p className="text-gray-600 mt-2 text-sm sm:text-base">{assessment.description_ar}</p>
        )}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-100 text-sm">
          <div><span className="font-bold">{assessment.questions?.length || 0}</span> سؤال</div>
          <div><span className="font-bold">{rotations.length}</span> دورة</div>
          <div>الحد الأقصى: <span className="font-bold">{assessment.max_score || 0}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 font-medium ${activeTab === 'questions' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}>
          الأسئلة ({assessment.questions?.length || 0})
        </button>
        <button onClick={() => setActiveTab('rotations')}
          className={`px-4 py-2 font-medium ${activeTab === 'rotations' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}>
          الدورات ({rotations.length})
        </button>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">بنك الأسئلة - تستخدم في الدورات</div>
            <button onClick={openNewQuestion}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              + سؤال جديد
            </button>
          </div>

          {(!assessment.questions || assessment.questions.length === 0) && (
            <div className="text-center text-gray-400 py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <div className="text-4xl mb-2">❓</div>
              <div>لا يوجد أسئلة بعد</div>
              <div className="text-sm">أضف سؤال جديد لتبدأ</div>
            </div>
          )}

          <div className="space-y-3">
            {assessment.questions?.map((q, qi) => (
              <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-gray-400 mt-1">#{qi + 1}</span>
                      <h3 className="font-bold text-gray-800 break-words">{q.question_text_ar || q.question_text}</h3>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditQuestion(q)}
                      className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">تعديل</button>
                    <button onClick={() => deleteQuestion(q.id)}
                      className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded">حذف</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {q.options?.map((o) => (
                    <div key={o.id} className="bg-gray-50 rounded px-3 py-2 text-sm flex items-center gap-2">
                      {o.emoji && <span>{o.emoji}</span>}
                      <span className="flex-1 break-words">{o.option_text_ar || o.option_text}</span>
                      <span className="text-xs text-gray-400">({o.option_value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rotations Tab */}
      {activeTab === 'rotations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">
              الدورات تحدد أي أسئلة تظهر للمستخدمين وفي أي فترة زمنية
            </div>
            <button onClick={openNewRotation}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              + دورة جديدة
            </button>
          </div>

          {rotations.length === 0 && (
            <div className="text-center text-gray-400 py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <div className="text-4xl mb-2">📅</div>
              <div>لا يوجد دورات بعد</div>
              <div className="text-sm">أنشئ دورة لتفعيل الاختبار للمستخدمين</div>
            </div>
          )}

          <div className="space-y-3">
            {rotations.map((r) => {
              const badge = statusBadges[r.status_label] || statusBadges.disabled;
              return (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{r.title || 'بدون عنوان'}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        من {(r.start_date || '').split('T')[0]} إلى {(r.end_date || '').split('T')[0]}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <button onClick={() => toggleRotation(r.id)}
                        className={`text-sm px-3 py-1 rounded ${r.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {r.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button onClick={() => openEditRotation(r)}
                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">تعديل</button>
                      <button onClick={() => deleteRotation(r.id)}
                        className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded">حذف</button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>{r.questions_count} سؤال</span>
                    <span>{r.responses_count} مشارك</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Question Modal ═══ */}
      <Modal open={qModal.open} onClose={() => setQModal({ open: false, editing: null })}
        title={qModal.editing ? 'تعديل سؤال' : 'سؤال جديد'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          {qError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">⚠️ {qError}</div>
          )}

          <div>
            <label className="text-sm text-gray-600 block mb-1">نص السؤال *</label>
            <input type="text" value={qForm.question_text_ar}
              onChange={(e) => setQForm({ ...qForm, question_text_ar: e.target.value })}
              placeholder="مثل: كم مرة شعرت بالقلق هذا الأسبوع؟"
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={qForm.is_required}
              onChange={(e) => setQForm({ ...qForm, is_required: e.target.checked })} />
            سؤال إجباري
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">الخيارات</label>
              <button onClick={() => setQForm({
                ...qForm,
                options: [...qForm.options, { option_text_ar: '', option_value: qForm.options.length, emoji: '' }]
              })} className="text-primary-500 text-xs hover:underline">+ خيار</button>
            </div>
            <div className="space-y-2">
              {qForm.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6">{oi + 1}.</span>
                  <input type="text" value={o.option_text_ar}
                    onChange={(e) => {
                      const opts = [...qForm.options];
                      opts[oi] = { ...opts[oi], option_text_ar: e.target.value };
                      setQForm({ ...qForm, options: opts });
                    }}
                    placeholder="نص الخيار"
                    className="flex-1 px-3 py-1 border rounded text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="number" value={o.option_value}
                    onChange={(e) => {
                      const opts = [...qForm.options];
                      opts[oi] = { ...opts[oi], option_value: parseInt(e.target.value) || 0 };
                      setQForm({ ...qForm, options: opts });
                    }}
                    title="القيمة (للنتيجة)"
                    className="w-16 px-2 py-1 border rounded text-sm outline-none text-center" />
                  <input type="text" value={o.emoji}
                    onChange={(e) => {
                      const opts = [...qForm.options];
                      opts[oi] = { ...opts[oi], emoji: e.target.value };
                      setQForm({ ...qForm, options: opts });
                    }}
                    placeholder="😊"
                    className="w-14 px-2 py-1 border rounded text-sm outline-none text-center" />
                  <button onClick={() => setQForm({ ...qForm, options: qForm.options.filter((_, i) => i !== oi) })}
                    className="text-red-500 hover:bg-red-50 rounded px-2">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={saveQuestion} disabled={qSaving}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
              {qSaving ? 'جاري الحفظ...' : (qModal.editing ? 'تحديث' : 'إضافة')}
            </button>
            <button onClick={() => setQModal({ open: false, editing: null })}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* ═══ Rotation Modal ═══ */}
      <Modal open={rotModal.open} onClose={() => setRotModal({ open: false, editing: null })}
        title={rotModal.editing ? 'تعديل دورة' : 'دورة جديدة'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          {rotError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">⚠️ {rotError}</div>
          )}

          <div>
            <label className="text-sm text-gray-600 block mb-1">عنوان الدورة (اختياري)</label>
            <input type="text" value={rotForm.title}
              onChange={(e) => setRotForm({ ...rotForm, title: e.target.value })}
              placeholder="مثل: الأسبوع الأول، يناير 2025"
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">من *</label>
              <input type="date" value={rotForm.start_date}
                onChange={(e) => setRotForm({ ...rotForm, start_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">إلى *</label>
              <input type="date" value={rotForm.end_date}
                onChange={(e) => setRotForm({ ...rotForm, end_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg outline-none" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">الأسئلة وشكل العرض</label>
            <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {assessment.questions?.map((q) => {
                const isSelected = rotForm.selectedQuestions.hasOwnProperty(q.id);
                return (
                  <div key={q.id} className={`p-2 rounded ${isSelected ? 'bg-primary-50' : 'bg-gray-50'}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isSelected}
                        onChange={(e) => {
                          const updated = { ...rotForm.selectedQuestions };
                          if (e.target.checked) updated[q.id] = 'radio_list';
                          else delete updated[q.id];
                          setRotForm({ ...rotForm, selectedQuestions: updated });
                        }} />
                      <span className="flex-1 text-sm">{q.question_text_ar || q.question_text}</span>
                      {isSelected && (
                        <select value={rotForm.selectedQuestions[q.id]}
                          onChange={(e) => setRotForm({
                            ...rotForm,
                            selectedQuestions: { ...rotForm.selectedQuestions, [q.id]: e.target.value }
                          })}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 border rounded text-xs">
                          {displayTypes.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                        </select>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              مختار: {Object.keys(rotForm.selectedQuestions).length} من {assessment.questions?.length || 0}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={saveRotation} disabled={rotSaving}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
              {rotSaving ? 'جاري الحفظ...' : (rotModal.editing ? 'تحديث' : 'إنشاء')}
            </button>
            <button onClick={() => setRotModal({ open: false, editing: null })}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
