import { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import SeverityIndicator from './SeverityIndicator';
import { getPlatformLabel, getSeverityConfig } from '@/utils/status';
import { useUserStore } from '@/store/userStore';
import { getInitials } from '@/utils/format';
import type { CrisisEvent, PlatformType, SeverityLevel } from '@/types';

interface EventFormProps {
  initialData?: Partial<CrisisEvent>;
  onSubmit: (data: Partial<CrisisEvent>) => void;
  onCancel: () => void;
  className?: string;
}

const CATEGORIES = ['产品', '服务', '人事', '财务', '其他'];
const PLATFORMS: PlatformType[] = [
  'weibo',
  'wechat',
  'douyin',
  'xiaohongshu',
  'zhihu',
  'baidu',
  'media',
  'other',
];

const toLocalInput = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EventForm({ initialData, onSubmit, onCancel, className }: EventFormProps) {
  const { users } = useUserStore();

  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || '产品');
  const [severity, setSeverity] = useState<SeverityLevel>((initialData?.severity as SeverityLevel) || 1);
  const [cause, setCause] = useState(initialData?.cause || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [discoveredAt, setDiscoveredAt] = useState(toLocalInput(initialData?.discoveredAt));
  const [platforms, setPlatforms] = useState<PlatformType[]>(initialData?.platforms || []);
  const [initialReach, setInitialReach] = useState(String(initialData?.initialReach || ''));
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [assignees, setAssignees] = useState<string[]>(initialData?.assignees || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (title) setErrors((p) => ({ ...p, title: '' }));
    if (cause) setErrors((p) => ({ ...p, cause: '' }));
  }, [title, cause]);

  const togglePlatform = (p: PlatformType) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleAssignee = (uid: string) => {
    setAssignees((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '请输入事件标题';
    if (!cause.trim()) newErrors.cause = '请输入事件起因';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      category,
      severity,
      cause: cause.trim(),
      description: description.trim(),
      discoveredAt: discoveredAt ? new Date(discoveredAt).toISOString() : undefined,
      platforms,
      initialReach: initialReach ? Number(initialReach) : 0,
      tags,
      assignees,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          事件标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入事件标题"
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2',
            errors.title
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">事件分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">初次发现时间</label>
          <input
            type="datetime-local"
            value={discoveredAt}
            onChange={(e) => setDiscoveredAt(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">严重程度</label>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((lv) => {
            const config = getSeverityConfig(lv as SeverityLevel);
            const active = severity === lv;
            return (
              <button
                key={lv}
                type="button"
                onClick={() => setSeverity(lv as SeverityLevel)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
                  active
                    ? cn('border-transparent shadow-md ring-2', config.bgColor, config.textColor, 'ring-offset-1')
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                )}
              >
                <SeverityIndicator level={lv as SeverityLevel} />
                <span className="text-xs font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          事件起因 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="描述事件发生的直接原因"
          rows={3}
          className={cn(
            'w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2',
            errors.cause
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
          )}
        />
        {errors.cause && <p className="mt-1 text-xs text-red-500">{errors.cause}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">详细描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="补充事件的详细情况、影响范围等"
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">涉及平台</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = platforms.includes(p);
            return (
              <label
                key={p}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => togglePlatform(p)}
                />
                {getPlatformLabel(p)}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          预估传播量级 <span className="text-gray-400 font-normal">(人)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            value={initialReach}
            onChange={(e) => setInitialReach(e.target.value)}
            placeholder="0"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            人
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          <TagIcon className="mr-1 inline h-4 w-4" />
          标签
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="rounded-full p-0.5 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="输入标签后按回车"
            className="flex-1 min-w-[120px] border-0 bg-transparent px-1 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={addTag}
            className="flex h-6 items-center gap-1 rounded-md bg-gray-100 px-2 text-xs text-gray-600 hover:bg-gray-200"
          >
            <Plus className="h-3 w-3" />
            添加
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          <Users className="mr-1 inline h-4 w-4" />
          参与成员
        </label>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            const active = assignees.includes(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleAssignee(u.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition-all',
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                    {getInitials(u.name)}
                  </div>
                )}
                <span>{u.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="h-9 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
        >
          {initialData?.id ? '保存修改' : '创建事件'}
        </button>
      </div>
    </form>
  );
}
