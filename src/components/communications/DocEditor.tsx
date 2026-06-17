import { useState, useMemo } from 'react';
import {
  X,
  Bold,
  Italic,
  List,
  Quote,
  Save,
  Send,
  Check,
  XCircle,
  ChevronDown,
  Clock,
  MessageSquare,
  User as UserIcon,
  History,
  FileText,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import ApprovalBadge from './ApprovalBadge';
import VersionHistory from './VersionHistory';
import Modal from '@/components/common/Modal';
import { formatDateTime, formatRelative } from '@/utils/date';
import { truncateText } from '@/utils/format';
import { getDocTypeConfig } from '@/utils/status';
import { useDocStore } from '@/store/docStore';
import { useUserStore } from '@/store/userStore';
import type {
  CommunicationDoc,
  DocumentType,
  DocVersion,
  User,
  ApprovalStatus,
} from '@/types';

interface DocEditorProps {
  docId?: string;
  eventId?: string;
  initialData?: Partial<CommunicationDoc>;
  onClose: () => void;
  users?: User[];
  className?: string;
}

const toolbarActions = [
  { key: 'bold', label: '加粗', icon: Bold, prefix: '**', suffix: '**', placeholder: '粗体文字' },
  { key: 'italic', label: '斜体', icon: Italic, prefix: '*', suffix: '*', placeholder: '斜体文字' },
  { key: 'list', label: '列表', icon: List, prefix: '\n- ', suffix: '', placeholder: '列表项' },
  {
    key: 'quote',
    label: '引用',
    icon: Quote,
    prefix: '\n> ',
    suffix: '',
    placeholder: '引用内容',
  },
];

const docTypeOptions: { value: DocumentType; label: string }[] = [
  { value: 'statement', label: '声明' },
  { value: 'media_reply', label: '媒体回复' },
  { value: 'internal_report', label: '内部汇报' },
  { value: 'other', label: '其他' },
];

export default function DocEditor({
  docId,
  eventId,
  initialData,
  onClose,
  users: externalUsers,
  className,
}: DocEditorProps) {
  const { docs, getDocById, addDoc, updateDoc, addDocVersion, submitForApproval, addApproval } =
    useDocStore();
  const { currentUser, getUserById, users: storeUsers } = useUserStore();

  const existingDoc = docId ? getDocById(docId) : undefined;
  const allUsers = externalUsers || storeUsers;

  const [title, setTitle] = useState(existingDoc?.title || initialData?.title || '');
  const [docType, setDocType] = useState<DocumentType>(
    existingDoc?.type || (initialData?.type as DocumentType) || 'statement'
  );
  const [content, setContent] = useState(
    existingDoc?.versions[existingDoc.versions.length - 1]?.content ||
      initialData?.versions?.[0]?.content ||
      ''
  );
  const [changeLog, setChangeLog] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<string>('');
  const [approvalComment, setApprovalComment] = useState('');
  const [showActionModal, setShowActionModal] = useState<'approve' | 'reject' | null>(null);
  const [actionComment, setActionComment] = useState('');

  const currentDoc = docId ? getDocById(docId) : undefined;
  const versions = currentDoc?.versions || [];
  const latestVersion = versions[versions.length - 1];
  const approvals = currentDoc?.approvals || [];
  const approvalStatus: ApprovalStatus = currentDoc?.approvalStatus || 'draft';

  const externalUserMap = useMemo(() => {
    return allUsers.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {} as Record<string, User>);
  }, [allUsers]);

  const getUser = (id: string) => externalUserMap[id] || getUserById(id);

  const canShowApprovalActions =
    currentUser &&
    currentDoc &&
    approvalStatus === 'pending' &&
    approvals.some(
      (a) => a.approverId === currentUser.id && a.status === 'pending' && !a.comment
    );

  const handleInsertMarkdown = (action: (typeof toolbarActions)[number]) => {
    const textarea = document.getElementById('doc-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || action.placeholder;
    const newText =
      content.substring(0, start) +
      action.prefix +
      selectedText +
      action.suffix +
      content.substring(end);

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + action.prefix.length + selectedText.length + action.suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSaveNewVersion = () => {
    if (!content.trim() || !changeLog.trim()) return;

    if (!currentDoc) {
      const newDoc = addDoc({
        eventId: eventId || initialData?.eventId,
        title,
        type: docType,
        createdBy: currentUser?.id,
      });
      addDocVersion(newDoc.id, content, changeLog, currentUser?.id || '');
    } else {
      if (title !== currentDoc.title || docType !== currentDoc.type) {
        updateDoc(currentDoc.id, { title, type: docType });
      }
      addDocVersion(currentDoc.id, content, changeLog, currentUser?.id || '');
    }
    setChangeLog('');
  };

  const handleSubmitForApproval = () => {
    if (!currentDoc || !latestVersion) return;
    submitForApproval(currentDoc.id, latestVersion.version);
    if (selectedApprover) {
      addApproval(currentDoc.id, latestVersion.version, selectedApprover, 'pending', '');
    }
    setShowApprovalModal(false);
    setSelectedApprover('');
  };

  const handleApprovalAction = (action: 'approve' | 'reject') => {
    if (!currentDoc || !latestVersion || !currentUser) return;
    const status: ApprovalStatus = action === 'approve' ? 'approved' : 'rejected';
    addApproval(
      currentDoc.id,
      latestVersion.version,
      currentUser.id,
      status,
      actionComment
    );
    setShowActionModal(null);
    setActionComment('');
  };

  const handleSelectOldVersion = (version: DocVersion) => {
    setContent(version.content);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {currentDoc ? '编辑文档' : '新建文档'}
            </h2>
            <p className="text-xs text-slate-500">
              {getDocTypeConfig(docType).label} ·{' '}
              {latestVersion ? `V${latestVersion.version}` : '新建'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentDoc && <ApprovalBadge status={approvalStatus} />}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0 border-r border-slate-200">
          <div className="p-4 bg-white border-b border-slate-100 space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入文档标题..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="relative">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none pr-8 bg-white"
                >
                  {docTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
              {toolbarActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => handleInsertMarkdown(action)}
                  title={action.label}
                  className="p-2 rounded-md text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all"
                >
                  <action.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 p-4 overflow-hidden">
            <textarea
              id="doc-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始编写文档内容，支持Markdown格式..."
              className="w-full h-full resize-none p-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent scroll-thin font-mono"
            />
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  变更说明 <span className="text-slate-400">(保存新版本必填)</span>
                </label>
                <input
                  type="text"
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  placeholder="描述本次修改的内容..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {versions.length > 0 && (
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all',
                    showVersionHistory
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <History className="w-4 h-4" />
                  历史版本
                </button>
              )}
              <Button
                onClick={handleSaveNewVersion}
                disabled={!content.trim() || !changeLog.trim()}
                leftIcon={<Save className="w-4 h-4" />}
              >
                保存新版本
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'flex-shrink-0 transition-all duration-300 overflow-hidden bg-white',
            showVersionHistory ? 'w-80' : 'w-0'
          )}
        >
          {showVersionHistory && (
            <VersionHistory
              versions={versions}
              currentVersion={latestVersion?.version || ''}
              onSelectVersion={handleSelectOldVersion}
              users={externalUsers}
              className="h-full border-l border-slate-100"
            />
          )}
        </div>

        <div className="w-80 flex flex-col flex-shrink-0 bg-white">
          <div className="p-4 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              审批状态
            </h3>
            <div className="mb-3">
              <ApprovalBadge status={approvalStatus} className="text-sm px-3 py-1" />
            </div>
            {latestVersion && (
              <div className="text-xs text-slate-500 space-y-1">
                <p>当前版本：V{latestVersion.version}</p>
                <p>创建时间：{formatDateTime(latestVersion.createdAt)}</p>
                <p>
                  创建人：
                  {getUser(latestVersion.createdBy)?.name || '未知用户'}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-b border-slate-100 space-y-2 flex-shrink-0">
            {approvalStatus === 'draft' && (
              <Button
                onClick={() => setShowApprovalModal(true)}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full"
                disabled={!latestVersion}
              >
                提交审批
              </Button>
            )}

            {canShowApprovalActions && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowActionModal('approve')}
                  variant="success"
                  leftIcon={<Check className="w-4 h-4" />}
                  size="sm"
                >
                  通过
                </Button>
                <Button
                  onClick={() => setShowActionModal('reject')}
                  variant="danger"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  size="sm"
                >
                  驳回
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 scroll-thin">
            <h4 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              审批历史
            </h4>
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">暂无审批记录</p>
              ) : (
                approvals
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((approval) => {
                    const approver = getUser(approval.approverId);
                    return (
                      <div
                        key={approval.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          approval.status === 'approved'
                            ? 'border-green-100 bg-green-50'
                            : approval.status === 'rejected'
                            ? 'border-red-100 bg-red-50'
                            : 'border-yellow-100 bg-yellow-50'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar
                            src={approver?.avatar}
                            name={approver?.name || '未知'}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">
                              {approver?.name || '未知用户'}
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelative(approval.createdAt)}
                            </p>
                          </div>
                          <ApprovalBadge status={approval.status as ApprovalStatus} />
                        </div>
                        {approval.comment && (
                          <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                            {truncateText(approval.comment, 100)}
                          </p>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showApprovalModal}
        title="提交审批"
        onClose={() => setShowApprovalModal(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowApprovalModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitForApproval}
              disabled={!selectedApprover}
              leftIcon={<Send className="w-4 h-4" />}
            >
              提交
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            选择审批人，提交后文档状态将变为"待审批"。
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              审批人 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedApprover}
              onChange={(e) => setSelectedApprover(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择审批人...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={showActionModal !== null}
        title={showActionModal === 'approve' ? '审批通过' : '审批驳回'}
        onClose={() => {
          setShowActionModal(null);
          setActionComment('');
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowActionModal(null);
                setActionComment('');
              }}
            >
              取消
            </Button>
            <Button
              variant={showActionModal === 'approve' ? 'success' : 'danger'}
              onClick={() => showActionModal && handleApprovalAction(showActionModal)}
              leftIcon={showActionModal === 'approve' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            >
              确认{showActionModal === 'approve' ? '通过' : '驳回'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {showActionModal === 'approve'
              ? '请填写审批意见（选填），确认通过后文档状态将变更为"已通过"。'
              : '请填写驳回原因，确认驳回后文档状态将变更为"已驳回"。'}
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              审批意见 {showActionModal === 'reject' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder={showActionModal === 'approve' ? '请输入审批意见...' : '请填写驳回原因...'}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
