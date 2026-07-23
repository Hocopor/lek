import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, Trash2, FileText, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      toast.error('Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createProject({ name: newName.trim(), description: newDesc.trim() });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      toast.success('Проект создан');
      loadProjects();
    } catch {
      toast.error('Ошибка создания проекта');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Удалить проект и все его лекции?')) return;
    try {
      await deleteProject(id);
      toast.success('Проект удалён');
      loadProjects();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-100">Проекты</h1>
          <p className="text-dark-400 mt-1">Управляйте вашими лекциями</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Новый проект
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Новый проект</h2>
                <button onClick={() => setShowCreate(false)} className="text-dark-400 hover:text-dark-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название проекта"
                  className="input"
                  autoFocus
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Описание (необязательно)"
                  className="input"
                />
                <div className="flex gap-3">
                  <button type="submit" disabled={creating || !newName.trim()} className="btn-primary flex items-center gap-2">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Создать
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Folder className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-dark-300">Нет проектов</h3>
          <p className="text-dark-500 mt-2">Создайте первый проект, чтобы начать</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/project/${project.id}`)}
              className="card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary-600/10 border border-primary-600/20">
                  <Folder className="w-6 h-6 text-primary-400" />
                </div>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-600/10 text-dark-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-dark-100 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-dark-400 text-sm mb-3">{project.description}</p>
              )}
              <div className="flex items-center gap-2 text-dark-500 text-sm">
                <FileText className="w-4 h-4" />
                {project.lecture_count} лекций
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
