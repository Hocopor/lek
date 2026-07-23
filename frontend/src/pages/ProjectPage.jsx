import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProject, getLectures, uploadLectures, processLecture,
  deleteLecture, getProjectSummary
} from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, FileText, Trash2, Loader2, Play, Download,
  Sparkles, BookOpen, Settings2, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [project, setProject] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedLectures, setSelectedLectures] = useState([]);
  const [processMode, setProcessMode] = useState('simple');
  const [extended, setExtended] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadData = async () => {
    try {
      const [projRes, lectRes] = await Promise.all([
        getProject(id),
        getLectures(id),
      ]);
      setProject(projRes.data);
      setLectures(lectRes.data);
    } catch {
      toast.error('Ошибка загрузки');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      await uploadLectures(id, files);
      toast.success(`Загружено ${files.length} лекций`);
      loadData();
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleProcess = async (lectureId) => {
    setProcessing((prev) => ({ ...prev, [lectureId]: true }));
    try {
      await processLecture(lectureId, { mode: processMode, extended });
      toast.success('Лекция обработана');
      loadData();
    } catch {
      toast.error('Ошибка обработки');
    } finally {
      setProcessing((prev) => ({ ...prev, [lectureId]: false }));
    }
  };

  const handleProcessSelected = async () => {
    if (!selectedLectures.length) return;
    for (const id of selectedLectures) {
      await handleProcess(id);
    }
    setSelectedLectures([]);
  };

  const handleDelete = async (e, lectureId) => {
    e.stopPropagation();
    if (!confirm('Удалить лекцию?')) return;
    try {
      await deleteLecture(lectureId);
      toast.success('Лекция удалена');
      loadData();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await getProjectSummary(id);
      setSummary(res.data);
      toast.success('Выжимка готова');
    } catch {
      toast.error('Ошибка создания выжимки');
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleSelect = (lectureId) => {
    setSelectedLectures((prev) =>
      prev.includes(lectureId)
        ? prev.filter((i) => i !== lectureId)
        : [...prev, lectureId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-dark-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-dark-100">{project?.name}</h1>
          {project?.description && (
            <p className="text-dark-400 mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Загрузить лекции
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".docx"
          onChange={handleUpload}
          className="hidden"
        />

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings2 className="w-4 h-4" />
          Настройки обработки
          <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>

        {selectedLectures.length > 0 && (
          <button
            onClick={handleProcessSelected}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Обработать выбранные ({selectedLectures.length})
          </button>
        )}

        {lectures.length > 1 && (
          <button
            onClick={handleSummary}
            disabled={summaryLoading}
            className="btn-secondary flex items-center gap-2"
          >
            {summaryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            Выжимка из всех лекций
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="card">
              <h3 className="text-sm font-medium text-dark-300 mb-3">Режим обработки</h3>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="simple"
                    checked={processMode === 'simple'}
                    onChange={(e) => setProcessMode(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-dark-200">Простой язык</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="extended"
                    checked={processMode === 'extended'}
                    onChange={(e) => setProcessMode(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-dark-200">С расширенной информацией</span>
                </label>
              </div>
              {processMode === 'simple' && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extended}
                    onChange={(e) => setExtended(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-dark-200">Добавить расширенную информацию</span>
                </label>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="card border-primary-600/30">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-semibold">Выжимка из {summary.lecture_count} лекций</h3>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="text-dark-200 whitespace-pre-wrap leading-relaxed">
                  {summary.summary}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {lectures.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FileText className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-dark-300">Нет лекций</h3>
          <p className="text-dark-500 mt-2">Загрузите DOCX файлы, чтобы начать</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture, i) => (
            <motion.div
              key={lecture.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card flex items-center gap-4"
            >
              <input
                type="checkbox"
                checked={selectedLectures.includes(lecture.id)}
                onChange={() => toggleSelect(lecture.id)}
                className="w-4 h-4 text-primary-600 rounded"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-dark-400 shrink-0" />
                  <span className="text-dark-200 truncate">{lecture.filename}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {lecture.status === 'completed' && <span className="badge-success">Обработано</span>}
                  {lecture.status === 'processing' && <span className="badge-warning">Обработка...</span>}
                  {lecture.status === 'pending' && <span className="badge-info">Ожидает</span>}
                  {lecture.status === 'error' && <span className="badge-error">Ошибка</span>}
                  <span className="text-dark-500 text-xs">{lecture.mode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lecture.status === 'completed' && (
                  <a
                    href={`/api/lectures/${lecture.id}/download`}
                    className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-primary-400 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => navigate(`/lecture/${lecture.id}`)}
                  className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-primary-400 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, lecture.id)}
                  className="p-2 rounded-lg hover:bg-red-600/10 text-dark-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleProcess(lecture.id)}
                  disabled={processing[lecture.id]}
                  className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                >
                  {processing[lecture.id] ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Обработать
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
