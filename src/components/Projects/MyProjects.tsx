import React, { useState } from 'react';
import { ProjectItem, HouseSpec } from '../../types/house';
import {
  FolderKanban,
  Building,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  Share2,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';

interface MyProjectsProps {
  projects: ProjectItem[];
  onOpenProject: (spec: HouseSpec) => void;
  onCreateNew: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: ProjectItem) => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onShareProject: (project: ProjectItem) => void;
}

export const MyProjects: React.FC<MyProjectsProps> = ({
  projects,
  onOpenProject,
  onCreateNew,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onShareProject,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (p: ProjectItem) => {
    setEditingId(p.id);
    setEditTitle(p.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameProject(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-xs font-medium mb-3">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Project Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">My Architecture Projects</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your generated residential blueprints, 3D models, and revisions.
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Design</span>
          </button>
        </div>

        {/* Project Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-8">
            <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Describe your dream home in natural language and generate your first interactive 3D model!
            </p>
            <button
              onClick={onCreateNew}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Start Generating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden shadow-lg group"
              >
                {/* Visual Header */}
                <div
                  onClick={() => onOpenProject(proj.spec)}
                  className="h-44 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 p-4 relative cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/90 text-indigo-300 border border-slate-700">
                      {proj.spec.style}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Building className="w-20 h-20 text-indigo-400/20 absolute right-4 bottom-2 group-hover:scale-105 transition-transform" />

                  <div className="z-10 text-xs font-mono font-semibold text-white">
                    {proj.spec.stats.livableArea} m² • {proj.spec.stats.bedroomCount} Beds • {proj.spec.stats.floorCount} Fl
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {editingId === proj.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(proj.id)}
                          autoFocus
                          className="flex-1 bg-slate-800 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => saveRename(proj.id)}
                          className="px-2 py-1 bg-indigo-600 rounded text-[11px] text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3
                        onClick={() => onOpenProject(proj.spec)}
                        className="font-bold text-white text-sm hover:text-indigo-300 cursor-pointer transition-colors"
                      >
                        {proj.title}
                      </h3>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {proj.description || proj.prompt}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onOpenProject(proj.spec)}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>Open Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        onClick={() => startRename(proj)}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateProject(proj)}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onShareProject(proj)}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Share link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
