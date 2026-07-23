import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLecture, processLecture, downloadLecture } from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Loader2, Play, Sparkles, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LecturePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState('simple');
  const [extended, setExtended] = useState(false);

  useEffect(() => {
    loadLecture();
  }, [id]);

  const loadLecture = async () => {
    try {
      const res = await getLecture(id);
      setLecture(res.data);
      setMode(res.data.mode || 'simple');
    } catch {
      toast.error('Ошибка загрузки');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await processLecture(id, { mode, extended });
      toast.success('Лекция обработана');
      loadLecture();
    } catch {
      toast.error('Ошибка обработки');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await downloadLecture(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = lecture.filename.replace('.docx', '_simplified.docx');
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Ошибка скачивания');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-dark-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-100 truncate">{lecture?.filename}</h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-dark-400">Режим:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="input py-1.5 px-3 w-auto"
          >
            <option value="simple">Простой язык</option>
            <option value="extended">Расширенная информация</option>
          </select>
        </div>

        {mode === 'simple' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={extended}
              onChange={(e) => setExtended(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-dark-200 text-sm">+ расширенная информация</span>
          </label>
        )}

        <button
          onClick={handleProcess}
          disabled={processing}
          className="btn-primary flex items-center gap-2"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Обработать
        </button>

        {lecture?.result_text && (
          <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Скачать DOCX
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {lecture?.original_text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-dark-400" />
              <h2 className="text-lg font-semibold text-dark-200">Оригинал</h2>
            </div>
            <div className="text-dark-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {lecture.original_text}
            </div>
          </motion.div>
        )}

        {lecture?.result_text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card border-primary-600/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-primary-300">Результат</h2>
            </div>
            <div className="text-dark-200 whitespace-pre-wrap leading-relaxed">
              {lecture.result_text}
            </div>
          </motion.div>
        )}

        {lecture?.extended_text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card border-amber-600/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-amber-300">Дополнительная информация</h2>
            </div>
            <div className="text-dark-200 whitespace-pre-wrap leading-relaxed">
              {lecture.extended_text}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
